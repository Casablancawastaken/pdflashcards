from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from back.db.database import Base
from back.models.flashcards import Flashcard


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="uploads")
    cards = relationship(
        "Flashcard",
        backref="upload",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
