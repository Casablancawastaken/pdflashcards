from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from back.db.database import get_db
from back.models.upload import Upload
from back.models.user import User
from back.routers.auth import get_current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])

@router.get("/")
def get_user_uploads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    uploads = db.query(Upload).filter(Upload.user_id == current_user.id).all()
    return [
        {"id": u.id, "filename": u.filename, "timestamp": u.timestamp.isoformat()}
        for u in uploads
    ]
