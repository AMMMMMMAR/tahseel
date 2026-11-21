import os
from contextlib import contextmanager
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


def get_engine():
    """Returns the SQLModel engine instance."""
    return engine


def init_db() -> None:
    """Creates all database tables based on SQLModel definitions."""
    import app.models  # noqa: F401
    SQLModel.metadata.create_all(engine)

    # Safe migration for new client columns in existing SQLite DB
    from sqlmodel import text
    with Session(engine) as session:
        for query in [
            "ALTER TABLE clients ADD COLUMN policy_tier TEXT DEFAULT 'standard'",
            "ALTER TABLE clients ADD COLUMN custom_grace_days INTEGER DEFAULT 0",
            "ALTER TABLE clients ADD COLUMN preferred_installments INTEGER DEFAULT NULL",
            "ALTER TABLE clients ADD COLUMN max_escalation_level INTEGER DEFAULT NULL",
            "ALTER TABLE clients ADD COLUMN custom_notes TEXT DEFAULT ''",
        ]:
            try:
                session.exec(text(query))
                session.commit()
            except Exception:
                # Column already exists
                pass


def get_session() -> Generator[Session, None, None]:
    """Dependency for yielding database sessions in FastAPI routes."""
    with Session(engine) as session:
        yield session


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Context manager for yielding database sessions in standalone scripts and agent nodes."""
    with Session(engine) as session:
        yield session
