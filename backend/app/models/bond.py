import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.notification import Notification


class Bond(SQLModel, table=True):
    __tablename__ = "bonds"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    bond_number: str = Field(unique=True, index=True, nullable=False)
    bond_type: str = Field(default="صرف")
    issue_date: str = Field(nullable=False)
    due_date: Optional[str] = Field(default=None)
    client_id: Optional[str] = Field(default=None, foreign_key="clients.id")
    description: str = Field(default="")
    amount: float = Field(nullable=False)
    status: str = Field(default="pending", index=True)
    days_overdue: int = Field(default=0)
    last_reminder_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    client: Optional["Client"] = Relationship(back_populates="bonds")
    notifications: List["Notification"] = Relationship(back_populates="bond")
