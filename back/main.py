from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from back.routers import upload, auth, uploads, cards

app = FastAPI(title="PDF Flashcards API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(auth.router)     
app.include_router(uploads.router) 
app.include_router(cards.router)

@app.get("/")
def root():
    return {"message": "PDF Flashcards API работает!"}

from back.db.database import Base, engine
from back.models import user, upload, flashcards

Base.metadata.create_all(bind=engine)
