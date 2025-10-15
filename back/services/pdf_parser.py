from typing import Optional
import pdfplumber

def extract_text_from_pdf(file_path: str, max_pages: Optional[int] = 5) -> str:
    """
    Извлекает текст из PDF. По умолчанию берём первые 5 страниц для скорости.
    Возвращает "сырой" текст (склеенный постранично).
    """
    parts = []
    with pdfplumber.open(file_path) as pdf:
        pages = pdf.pages if max_pages is None else pdf.pages[:max_pages]
        for page in pages:
            text = page.extract_text() or ""
            text = text.strip()
            if text:
                parts.append(text)
    return "\n\n".join(parts)
