from sqlalchemy.orm import Session
from datetime import datetime
from back.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def create(self, db: Session, *, jti: str, token_hash: str, user_id: int, expires_at: datetime) -> RefreshToken:
        rt = RefreshToken(
            jti=jti,
            token_hash=token_hash,
            user_id=user_id,
            expires_at=expires_at,
            revoked=False,
        )
        db.add(rt)
        db.commit()
        db.refresh(rt)
        return rt

    def get_by_jti(self, db: Session, jti: str) -> RefreshToken | None:
        return db.query(RefreshToken).filter(RefreshToken.jti == jti).first()

    def revoke(self, db: Session, rt: RefreshToken) -> None:
        rt.revoked = True
        db.add(rt)
        db.commit()

    def revoke_all_for_user(self, db: Session, user_id: int) -> None:
        db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,
        ).update({"revoked": True})
        db.commit()

    def delete_expired(self, db: Session) -> int:
        now = datetime.utcnow()
        q = db.query(RefreshToken).filter(RefreshToken.expires_at < now)
        cnt = q.count()
        q.delete(synchronize_session=False)
        db.commit()
        return cnt