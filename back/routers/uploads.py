from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import os

from back.db.database import get_db
from back.models.upload import Upload
from back.models.user import User
from back.routers.auth import get_current_user
from back.services.pdf_parser import extract_text_from_pdf
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = "uploads"


@router.get("/")
def get_user_uploads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(4, ge=1, le=50),
    search: str | None = Query(None),
):
    uploads_all = (
        db.query(Upload)
        .filter(Upload.user_id == current_user.id)
        .order_by(Upload.timestamp.desc())
        .all()
    )

    if search:
        s = search.strip().casefold()
        uploads_all = [
            u for u in uploads_all
            if s in u.filename.casefold()
        ]

    total = len(uploads_all)

    uploads = uploads_all[
        (page - 1) * limit : page * limit
    ]

    return {
        "items": [
            {
                "id": u.id,
                "filename": u.filename,
                "timestamp": u.timestamp.isoformat() if u.timestamp else None,
                "status": u.status,
            }
            for u in uploads
        ],
        "page": page,
        "pages": (total + limit - 1) // limit,
        "total": total,
    }


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
        raise HTTPException(status_code=404, detail="Файл отсутствует")

    text = extract_text_from_pdf(file_path, max_pages=None)
    return JSONResponse({"filename": upload.filename, "text": text})


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
    return {"message": "Файл удалён"}
