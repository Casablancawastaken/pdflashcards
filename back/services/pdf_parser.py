from typing import Optional
import io
import pdfplumber


def extract_text_from_pdf_bytes(data: bytes, max_pages: Optional[int] = 5) -> str:
    parts = []

    with pdfplumber.open(io.BytesIO(data)) as pdf:
        pages = pdf.pages if max_pages is None else pdf.pages[:max_pages]

        for page in pages:
            text = page.extract_text() or ""
            text = text.strip()
            if text:
                parts.append(text)

    return "\n\n".join(parts)