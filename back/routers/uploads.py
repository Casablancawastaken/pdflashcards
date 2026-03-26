from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse

from back.db.database import get_db
from back.models.upload import Upload
from back.models.user import User, UserRole
from back.routers.auth import get_current_user
from back.services.pdf_parser import extract_text_from_pdf_bytes
from back.services.storage import download_bytes, delete_object, generate_presigned_url

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.get("/")
def get_user_uploads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=1000),
    sort_by: str = Query("timestamp"),
    order: str = Query("desc"),
):
    allowed_sort = {"timestamp", "title", "filename", "status", "size"}
    allowed_order = {"asc", "desc"}

    if sort_by not in allowed_sort:
        raise HTTPException(status_code=400, detail="Некорректное поле сортировки")

    if order not in allowed_order:
        raise HTTPException(status_code=400, detail="Некорректный порядок сортировки")

    query = db.query(Upload).filter(Upload.user_id == current_user.id)

    sort_column = getattr(Upload, sort_by)
    if order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    uploads_all = query.all()
    total = len(uploads_all)
    uploads = uploads_all[(page - 1) * limit : page * limit]

    return {
        "items": [
            {
                "id": u.id,
                "filename": u.filename,
                "title": u.title,
                "timestamp": u.timestamp.isoformat() if u.timestamp else None,
                "status": u.status.value if hasattr(u.status, "value") else u.status,
                "size": u.size,
                "content_type": u.content_type,
            }
            for u in uploads
        ],
        "page": page,
        "pages": (total + limit - 1) // limit,
        "total": total,
    }


@router.put("/{upload_id}")
def update_upload(
    upload_id: int,
    title: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if upload.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    title = title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Название не может быть пустым")
    if len(title) > 120:
        raise HTTPException(status_code=400, detail="Название слишком длинное")

    duplicate = (
        db.query(Upload)
        .filter(
            Upload.user_id == upload.user_id,
            Upload.title == title,
            Upload.id != upload.id,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=409, detail="У вас уже есть файл с таким названием")

    upload.title = title
    db.commit()
    db.refresh(upload)

    return {
        "id": upload.id,
        "title": upload.title,
        "filename": upload.filename,
    }


@router.delete("/clear")
def clear_user_uploads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_uploads = db.query(Upload).filter(Upload.user_id == current_user.id).all()

    for u in user_uploads:
        try:
            delete_object(u.object_key)
        except Exception:
            pass

    db.query(Upload).filter(Upload.user_id == current_user.id).delete()
    db.commit()
    return {"message": "История загрузок успешно очищена"}


@router.get("/{upload_id}/text")
def get_upload_text(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if upload.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    file_bytes = download_bytes(upload.object_key)
    text = extract_text_from_pdf_bytes(file_bytes, max_pages=None)

    return JSONResponse(
        {
            "id": upload.id,
            "filename": upload.filename,
            "title": upload.title,
            "text": text,
            "size": upload.size,
            "content_type": upload.content_type,
            "timestamp": upload.timestamp.isoformat() if upload.timestamp else None,
            "status": upload.status.value if hasattr(upload.status, "value") else upload.status,
        }
    )


@router.get("/{upload_id}/download-url")
def get_download_url(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if upload.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    url = generate_presigned_url(upload.object_key, expires_in=300)
    return {"url": url}


@router.delete("/{upload_id}")
def delete_upload(
    upload_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if upload.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        delete_object(upload.object_key)
    except Exception:
        pass

    db.delete(upload)
    db.commit()
    return {"message": "Файл удалён"}