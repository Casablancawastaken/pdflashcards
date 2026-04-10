from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import os

from back.routers import upload, auth, uploads, cards, ai, events, books

app = FastAPI(title="PDF Flashcards API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(upload.router)
app.include_router(auth.router)
app.include_router(uploads.router)
app.include_router(cards.router)
app.include_router(ai.router)
app.include_router(events.router)
app.include_router(books.router)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")


@app.get("/")
def root():
    return {"message": "PDF Flashcards API работает!"}


@app.get("/robots.txt", include_in_schema=False)
def robots():
    content = f"""User-agent: *
Allow: /

Disallow: /auth/
Disallow: /profile
Disallow: /settings
Disallow: /admin
Disallow: /uploads/
Disallow: /cards/

Sitemap: {BACKEND_URL}/sitemap.xml
"""
    return Response(content=content, media_type="text/plain")


@app.get("/sitemap.xml", include_in_schema=False)
def sitemap():
    content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{FRONTEND_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
"""
    return Response(content=content, media_type="application/xml")

@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}