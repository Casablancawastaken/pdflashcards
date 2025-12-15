from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from back.models.flashcards import Flashcard


from back.db.database import Base


class UploadStatus(str, enum.Enum):
    uploaded = "uploaded"
    generating = "generating"
    done = "done"
    error = "error"


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    status = Column(
        Enum(UploadStatus),
        default=UploadStatus.uploaded,
        nullable=False,
    )

    user = relationship("User", back_populates="uploads")
    cards = relationship(
        "Flashcard",
        backref="upload",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
