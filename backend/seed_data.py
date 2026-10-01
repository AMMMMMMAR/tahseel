import os
import sys

# Ensure UTF-8 output on Windows terminals
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlmodel import Session, select
from app.core.db import engine, init_db
from app.models.bond import Bond
from app.models.client import Client
from app.models.notification import Notification


def seed_database():
    """Initializes tables and populates realistic Arabic commercial mock data."""
    print("🌱 جاري تهيئة قاعدة بيانات تحصيل (SQLite)...")
    init_db()

    with Session(engine) as session:
        # Check if already seeded
        existing = session.exec(select(Bond)).first()
        if existing:
            print("ℹ️ قاعدة البيانات تحتوي بالفعل على بيانات مسبقة. تم التخطي.")
            return

        print("📦 جاري إضافة العملاء والسندات النموذجية...")

        # 1. Al-Noor Trading (High Risk, Overdue 25 days)
        client1 = Client(
            name="شركة النور للتجارة والتوريدات",
            phone="0501112233",
            email="contact@alnoortrading.com",
            risk_score=78.0,
            avg_delay_days=18,
            total_bonds=4,
        )
        session.add(client1)
        session.commit()
        session.refresh(client1)

        bond1 = Bond(
            bond_number="BOND-1001",
            bond_type="صرف",
            issue_date="2026-08-15",
            due_date="2026-09-05",
            client_id=client1.id,
            description="توريد بضائع ومواد كهربائية لمشروع برج الرياض التجاري",
            amount=45000.0,
            status="overdue",
            days_overdue=25,
        )
        session.add(bond1)

        # 2. Al-Fahad Contracting (Critical Risk, Overdue 45 days, Legal Notice)
        client2 = Client(
            name="مؤسسة الفهد للمقاولات الإنشائية",
            phone="0554445566",
            email="finance@alfahad-contracting.com",
            risk_score=95.0,
            avg_delay_days=35,
            total_bonds=6,
        )
        session.add(client2)
        session.commit()
        session.refresh(client2)

        bond2 = Bond(
            bond_number="BOND-1002",
            bond_type="صرف",
            issue_date="2026-07-20",
            due_date="2026-08-15",
            client_id=client2.id,
            description="مستحقات دفعة تسليم أعمال الخرسانة والهيكل الإنشائي",
            amount=120000.0,
            status="overdue",
            days_overdue=45,
        )
        session.add(bond2)

        # 3. Al-Madina Food (Pending, Due soon, Friendly Nudge)
        client3 = Client(
            name="شركة المدينة للمواد الغذائية والتموين",
            phone="0567778899",
            email="accounts@almadina-food.sa",
            risk_score=10.0,
            avg_delay_days=2,
            total_bonds=3,
        )
        session.add(client3)
        session.commit()
        session.refresh(client3)

        bond3 = Bond(
            bond_number="BOND-1003",
            bond_type="صرف",
            issue_date="2026-09-20",
            due_date="2026-10-05",
            client_id=client3.id,
            description="توريد وتوزيع مواد تموينية ومشروبات لفروع التجزئة",
            amount=15000.0,
            status="pending",
            days_overdue=0,
        )
        session.add(bond3)

        # 4. Afaq Tech Solutions (Reminded 15 days ago, Medium Risk)
        client4 = Client(
            name="شركة آفاق التقنية للحلول الرقمية",
            phone="0592223344",
            email="billing@afaqtech.sa",
            risk_score=45.0,
            avg_delay_days=10,
            total_bonds=2,
        )
        session.add(client4)
        session.commit()
        session.refresh(client4)

        bond4 = Bond(
            bond_number="BOND-1004",
            bond_type="صرف",
            issue_date="2026-08-28",
            due_date="2026-09-15",
            client_id=client4.id,
            description="تطوير البنية السحابية السنوية ورخص البرمجيات المحاسبية",
            amount=32000.0,
            status="reminded",
            days_overdue=15,
        )
        session.add(bond4)

        # 5. Rawabi Agricultural Est. (Settled / Paid on time)
        client5 = Client(
            name="مؤسسة الروابي الزراعية الحديثة",
            phone="0533334455",
            email="info@alrawabi-agri.com",
            risk_score=5.0,
            avg_delay_days=0,
            total_bonds=5,
        )
        session.add(client5)
        session.commit()
        session.refresh(client5)

        bond5 = Bond(
            bond_number="BOND-1005",
            bond_type="صرف",
            issue_date="2026-08-01",
            due_date="2026-09-01",
            client_id=client5.id,
            description="توريد شبكات الري الحديثة والأسمدة العضوية المعتمدة",
            amount=18500.0,
            status="settled",
            days_overdue=0,
        )
        session.add(bond5)
        session.commit()

        # Seed sample notifications
        notif1 = Notification(
            bond_id=bond2.id,
            recipient_name=client2.name,
            channel="simulated_whatsapp",
            urgency="legal_warning",
            title="إنذار قانوني نهائي بالسداد — سند رقم BOND-1002",
            message_body="السادة مؤسسة الفهد للمقاولات، نلفت انتباهكم لتأخر سداد مبلغ 120,000 ريال لأكثر من 45 يوماً. يرجى السداد الفوري لتفادي إحالة السند لقاضي التنفيذ بمحكمة التنفيذ.",
            is_read=False,
        )
        notif2 = Notification(
            bond_id=bond1.id,
            recipient_name=client1.name,
            channel="simulated_whatsapp",
            urgency="formal",
            title="إشعار مطالبة رسمية — سند رقم BOND-1001",
            message_body="السادة شركة النور للتجارة، نود تذكيركم بمبلغ 45,000 ريال المستحق بخصوص مشروع برج الرياض، نأمل التكرم بالتحويل لتحديث سجلكم الائتماني.",
            is_read=False,
        )
        notif3 = Notification(
            bond_id=bond3.id,
            recipient_name=client3.name,
            channel="in_app",
            urgency="friendly",
            title="تذكير ودي بقرب موعد السداد — سند رقم BOND-1003",
            message_body="السادة شركة المدينة للمواد الغذائية، مجرد تذكير لطيف بمبلغ 15,000 ريال المستحق بتاريخ 2026-10-05. شكراً لتعاونكم الدائم.",
            is_read=True,
        )
        session.add(notif1)
        session.add(notif2)
        session.add(notif3)
        session.commit()

        print("✅ تم بنجاح إضافة 5 عملاء و 5 سندات تجارية و 3 إشعارات نموذجية!")


if __name__ == "__main__":
    seed_database()
