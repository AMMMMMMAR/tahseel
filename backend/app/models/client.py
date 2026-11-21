import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

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
    policy_tier: str = Field(default="standard", description="فئة العميل: standard, vip, strict")
    custom_grace_days: int = Field(default=0, description="أيام مهلة إضافية خاصة باتفاقية العميل")
    preferred_installments: Optional[int] = Field(default=None, description="عدد دفعات التقسيط المتفق عليها خصيصاً مع العميل")
    max_escalation_level: Optional[int] = Field(default=None, description="أقصى مستوى تصعيد مسموح لهذا العميل (1 إلى 4)")
    custom_notes: str = Field(default="", description="ملاحظات أو شروط اتفاقية السداد الخاصة")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    bonds: List["Bond"] = Relationship(back_populates="client")
