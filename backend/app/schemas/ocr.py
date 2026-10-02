from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class BondExtractionSchema(BaseModel):
    """Schema for Arabic financial bond / commercial paper entity extraction."""

    bond_number: str = Field(description="رقم السند أو الفاتورة أو الكمبيالة")
    bond_type: str = Field(default="صرف", description="نوع السند: 'سند_لأمر', 'سند_قبض', 'سند_صرف'")
    issue_date: str = Field(description="تاريخ الإصدار بصيغة YYYY-MM-DD")
    due_date: Optional[str] = Field(default=None, description="تاريخ الاستحقاق بصيغة YYYY-MM-DD إن وجد")
    debtor_name: str = Field(description="اسم المدين أو العميل أو المنشأة")
    debtor_phone: str = Field(default="", description="رقم هاتف العميل")
    debtor_email: str = Field(default="", description="البريد الإلكتروني للعميل")
    amount: float = Field(description="المبلغ الإجمالي كرقم عشري")
    currency: str = Field(default="SAR", description="العملة، افتراضياً SAR")
    description: str = Field(default="", description="وصف سبب الصرف أو تفاصيل الالتزام")
    confidence_score: float = Field(default=0.95, description="درجة ثقة النموذج في القراءة من 0.0 إلى 1.0")
    uncertain_fields: List[str] = Field(
        default_factory=list,
        description="الحقول غير الواضحة التي تحتاج مراجعة بشرية"
    )

    def to_legacy_arabic_dict(self) -> Dict[str, Any]:
        """Converts to legacy Arabic field dictionary for frontend compatibility."""
        return {
            "رقم_السند": self.bond_number,
            "تاريخ_الاصدار": self.issue_date,
            "تاريخ_الاستحقاق": self.due_date or self.issue_date,
            "اسم_العميل": self.debtor_name,
            "رقم_الهاتف": self.debtor_phone,
            "ايميل_العميل": self.debtor_email,
            "وصف_سبب_الصرف": self.description,
            "المبلغ": str(self.amount),
            "نوع_السند": self.bond_type,
            "درجة_الثقة": self.confidence_score,
            "حقول_غير_مؤكدة": self.uncertain_fields,
        }
