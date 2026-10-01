import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.bond import Bond


class Client(SQLModel, table=True):
    __tablename__ = "clients"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    name: str = Field(index=True, nullable=False)
    phone: str = Field(default="")
    email: str = Field(default="")
    risk_score: float = Field(default=0.0)
    avg_delay_days: int = Field(default=0)
    total_bonds: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    bonds: List["Bond"] = Relationship(back_populates="client")
