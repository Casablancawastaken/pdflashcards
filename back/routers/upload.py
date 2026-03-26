from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import os
import uuid

from back.db.database import get_db
from back.models.user import User
from back.models.upload import Upload
from back.routers.auth import get_current_user
from back.services.storage import (
    upload_bytes,
    ensure_bucket,
    ALLOWED_CONTENT_TYPES,
    MAX_FILE_SIZE,
)

router = APIRouter(tags=["uploads"])


@router.post("/upload-pdf")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ensure_bucket()

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Допустим только PDF")

    data = await file.read()

    if not data:
        raise HTTPException(status_code=400, detail="Файл пустой")

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Файл превышает 10 МБ")

    ext = os.path.splitext(file.filename or "")[1].lower() or ".pdf"
    object_key = f"user_{current_user.id}/{uuid.uuid4().hex}{ext}"

    upload_bytes(data, object_key, file.content_type)

    upload_entry = Upload(
        user_id=current_user.id,
        filename=file.filename,
        title=file.filename,
        object_key=object_key,
        content_type=file.content_type,
        size=len(data),
        timestamp=datetime.utcnow(),
    )

    db.add(upload_entry)
    db.commit()
    db.refresh(upload_entry)

    return {
        "id": upload_entry.id,
        "filename": upload_entry.filename,
        "title": upload_entry.title,
        "size": upload_entry.size,
    }