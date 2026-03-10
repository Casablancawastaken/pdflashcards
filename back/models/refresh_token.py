from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func, Index
from back.db.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)

    jti = Column(String, unique=True, nullable=False, index=True)

    token_hash = Column(String, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    revoked = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)


Index("ix_refresh_user_revoked", RefreshToken.user_id, RefreshToken.revoked)