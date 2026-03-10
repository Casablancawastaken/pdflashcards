import hashlib
import uuid
from datetime import datetime, timedelta
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from back.repositories.refresh_tokens import RefreshTokenRepository
from back.models.user import User
from back.services.auth import SECRET_KEY, ALGORITHM, create_access_token


ACCESS_TTL_MINUTES = 0.2
REFRESH_TTL_DAYS = 7


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class SessionService:
    def __init__(self, repo: RefreshTokenRepository):
        self.repo = repo

    def issue_tokens(self, db: Session, user: User) -> dict:
        access = create_access_token({"sub": user.username}, timedelta(minutes=ACCESS_TTL_MINUTES))

        jti = str(uuid.uuid4())
        refresh_exp = datetime.utcnow() + timedelta(days=REFRESH_TTL_DAYS)

        refresh_payload = {
            "sub": user.username,
            "jti": jti,
            "type": "refresh",
            "exp": refresh_exp,
        }
        refresh = jwt.encode(refresh_payload, SECRET_KEY, algorithm=ALGORITHM)

        self.repo.create(
            db,
            jti=jti,
            token_hash=_hash_token(refresh),
            user_id=user.id,
            expires_at=refresh_exp,
        )

        return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

    def refresh(self, db: Session, refresh_token: str) -> dict:
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") != "refresh":
                raise JWTError()
            username = payload.get("sub")
            jti = payload.get("jti")
            if not username or not jti:
                raise JWTError()
        except JWTError:
            raise ValueError("Invalid refresh token")

        rt = self.repo.get_by_jti(db, jti)
        if not rt:
            raise ValueError("Refresh token not found")
        if rt.revoked:
            raise ValueError("Refresh token revoked")
        if rt.expires_at < datetime.utcnow():
            raise ValueError("Refresh token expired")

        if rt.token_hash != _hash_token(refresh_token):
            self.repo.revoke(db, rt)
            raise ValueError("Refresh token mismatch")

        self.repo.revoke(db, rt)

        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise ValueError("User not found")

        return self.issue_tokens(db, user)

    def logout(self, db: Session, refresh_token: str, *, all_sessions: bool = False) -> None:
        if all_sessions:
            try:
                payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
                username = payload.get("sub")
            except JWTError:
                return

            user = db.query(User).filter(User.username == username).first()
            if user:
                self.repo.revoke_all_for_user(db, user.id)
            return

        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            jti = payload.get("jti")
        except JWTError:
            return

        if not jti:
            return

        rt = self.repo.get_by_jti(db, jti)
        if rt and not rt.revoked:
            self.repo.revoke(db, rt)