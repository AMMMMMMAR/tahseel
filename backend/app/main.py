from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.api.agent import router as agent_router
from app.api.bonds import router as bonds_router
from app.api.notifications import router as notifications_router
from app.api.websocket import router as ws_router
from app.core.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes SQLite database tables on application startup."""
    init_db()
    yield


app = FastAPI(
    title="Tahseel API — نظام تحصيل الديون الذكي",
    description="Arabic Financial OCR & Autonomous LangGraph Collection Agent",
    version="1.0.0",
    lifespan=lifespan,
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
app.include_router(notifications_router)
app.include_router(ws_router)


@app.get("/health", tags=["system"])
def health():
    return {"status": "ok", "service": "Tahseel API", "version": "1.0.0"}


@app.get("/", tags=["system"])
def root():
    return {
        "message": "مرحباً بك في Tahseel API",
        "docs": "/docs",
        "endpoints": ["/api/bonds", "/api/bonds/upload", "/api/agent/run", "/api/agent/logs", "/api/notifications", "/ws/agent"]
    }
