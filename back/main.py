from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from back.routers import upload, auth, uploads

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

@app.get("/")
def root():
    return {"message": "PDF Flashcards API работает!"}
