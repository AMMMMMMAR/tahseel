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
from app.models.policy import CollectionPolicy
from app.repositories.action_repo import ActionRepository
from app.repositories.bond_repo import BondRepository
from app.repositories.client_repo import ClientRepository
from app.repositories.notification_repo import NotificationRepository
from app.repositories.policy_repo import PolicyRepository

logger = logging.getLogger(__name__)

# Basic RFC-5322 email regex check
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_valid_email(value: Optional[str]) -> bool:
    return bool(value) and bool(_EMAIL_RE.match(value.strip()))


def determine_escalation_strategy(
    days_overdue: int,
    risk_score: float,
    is_disputed: bool = False,
    is_settled: bool = False,
    policy: Optional[CollectionPolicy] = None,
    policy_tier: str = "standard",
    custom_grace_days: int = 0,
    max_escalation_level: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Determines collection escalation strategy dynamically based on company CollectionPolicy
    and per-client agreement terms (Standard, VIP, Strict, custom grace days, max escalation cap).
    """
    if is_settled:
        return {
            "level": 0,
            "label": "مسدد بالكامل",
            "urgency": "none",
            "tone": "لا يتطلب أي إجراء تحصيل",
            "action_required": "الحساب مغلق ومسدد بالكامل.",
        }
    if is_disputed:
        return {
            "level": 0,
            "label": "مطالبة معلقة لوجود نزاع",
            "urgency": "none",
            "tone": "تجميد المتابعة وإحالة للوساطة القانونية",
            "action_required": "تم إيقاف التذكيرات الآلية مؤقتاً لحين فض النزاع التجاري.",
        }

    # Effective overdue days after subtracting custom client grace agreement
    effective_overdue = max(0, days_overdue - (custom_grace_days or 0))

    # Read company thresholds (or default standard limits)
    friendly_limit = policy.friendly_reminder_days if policy else 1
    followup_limit = policy.official_followup_days if policy else 15
    legal_limit = policy.legal_warning_days if policy else 30
    allow_auto_legal = policy.allow_auto_legal_notice if policy else True

    # Adjust rules for client policy tiers
    if policy_tier == "vip":
        # VIP Guardrail: Never send legal escalation; always maintain polite executive communication
        allow_auto_legal = False
        legal_limit = 999
        followup_limit = max(followup_limit, 30)
    elif policy_tier == "strict":
        # Strict tier: Halve the thresholds for early escalation
        followup_limit = max(1, followup_limit // 2)
        legal_limit = max(7, legal_limit // 2)

    # Escalation Ladder
    if effective_overdue > legal_limit or (risk_score >= 85 and policy_tier != "vip"):
        if allow_auto_legal and policy_tier != "vip":
            raw_result = {
                "level": 4,
                "label": "إنذار قانوني نهائي",
                "urgency": "legal_notice",
                "tone": "إنذار نهائي قبل الإجراءات القضائية والتنفيذ عبر منصة ناجز",
                "action_required": "السداد خلال 48 ساعة لتفادي اتخاذ الإجراءات النظامية والقضائية.",
            }
        else:
            raw_result = {
                "level": 3,
                "label": "متابعة خاصة رفيعة المستوى (VIP)",
                "urgency": "urgent",
                "tone": "متابعة خاصة من مدير الحسابات والوساطة الودية",
                "action_required": "مراجعة خاصة مع الإدارة المالية لبحث تسهيلات السداد.",
            }
    elif effective_overdue >= followup_limit or risk_score >= 70:
        enable_installments = policy.enable_installment_plans if policy else True
        label = "تنبيه عاجل مع خطة سداد" if enable_installments else "تنبيه مالي عاجل"
        raw_result = {
            "level": 3,
            "label": label,
            "urgency": "urgent",
            "tone": "عاجل مع مقترح جدولة السداد",
            "action_required": "يرجى تسوية المستحقات أو اعتماد مقترح جدولة السداد على 3 دفعات ميسرة.",
        }
    elif effective_overdue >= friendly_limit or risk_score >= 40:
        raw_result = {
            "level": 2,
            "label": "متابعة مالية رسمية",
            "urgency": "official",
            "tone": "رسمي ومباشر لمتابعة الفاتورة المستحقة",
            "action_required": "يرجى تأكيد موعد التحويل البنكي وإرسال إشعار السداد لفريق المحاسبة.",
        }
    else:
        raw_result = {
            "level": 1,
            "label": "تذكير استباقي ودي",
            "urgency": "friendly",
            "tone": "ودي واستشاري قبل موعد الاستحقاق",
            "action_required": "تذكير بموعد الاستحقاق القادم، مع كامل تقديرنا لشراكتكم الدائمة.",
        }

    # Respect client contractual max escalation cap if set
    if max_escalation_level is not None and raw_result["level"] > max_escalation_level:
        if max_escalation_level == 3:
            raw_result = {
                "level": 3,
                "label": "متابعة خاصة (سقف التعاقد)",
                "urgency": "urgent",
                "tone": "متابعة خاصة تلتزم بسقف الاتفاقية المعتمدة",
                "action_required": "مراجعة مع الإدارة المالية لتسوية الدفعات.",
            }
        elif max_escalation_level <= 2:
            raw_result = {
                "level": 2,
                "label": "متابعة رسمية (سقف التعاقد)",
                "urgency": "official",
                "tone": "متابعة رسمية دون تصعيد قضائي وفق الاتفاقية",
                "action_required": "تأكيد التحويل البنكي وفق الاتفاق.",
            }

    return raw_result


def generate_reminder_message(
    client_name: str,
    amount: float,
    days_overdue: int,
    description: str,
    bond_number: str = "",
    risk_score: float = 50.0,
    is_disputed: bool = False,
    is_settled: bool = False,
    policy: Optional[CollectionPolicy] = None,
    policy_tier: str = "standard",
    custom_grace_days: int = 0,
    preferred_installments: Optional[int] = None,
    max_escalation_level: Optional[int] = None,
    custom_notes: str = "",
) -> Dict[str, Any]:
    """Generates dynamic, policy-aligned Arabic reminder copy and escalation strategy."""
    strategy = determine_escalation_strategy(
        days_overdue=days_overdue,
        risk_score=risk_score,
        is_disputed=is_disputed,
        is_settled=is_settled,
        policy=policy,
        policy_tier=policy_tier,
        custom_grace_days=custom_grace_days,
        max_escalation_level=max_escalation_level,
    )
    level = strategy["level"]
    label = strategy["label"]
    action_req = strategy["action_required"]

    if level == 0:
        return {
            "strategy": strategy,
            "body": f"تم تجميد التذكير للعميل {client_name}: {action_req}",
            "level": 0,
            "label": label,
        }

    company = policy.company_name if policy else "منصة تحصيل"
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
            f"الإدارة القانونية والتحصيل — {company}"
        )
    elif level == 3:
        # Use client's preferred installments if agreed, otherwise company default
        enable_installments = (preferred_installments is not None and preferred_installments > 1) or (policy.enable_installment_plans if policy else True)
        installments = preferred_installments if (preferred_installments and preferred_installments > 1) else (policy.default_installments_count if policy else 3)
        installment_val = amount / float(installments)

        if enable_installments:
            installment_text = (
                f"تقديراً لشراكتكم، يسعدنا أن نعرض عليكم إمكانية جدولة المبلغ "
                f"على {installments} دفعات شهرية ميسرة بقيمة ({installment_val:,.2f} ر.س شهرياً)."
            )
        else:
            installment_text = "نحثكم على سرعة التواصل معنا لترتيب آلية سداد سريعة ومناسبة."

        body = (
            f"{salutation}\n\n"
            f"تنبيه عاجل بخصوص المستحقات المالية بمبلغ {amount_str}{bond_ref} المتعلقة بـ {description}.\n\n"
            f"المبلغ متأخر منذ {days_overdue} يوماً. {installment_text}\n\n"
            f"{action_req}\n\n"
            f"فريق التحصيل المالي — {company}"
        )
    elif level == 2:
        body = (
            f"{salutation}\n\n"
            f"تحية طيبة، نود متابعة الفاتورة المستحقة بمبلغ {amount_str}{bond_ref} الخاصة بـ {description}.\n\n"
            f"{action_req}\n\n"
            f"شاكرين لكم حسن تعاونكم الدائم.\n"
            f"قسم الحسابات — {company}"
        )
    else:
        body = (
            f"{salutation}\n\n"
            f"تحية طيبة، نود تذكيركم بموعد استحقاق السند المالي بمبلغ {amount_str}{bond_ref} بخصوص {description}.\n\n"
            f"{action_req}\n\n"
            f"مع أطيب التحيات،\n"
            f"فريق خدمة العملاء — {company}"
        )

    # Append custom prompt notes if specified in company policy or client terms
    if policy and policy.custom_prompt_notes:
        body += f"\n\nملاحظة: {policy.custom_prompt_notes}"
    if custom_notes:
        body += f"\n(بند الاتفاقية: {custom_notes})"

    return {
        "strategy": strategy,
        "body": body,
        "level": level,
        "label": label,
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
    """Fetches active bonds evaluated against the company policy and debtor terms."""
    active_bonds = BondRepository.list_active_bonds(session)
    policy = PolicyRepository.get_policy(session)
    high_risk_list: List[Dict[str, Any]] = []

    for bond in active_bonds:
        client = ClientRepository.get_client(session, bond.client_id) if bond.client_id else None
        risk_score = client.risk_score if client else 0.0
        policy_tier = getattr(client, "policy_tier", "standard") if client else "standard"
        custom_grace = getattr(client, "custom_grace_days", 0) if client else 0
        preferred_installments = getattr(client, "preferred_installments", None) if client else None
        max_escalation_level = getattr(client, "max_escalation_level", None) if client else None
        custom_notes = getattr(client, "custom_notes", "") if client else ""

        effective_days = max(0, bond.days_overdue - (custom_grace or 0))

        if risk_score >= threshold or effective_days > 0 or bond.days_overdue > 0:
            strategy = determine_escalation_strategy(
                days_overdue=bond.days_overdue,
                risk_score=risk_score,
                policy=policy,
                policy_tier=policy_tier,
                custom_grace_days=custom_grace,
                max_escalation_level=max_escalation_level,
            )
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
                "policy_tier": policy_tier,
                "custom_grace_days": custom_grace,
                "preferred_installments": preferred_installments,
                "max_escalation_level": max_escalation_level,
                "custom_notes": custom_notes,
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
            "message": f"تم اكتشاف {len(high_risk_list)} حالة تتطلب المتابعة والتحصيل وفق سياسة الشركة.",
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
    is_disputed: bool = False,
    is_settled: bool = False,
    policy_tier: str = "standard",
    custom_grace_days: int = 0,
    preferred_installments: Optional[int] = None,
    max_escalation_level: Optional[int] = None,
    custom_notes: str = "",
) -> Dict[str, Any]:
    """
    Generates personalized Arabic copy based on policy escalation level and client agreement,
    records in NotificationRepository, sends via Resend if available,
    and logs action.
    """
    import resend

    resend_api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("FROM_EMAIL", "collections@tahseel.sa")

    policy = PolicyRepository.get_policy(session)

    msg_data = generate_reminder_message(
        client_name=client_name,
        amount=amount,
        days_overdue=days_overdue,
        description=description,
        bond_number=bond_number,
        risk_score=risk_score,
        is_disputed=is_disputed,
        is_settled=is_settled,
        policy=policy,
        policy_tier=policy_tier,
        custom_grace_days=custom_grace_days,
        preferred_installments=preferred_installments,
        max_escalation_level=max_escalation_level,
        custom_notes=custom_notes,
    )

    strategy = msg_data["strategy"]
    level = msg_data["level"]
    label = msg_data["label"]
    body = msg_data["body"]
    amount_str = f"{amount:,.2f} ر.س"

    if level == 0:
        return {
            "status": "skipped",
            "notification_id": None,
            "recipient": client_name,
            "level": 0,
            "label": label,
            "simulation": True,
            "message_preview": body,
        }

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
