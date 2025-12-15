from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime

from back.db.database import get_db
from back.models.user import User
from back.models.upload import Upload
from back.services.pdf_parser import extract_text_from_pdf
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
    """Загрузка PDF, сохранение и извлечение текста."""
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        text = extract_text_from_pdf(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка при чтении PDF: {e}")

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
        "preview": text[:1000],  
        "id": upload_entry.id,
    }


@router.get("/uploads/")
async def get_user_uploads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uploads = (
        db.query(Upload)
        .filter(Upload.user_id == current_user.id)
        .order_by(Upload.timestamp.desc())
        .all()
    )
    return [
        {
            "id": u.id,
            "filename": u.filename,
            "timestamp": u.timestamp.isoformat(),
            "status": u.status,   
        }
        for u in uploads
    ]

