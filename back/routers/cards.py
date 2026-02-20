from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from back.db.database import get_db
from back.models.user import User, UserRole
from back.models.flashcards import Flashcard
from back.models.upload import Upload
from back.routers.auth import get_current_user

router = APIRouter(prefix="/cards", tags=["cards"])

@router.get("/{upload_id}")
def get_cards(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if upload.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    cards = db.query(Flashcard).filter(Flashcard.upload_id == upload_id).all()
    return cards