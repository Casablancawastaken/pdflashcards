from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from back.db.database import get_db
from back.models.upload import Upload
from back.models.user import User, UserRole
from back.routers.auth import get_current_user
from back.services.books_api import search_books

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/by-upload/{upload_id}")
def get_books_by_upload(
    upload_id: int,
    q: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if upload.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    query = (q or upload.title or upload.filename or "").strip()

    try:
        return search_books(query)
    except RuntimeError as e:
        if str(e) == "Rate limit exceeded":
            raise HTTPException(status_code=429, detail="Слишком много запросов к внешнему API")
        raise HTTPException(status_code=502, detail="Внешний API временно недоступен")