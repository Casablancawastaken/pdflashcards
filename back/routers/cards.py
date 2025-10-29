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


@router.post("/{upload_id}")
def create_card(
    upload_id: int,
    card: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_card = Flashcard(
        upload_id=upload_id,
        question=card.question,
        answer=card.answer,
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card


@router.delete("/{card_id}")
def delete_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(Flashcard).filter(Flashcard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")

    db.delete(card)
    db.commit()
    return {"message": "Карточка удалена"}
