from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime

from back.db.database import get_db
from back.models.user import User
from back.models.upload import Upload
from back.routers.auth import get_current_user

router = APIRouter(tags=["uploads"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-pdf")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    upload_entry = Upload(
        user_id=current_user.id,
        filename=file.filename,
        timestamp=datetime.utcnow(),
    )
    db.add(upload_entry)
    db.commit()
    db.refresh(upload_entry)

    return {
        "filename": file.filename,
        "id": upload_entry.id,
    }
