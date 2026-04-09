import os
import time
from typing import Any

import requests

GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY", "")
BOOKS_TIMEOUT = float(os.getenv("BOOKS_TIMEOUT", "5"))
BOOKS_MAX_RESULTS = int(os.getenv("BOOKS_MAX_RESULTS", "6"))
BOOKS_RATE_LIMIT_PER_MINUTE = int(os.getenv("BOOKS_RATE_LIMIT_PER_MINUTE", "20"))

_request_window: list[float] = []


def _check_rate_limit():
    now = time.time()
    global _request_window
    _request_window = [t for t in _request_window if now - t < 60]

    if len(_request_window) >= BOOKS_RATE_LIMIT_PER_MINUTE:
        raise RuntimeError("Rate limit exceeded")

    _request_window.append(now)


def _normalize_item(item: dict[str, Any]) -> dict[str, Any]:
    info = item.get("volumeInfo", {}) or {}
    images = info.get("imageLinks", {}) or {}
    authors = info.get("authors", []) or []

    return {
        "id": item.get("id"),
        "title": info.get("title") or "Без названия",
        "authors": authors,
        "description": (info.get("description") or "")[:300],
        "thumbnail": images.get("thumbnail") or images.get("smallThumbnail"),
        "info_url": info.get("infoLink"),
        "published_date": info.get("publishedDate"),
    }


def search_books(query: str) -> dict[str, Any]:
    query = (query or "").strip()
    if not query:
        return {"items": [], "source": "google_books"}

    _check_rate_limit()

    params = {
        "q": query,
        "maxResults": BOOKS_MAX_RESULTS,
        "printType": "books",
        "langRestrict": "ru",
    }

    if GOOGLE_BOOKS_API_KEY:
        params["key"] = GOOGLE_BOOKS_API_KEY

    last_error = None

    for _ in range(3):
        try:
            response = requests.get(
                GOOGLE_BOOKS_URL,
                params=params,
                timeout=BOOKS_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()

            items = [_normalize_item(x) for x in data.get("items", [])]
            return {"items": items, "source": "google_books"}
        except requests.Timeout:
            last_error = "timeout"
        except requests.RequestException:
            last_error = "request_error"

        time.sleep(0.8)

    raise RuntimeError(last_error or "external_api_error")