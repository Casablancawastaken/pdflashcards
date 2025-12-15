from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from back.db.database import get_db
from back.models.upload import Upload
from back.models.user import User
from back.routers.auth import get_current_user

from fastapi.responses import JSONResponse
from back.services.pdf_parser import extract_text_from_pdf

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = "uploads"

@router.get("/")
def get_user_uploads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploads = db.query(Upload).filter(Upload.user_id == current_user.id).all()
    return [
        {
            "id": u.id,
            "filename": u.filename,
            "timestamp": u.timestamp.isoformat() if u.timestamp else None,
            "status": u.status,
        }
        for u in uploads
    ]


@router.delete("/clear")
def clear_user_uploads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_uploads = db.query(Upload).filter(Upload.user_id == current_user.id).all()

    for u in user_uploads:
        file_path = os.path.join(UPLOAD_DIR, u.filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    db.query(Upload).filter(Upload.user_id == current_user.id).delete()
    db.commit()
    return {"message": "История загрузок успешно очищена"}


@router.get("/{upload_id}")
def get_upload(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = (
        db.query(Upload)
        .filter(Upload.id == upload_id, Upload.user_id == current_user.id)
        .first()
    )
    if not upload:
        raise HTTPException(status_code=404, detail="Файл не найден")
    return {
        "id": upload.id,
        "filename": upload.filename,
        "timestamp": upload.timestamp.isoformat() if upload.timestamp else None,
    }

@router.get("/{upload_id}/text")
def get_upload_text(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = (
        db.query(Upload)
        .filter(Upload.id == upload_id, Upload.user_id == current_user.id)
        .first()
    )
    if not upload:
        raise HTTPException(status_code=404, detail="Файл не найден")

    file_path = os.path.join(UPLOAD_DIR, upload.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Файл отсутствует на сервере")

    try:
        text = extract_text_from_pdf(file_path, max_pages=None)
        return JSONResponse({"filename": upload.filename, "text": text})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при чтении PDF: {e}")


@router.delete("/{upload_id}")
def delete_upload(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = (
        db.query(Upload)
        .filter(Upload.id == upload_id, Upload.user_id == current_user.id)
        .first()
    )
    if not upload:
        raise HTTPException(status_code=404, detail="Файл не найден")

    file_path = os.path.join(UPLOAD_DIR, upload.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(upload)
    db.commit()
    return {"message": f"Файл '{upload.filename}' удалён"}
