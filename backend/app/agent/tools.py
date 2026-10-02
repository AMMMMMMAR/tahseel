import json
import logging
import os
import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from langchain.tools import tool
from sqlmodel import Session, select

from app.core.db import get_db_session
from app.models.bond import Bond
from app.models.client import Client
from app.repositories.action_repo import ActionRepository
from app.repositories.bond_repo import BondRepository
from app.repositories.client_repo import ClientRepository
from app.repositories.notification_repo import NotificationRepository

logger = logging.getLogger(__name__)

# Basic RFC-5322 email regex check
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_valid_email(value: Optional[str]) -> bool:
    return bool(value) and bool(_EMAIL_RE.match(value.strip()))


def determine_escalation_strategy(days_overdue: int, risk_score: float) -> Dict[str, Any]:
    """
    Determines 4-tier collection escalation strategy:
    - Level 1: Friendly Courtesy (Days overdue <= 0 or risk < 40)
    - Level 2: Official Follow-Up (Days overdue 1-14 or risk 40-70)
    - Level 3: Urgent Warning & Payment Plan (Days overdue 15-30 or risk 70-85)
    - Level 4: Final Legal Notice (Days overdue > 30 or risk > 85)
    """
    if days_overdue > 30 or risk_score >= 85:
        return {
            "level": 4,
            "label": "إنذار قانوني نهائي",
            "urgency": "legal_notice",
            "tone": "إنذار نهائي قبل الإجراءات القضائية والتنفيذ عبر منصة ناجز",
            "action_required": "السداد خلال 48 ساعة لتفادي اتخاذ الإجراءات النظامية والقضائية.",
        }
    elif days_overdue >= 15 or risk_score >= 70:
        return {
            "level": 3,
            "label": "تنبيه عاجل مع خطة سداد",
            "urgency": "urgent",
            "tone": "عاجل مع مقترح جدولة السداد",
            "action_required": "يرجى تسوية المستحقات أو اعتماد مقترح جدولة السداد على 3 دفعات ميسرة.",
        }
    elif days_overdue >= 1 or risk_score >= 40:
        return {
            "level": 2,
            "label": "متابعة مالية رسمية",
            "urgency": "official",
            "tone": "رسمي ومباشر لمتابعة الفاتورة المستحقة",
            "action_required": "يرجى تأكيد موعد التحويل البنكي وإرسال إشعار السداد لفريق المحاسبة.",
        }
    else:
        return {
            "level": 1,
            "label": "تذكير استباقي ودي",
            "urgency": "friendly",
            "tone": "ودي واستشاري قبل موعد الاستحقاق",
            "action_required": "تذكير بموعد الاستحقاق القادم، مع كامل تقديرنا لشراكتكم الدائمة.",
        }


def analyze_and_update_risks_sync(session: Session) -> Dict[str, Any]:
    """Analyzes delay risk for all active bonds and persists updates in SQLite."""
    today = date.today()
    active_bonds = BondRepository.list_active_bonds(session)
    updated_count = 0

    for bond in active_bonds:
        # Calculate days since issue
        try:
            issue_date = datetime.strptime(bond.issue_date, "%Y-%m-%d").date()
            days_since_issue = max(0, (today - issue_date).days)
        except Exception:
            days_since_issue = 0

        # Calculate days overdue from due_date if available
        days_overdue = 0
        if bond.due_date:
            try:
                due_date = datetime.strptime(bond.due_date, "%Y-%m-%d").date()
                days_overdue = max(0, (today - due_date).days)
            except Exception:
                days_overdue = max(0, days_since_issue - 30)
        else:
            days_overdue = max(0, days_since_issue - 30)

        # Get client history if present
        client = ClientRepository.get_client(session, bond.client_id) if bond.client_id else None
        avg_delay = client.avg_delay_days if client else 0

        # Weighted risk calculation
        base_risk = min(days_since_issue * 1.5, 50.0)
        history_risk = min(avg_delay * 1.5, 30.0)
        amount_risk = 15.0 if bond.amount > 50000 else 5.0 if bond.amount > 20000 else 0.0
        total_risk = round(min(base_risk + history_risk + amount_risk, 100.0), 1)

        # Status transition
        new_status = bond.status
        if days_overdue > 30:
            new_status = "overdue"
        elif days_overdue > 0 or days_since_issue > 14:
            new_status = "reminded" if bond.status != "pending" else "pending"

        bond.days_overdue = days_overdue
        bond.status = new_status
        session.add(bond)

        if client:
            client.risk_score = total_risk
            session.add(client)

        updated_count += 1

    session.commit()

    ActionRepository.log_action(
        session=session,
        action_type="analyze_risks",
        details={
            "updated_count": updated_count,
            "message": f"تم تقييم وتحديث درجات المخاطر لـ {updated_count} سندات وفواتير نشطة.",
            "timestamp": datetime.now().isoformat(),
        },
    )

    return {
        "status": "success",
        "updated_count": updated_count,
        "message": f"تم تقييم وتحديث درجات المخاطر لـ {updated_count} سند/فاتورة.",
    }


