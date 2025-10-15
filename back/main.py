from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from back.routers.upload import router as upload_router

app = FastAPI(title="PDF Flashcards API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Backend работает"}

app.include_router(upload_router)
