from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.api.agent import router as agent_router
from app.api.bonds import router as bonds_router

app = FastAPI(
    title="Tahseel API — نظام تحصيل الديون الذكي",
    description="Arabic Financial OCR & Autonomous LangGraph Collection Agent",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bonds_router)
app.include_router(agent_router)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "Tahseel API", "version": "1.0.0"}


@app.get("/", tags=["system"])
def root():
    return {
        "message": "مرحباً بك في Tahseel API",
        "docs": "/docs",
        "endpoints": ["/api/bonds", "/api/bonds/upload", "/api/agent/run"]
    }
