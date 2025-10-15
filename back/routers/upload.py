import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from back.services.pdf_parser import extract_text_from_pdf       
from back.schemas.upload import UploadResponse   

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(os.path.dirname(BASE_DIR), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-pdf/", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)) -> UploadResponse:
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Нужен PDF-файл")

    safe_name = file.filename.replace("/", "_").replace("\\", "_")
    dest_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(dest_path, "wb") as out:
        shutil.copyfileobj(file.file, out)
    await file.close()

    try:
        full_text = extract_text_from_pdf(dest_path, max_pages=5)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Не удалось распарсить PDF: {e}")

    preview = (full_text or "").strip()
    if not preview:
        preview = "Не удалось извлечь текст (возможно, это скан/изображения без текстового слоя)."

    if len(preview) > 800:
        preview = preview[:800] + "…"

    return UploadResponse(
        filename=safe_name,
        message=f"Файл {safe_name} успешно загружен и обработан!",
        preview=preview
    )