def get_high_risk_bonds_sync(session: Session, threshold: float = 70.0) -> List[Dict[str, Any]]:
    """Fetches active bonds with debtor risk scores exceeding the threshold."""
    active_bonds = BondRepository.list_active_bonds(session)
    high_risk_list: List[Dict[str, Any]] = []

    for bond in active_bonds:
        client = ClientRepository.get_client(session, bond.client_id) if bond.client_id else None
        risk_score = client.risk_score if client else 0.0

        if risk_score >= threshold or bond.days_overdue > 0:
            strategy = determine_escalation_strategy(bond.days_overdue, risk_score)
            high_risk_list.append({
                "bond_id": bond.id,
                "bond_number": bond.bond_number,
                "client_id": bond.client_id,
                "client_name": client.name if client else "عميل غير محدد",
                "client_email": client.email if client else "",
                "client_phone": client.phone if client else "",
                "amount": bond.amount,
                "days_overdue": bond.days_overdue,
                "risk_score": risk_score,
                "description": bond.description,
                "strategy": strategy,
            })

    # Sort descending by risk score
    high_risk_list.sort(key=lambda x: (x["risk_score"], x["days_overdue"]), reverse=True)

    ActionRepository.log_action(
        session=session,
        action_type="find_high_risk",
        details={
            "high_risk_count": len(high_risk_list),
            "threshold": threshold,
            "message": f"تم اكتشاف {len(high_risk_list)} حالة تتطلب المتابعة والتحصيل.",
        },
    )

    return high_risk_list


def send_smart_reminder_sync(
    session: Session,
    bond_id: str,
    client_name: str,
    client_email: str,
    amount: float,
    days_overdue: int,
    description: str,
    bond_number: str = "",
    risk_score: float = 50.0,
) -> Dict[str, Any]:
    """
    Generates personalized Arabic copy based on escalation level,
    records in NotificationRepository, sends via Resend if available,
    and logs action.
    """
    import resend

    resend_api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("FROM_EMAIL", "collections@tahseel.sa")

    strategy = determine_escalation_strategy(days_overdue, risk_score)
    level = strategy["level"]
    label = strategy["label"]
    action_req = strategy["action_required"]

    # Arabic tailored copywriting
    salutation = f"السيد/ة {client_name} المحترم/ة،"
    amount_str = f"{amount:,.2f} ر.س"
    bond_ref = f" (سند رقم: {bond_number})" if bond_number else ""

    if level == 4:
        body = (
            f"{salutation}\n\n"
            f"إشعار قانوني نهائي بشأن المستحقات المالية المتأخرة بمبلغ {amount_str}{bond_ref} بخصوص {description}.\n\n"
            f"نظراً لتجاوز فترة السداد المحددة بـ {days_overdue} يوماً دون تسوية، "
            f"نحيطكم علماً بأنه سيتم رفع السند التنفيذي إلى الدائرة القضائية المختصة عبر منصة ناجز خلال 48 ساعة "
            f"في حال عدم إتمام السداد الفوري.\n\n"
            f"{action_req}\n\n"
            f"الإدارة القانونية والتحصيل — منصة تحصيل"
        )
    elif level == 3:
        installment_val = amount / 3.0
        body = (
            f"{salutation}\n\n"
            f"تنبيه عاجل بخصوص المستحقات المالية بمبلغ {amount_str}{bond_ref} المتعلقة بـ {description}.\n\n"
            f"المبلغ متأخر منذ {days_overdue} يوماً. تقديراً لشراكتكم، يسعدنا أن نعرض عليكم إمكانية جدولة المبلغ "
            f"على 3 دفعات شهرية ميسرة بقيمة ({installment_val:,.2f} ر.س شهرياً).\n\n"
            f"{action_req}\n\n"
            f"فريق التحصيل المالي — منصة تحصيل"
        )
    elif level == 2:
        body = (
            f"{salutation}\n\n"
            f"تحية طيبة، نود متابعة الفاتورة المستحقة بمبلغ {amount_str}{bond_ref} الخاصة بـ {description}.\n\n"
            f"{action_req}\n\n"
            f"شاكرين لكم حسن تعاونكم الدائم.\n"
            f"قسم الحسابات — منصة تحصيل"
        )
    else:
        body = (
            f"{salutation}\n\n"
            f"تحية طيبة، نود تذكيركم بموعد استحقاق السند المالي بمبلغ {amount_str}{bond_ref} بخصوص {description}.\n\n"
            f"{action_req}\n\n"
            f"مع أطيب التحيات،\n"
            f"فريق خدمة العملاء — منصة تحصيل"
        )

    # Persist in NotificationRepository
    notification = NotificationRepository.create_notification(
        session=session,
        recipient_name=client_name,
        title=f"تنبيه تحصيل: {label} ({amount_str})",
        message_body=body,
        bond_id=bond_id,
        channel="simulated_whatsapp",
        urgency=strategy["urgency"],
    )

    simulation = not resend_api_key or "mock" in resend_api_key.lower() or not is_valid_email(client_email)
    resend_id = None

    if not simulation:
        try:
            resend.api_key = resend_api_key
            resp = resend.Emails.send({
                "from": from_email,
                "to": client_email,
                "subject": f"إشعار مالي: {label} — {amount_str}",
                "text": body,
            })
            resend_id = (resp or {}).get("id") if isinstance(resp, dict) else getattr(resp, "id", None)
        except Exception as e:
            logger.warning(f"Resend dispatch error: {e}")
            simulation = True

    # Record reminder timestamp on bond
    BondRepository.record_reminder(session, bond_id)

    # Log explainable agent action
    action_type = "reminder_simulated" if simulation else "reminder_sent"
    ActionRepository.log_action(
        session=session,
        action_type=action_type,
        bond_id=bond_id,
        details={
            "recipient": client_name,
            "email": client_email,
            "level": level,
            "label": label,
            "amount": amount,
            "days_overdue": days_overdue,
            "notification_id": notification.id,
            "simulation": simulation,
            "resend_id": resend_id,
            "summary": f"تم إرسال {label} إلى {client_name} بقيمة {amount_str}.",
        },
    )

    return {
        "status": "success",
        "notification_id": notification.id,
        "recipient": client_name,
        "level": level,
        "label": label,
        "simulation": simulation,
        "message_preview": body[:120] + "...",
    }


