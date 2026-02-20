from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
import enum
from back.db.database import Base

class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)

    role = Column(Enum(UserRole), default=UserRole.user, nullable=False)

    uploads = relationship("Upload", back_populates="user")