from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from back.routers.upload import router as upload_router
from back.routers.auth import router as auth_router

app = FastAPI(title="PDF Flashcards API")  

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Backend работает"}
