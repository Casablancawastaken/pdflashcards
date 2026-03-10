from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from datetime import timedelta

from back.db.database import get_db, Base, engine, SessionLocal
from back.models.user import User, UserRole
from back.models.refresh_token import RefreshToken  
from back.schemas.user import UserCreate, UserLogin, UserOut
from back.services.auth import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM

from back.repositories.refresh_tokens import RefreshTokenRepository
from back.services.sessions import SessionService

from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["auth"])

Base.metadata.create_all(bind=engine)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_session_service() -> SessionService:
    return SessionService(RefreshTokenRepository())


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise JWTError()
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный токен")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден")
        return user
    finally:
        db.close()


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    return current_user


@router.post("/register", response_model=UserOut)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")

    is_first_user = db.query(User).count() == 0
    role = UserRole.admin if is_first_user else UserRole.user

    hashed_pw = hash_password(user.password)
    db_user = User(username=user.username, email=user.email, hashed_password=hashed_pw, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
    sessions: SessionService = Depends(get_session_service),
):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверное имя пользователя или пароль")

    return sessions.issue_tokens(db, db_user)


@router.post("/refresh")
def refresh_tokens(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    sessions: SessionService = Depends(get_session_service),
):
    try:
        return sessions.refresh(db, refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
def logout(
    refresh_token: str = Body(..., embed=True),
    all_sessions: bool = Body(False, embed=True),
    db: Session = Depends(get_db),
    sessions: SessionService = Depends(get_session_service),
):
    sessions.logout(db, refresh_token, all_sessions=all_sessions)
    return {"message": "Logged out"}


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/change-password")
def change_password(
    old_password: str = Body(...),
    new_password: str = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")

    current_user.hashed_password = hash_password(new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Пароль успешно изменён"}


# --- ADMIN ONLY ---
@router.put("/admin/set-role")
def admin_set_role(
    username: str = Body(...),
    role: str = Body(...),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if role not in [UserRole.user.value, UserRole.admin.value]:
        raise HTTPException(status_code=400, detail="Некорректная роль")

    target.role = UserRole(role)
    db.commit()
    return {"message": "Роль обновлена", "username": target.username, "role": target.role.value}