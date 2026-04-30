# main.py
# FastAPI application entry point

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.bonds import router as bonds_router
from api.agent import router as agent_router

app = FastAPI(
    title="Tahseel API — نظام تحصيل الديون الذكي",
    description="OCR + AI Agent لإدارة وتحصيل السندات التجارية",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bonds_router)
app.include_router(agent_router)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "Tahseel API"}


@app.get("/", tags=["system"])
def root():
    return {
        "message": "مرحباً بك في Tahseel API",
        "docs": "/docs",
        "endpoints": ["/api/bonds", "/api/bonds/upload"]
    }