def generate_daily_report_sync(session: Session) -> Dict[str, Any]:
    """Generates portfolio health and daily collection metrics from SQLite."""
    today = date.today()
    all_bonds = list(session.exec(select(Bond)).all())

    active = [b for b in all_bonds if b.status in ("pending", "reminded", "overdue")]
    overdue = [b for b in all_bonds if b.status == "overdue" or b.days_overdue > 0]
    settled = [b for b in all_bonds if b.status == "settled"]

    total_active = sum(b.amount for b in active)
    total_overdue = sum(b.amount for b in overdue)
    total_settled = sum(b.amount for b in settled)

    clients = list(session.exec(select(Client)).all())
    high_risk_clients = [c for c in clients if c.risk_score >= 70.0]

    report = {
        "تاريخ_التقرير": str(today),
        "إجمالي_الديون_النشطة": f"{total_active:,.2f} ر.س",
        "المتأخرات_المتراكمة": f"{total_overdue:,.2f} ر.س",
        "المحصل_التاريخي": f"{total_settled:,.2f} ر.س",
        "عدد_السندات_النشطة": len(active),
        "عدد_السندات_المتأخرة": len(overdue),
        "عدد_العملاء_عالي_الخطورة": len(high_risk_clients),
        "معدل_التعافي_المقدر": f"{(total_settled / (total_active + total_settled) * 100):.1f}%" if (total_active + total_settled) > 0 else "0%",
    }

    ActionRepository.log_action(
        session=session,
        action_type="daily_report_generated",
        details=report,
    )

    return report


# ── LangChain Tool Wrappers for Model Binding ────────────────────────────────

@tool
def analyze_and_update_risks() -> str:
    """Daily first task: analyzes delay risk for active bonds and updates the database."""
    with get_db_session() as session:
        result = analyze_and_update_risks_sync(session)
        return json.dumps(result, ensure_ascii=False)


@tool
def get_high_risk_bonds(threshold: float = 70.0) -> str:
    """Returns list of high-risk bonds requiring urgent collection intervention."""
    with get_db_session() as session:
        result = get_high_risk_bonds_sync(session, threshold=threshold)
        return json.dumps(result, ensure_ascii=False)


@tool
def send_smart_reminder(
    bond_id: str,
    client_name: str,
    client_email: str,
    amount: float,
    days_overdue: int,
    description: str,
    bond_number: str = "",
    risk_score: float = 50.0,
) -> str:
    """Dispatches a personalized, multi-tiered Arabic reminder and logs action in DB."""
    with get_db_session() as session:
        result = send_smart_reminder_sync(
            session=session,
            bond_id=bond_id,
            client_name=client_name,
            client_email=client_email,
            amount=amount,
            days_overdue=days_overdue,
            description=description,
            bond_number=bond_number,
            risk_score=risk_score,
        )
        return json.dumps(result, ensure_ascii=False)


@tool
def generate_daily_report() -> str:
    """Generates a comprehensive daily management report of portfolio health."""
    with get_db_session() as session:
        result = generate_daily_report_sync(session)
        return json.dumps(result, ensure_ascii=False)
