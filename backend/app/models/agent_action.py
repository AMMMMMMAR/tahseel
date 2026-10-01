import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class AgentAction(SQLModel, table=True):
    __tablename__ = "agent_actions"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True)
    bond_id: Optional[str] = Field(default=None, foreign_key="bonds.id")
    action_type: str = Field(nullable=False, index=True)
    details: str = Field(default="{}")
    executed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
