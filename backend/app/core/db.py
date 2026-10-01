import os
from pathlib import Path
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

# Default to local SQLite database in backend/data/tahseel.db
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/tahseel.db")

connect_args = {}
engine_kwargs = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    if ":memory:" in DATABASE_URL or DATABASE_URL == "sqlite://":
        # StaticPool ensures in-memory SQLite retains tables across threads/connections
        engine_kwargs["poolclass"] = StaticPool
    else:
        if "data/" in DATABASE_URL or "data\\" in DATABASE_URL:
            Path("./data").mkdir(parents=True, exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    **engine_kwargs
)


def init_db() -> None:
    """Creates all database tables based on SQLModel definitions."""
    import app.models  # noqa: F401
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Dependency for yielding database sessions."""
    with Session(engine) as session:
        yield session
