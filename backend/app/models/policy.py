from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class CollectionPolicy(SQLModel, table=True):
    __tablename__ = "collection_policies"

    id: str = Field(default="default_policy", primary_key=True)
    company_name: str = Field(default="شركة الأمل للتجارة")

    # محددات المهل الزمنية والتصعيد (بالأيام)
    friendly_reminder_days: int = Field(default=7, description="مهلة التذكير الودي بعد الاستحقاق")
    official_followup_days: int = Field(default=15, description="موعد بدء المتابعة الرسمية")
    legal_warning_days: int = Field(default=30, description="موعد الإنذار القانوني النهائي وإجراءات ناجز")

    # خيارات الجدولة والتقسيط
    enable_installment_plans: bool = Field(default=True, description="عرض خيار الجدولة على أقساط")
    default_installments_count: int = Field(default=3, description="عدد الدفعات الشهرية للتقسيط")

    # ضوابط الأمان القانونية
    allow_auto_legal_notice: bool = Field(default=True, description="السماح بإصدار إنذار قانوني تلقائياً")

    # نبرة التواصل والتوجه العام
    communication_tone: str = Field(default="balanced", description="نبرة التواصل: balanced (متوازنة), friendly (ودية), firm (حازمة)")
    custom_prompt_notes: str = Field(default="", description="توجيهات أو شروط خاصة لصياغة الخطابات")

    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
