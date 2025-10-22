from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from back.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)

    uploads = relationship("Upload", back_populates="user")
