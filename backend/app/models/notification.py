import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.bond import Bond


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    bond_id: Optional[str] = Field(default=None, foreign_key="bonds.id")
    recipient_name: str = Field(nullable=False)
    channel: str = Field(default="simulated_whatsapp")
    urgency: str = Field(default="friendly")
    title: str = Field(nullable=False)
    message_body: str = Field(nullable=False)
    is_read: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    bond: Optional["Bond"] = Relationship(back_populates="notifications")
