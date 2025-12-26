from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from back.db.database import get_db
from back.models.user import User
from back.models.flashcards import Flashcard
from back.routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/cards", tags=["cards"])


class CardCreate(BaseModel):
    question: str
    answer: str


@router.get("/{upload_id}")
def get_cards(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cards = db.query(Flashcard).filter(Flashcard.upload_id == upload_id).all()
    return cards