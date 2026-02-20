from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os, json, re, requests

from back.db.database import get_db
from back.models.upload import Upload, UploadStatus
from back.models.flashcards import Flashcard
from back.models.user import UserRole
from back.routers.auth import get_current_user
from back.services.pdf_parser import extract_text_from_pdf
from back.services.ai_prompt import build_cards_prompt

router = APIRouter(prefix="/ai", tags=["ai"])

OLLAMA_URL = "http://127.0.0.1:11434"
MODEL_NAME = "llama3"


@router.post("/generate_cards/{upload_id}")
def generate_cards(
    upload_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if upload.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    upload.status = UploadStatus.generating
    db.commit()

    try:
        file_path = os.path.join("uploads", upload.filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="PDF отсутствует")

        text = extract_text_from_pdf(file_path, max_pages=5)
        if not text.strip():
            raise HTTPException(status_code=400, detail="Нет текста")

        prompt = build_cards_prompt(text)

        with requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": MODEL_NAME,
                "stream": True,
                "messages": [{"role": "user", "content": prompt}],
            },
            stream=True,
            timeout=300,
        ) as resp:

            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Ошибка модели")

            full_text = ""
            for line in resp.iter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line.decode("utf-8"))
                    full_text += data.get("message", {}).get("content", "")
                except:
                    pass

        match = re.search(r"\{.*\}", full_text, re.DOTALL)
        if not match:
            raise Exception("Нет JSON в ответе")

        parsed = json.loads(match.group(0))
        cards = parsed.get("cards", [])

        created = 0
        for c in cards:
            q = (c.get("q") or "").strip()
            a = (c.get("a") or "").strip()
            if q and a:
                db.add(Flashcard(upload_id=upload_id, question=q, answer=a))
                created += 1

        upload.status = UploadStatus.done
        db.commit()
        db.refresh(upload)
        print(f"Генерация завершена upload_id={upload_id}, статус='{upload.status.value}'")

        return {"created": created}

    except Exception:
        upload.status = UploadStatus.error
        db.commit()
        raise