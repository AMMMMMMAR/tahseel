# agent/tools.py
# All LangGraph tools the Agent can call

from langchain.tools import tool
from database import supabase
from datetime import date, datetime
import resend, os, json

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "collections@yourcompany.com")


@tool
def analyze_and_update_risks() -> str:
    """
    Daily first task — analyzes delay risk for every active bond and updates DB.

    Risk algorithm:
    - Days since issue (0-30+ days)
    - Client's historical average delay
    - Amount relative to threshold (>50,000 = higher risk)
    Result: score 0–100
    """
    today = date.today()

    bonds = supabase.table("bonds") \
        .select("*, clients(*)") \
        .in_("status", ["pending", "reminded", "overdue"]) \
        .execute()

    updated_count = 0

    for bond in bonds.data:
        issue_date = datetime.strptime(bond["issue_date"], "%Y-%m-%d").date()
        days_since_issue = (today - issue_date).days

        # Risk score calculation
        base_risk = min(days_since_issue * 2, 60)
        history_risk = bond["clients"].get("avg_delay_days", 0) * 1.5
        amount_risk = 10 if bond["amount"] > 50000 else 0
        total_risk = min(base_risk + history_risk + amount_risk, 100)

        # Determine status based on days elapsed
        new_status = bond["status"]
        if days_since_issue > 30:
            new_status = "overdue"
        elif days_since_issue > 14:
            new_status = "reminded"

        # Update bond
        supabase.table("bonds").update({
            "days_overdue": max(0, days_since_issue - 30),
            "status": new_status
        }).eq("id", bond["id"]).execute()

        # Update client risk score
        supabase.table("clients").update({
            "risk_score": total_risk
        }).eq("id", bond["client_id"]).execute()

        updated_count += 1

    return f"تم تحديث {updated_count} سند. اكتملت مرحلة تحليل المخاطر."


@tool
def get_high_risk_bonds(threshold: float = 70.0) -> str:
    """
    Returns bonds where the client's risk score exceeds the threshold.
    threshold: minimum risk score (default 70%)
    Used to identify cases needing immediate action.
    """
    high_risk = supabase.table("bonds") \
        .select("*, clients(name, email, phone, risk_score)") \
        .in_("status", ["pending", "reminded", "overdue"]) \
        .execute()

    # Filter client risk score manually (Supabase filter on joined tables varies)
    filtered = [
        b for b in high_risk.data
        if b.get("clients") and b["clients"].get("risk_score", 0) >= threshold
    ]

    if not filtered:
        return "لا توجد حالات خطر عالٍ اليوم."

    summary = []
    for bond in filtered:
        summary.append({
            "bond_id": bond["id"],
            "client": bond["clients"]["name"],
            "email": bond["clients"]["email"],
            "amount": bond["amount"],
            "risk_score": bond["clients"]["risk_score"],
            "days_overdue": bond["days_overdue"],
            "description": bond["description"]
        })

    return json.dumps(summary, ensure_ascii=False)


@tool
def send_smart_reminder(
    bond_id: str,
    client_email: str,
    client_name: str,
    amount: float,
    days_overdue: int,
    description: str
) -> str:
    """
    Generates a personalized reminder email and sends it via Resend.
    Tone adjusts based on days overdue — polite first, then formal.
    Logs every send to agent_actions table.
    """
    if days_overdue <= 0:
        tone = "تذكير ودي قبل موعد الاستحقاق"
        urgency = "لا داعي للقلق، مجرد تذكير مسبق"
    elif days_overdue <= 7:
        tone = "تذكير مهذب ومباشر"
        urgency = "نأمل التسوية في أقرب وقت ممكن"
    else:
        tone = "تنبيه رسمي"
        urgency = "يرجى التواصل فورياً لترتيب السداد"

    message_body = f"""السيد/ة {client_name} المحترم/ة،

تحية طيبة،

نودّ تذكيركم بمبلغ {amount:,.2f} ريال المتعلق بـ: {description}.

{urgency}.

للاستفسار أو ترتيب السداد، يرجى التواصل معنا مباشرة.

مع تحياتنا،
فريق المحاسبة""".strip()

    try:
        # Simulation Mode if no Resend API key
        if not resend.api_key or resend.api_key.strip() == "":
            print(f"\n[Simulation] 📧 محاكاة إرسال بريد إلى {client_email}")
            print(f"[Simulation] الموضوع: تذكير — مبلغ {amount:,.0f} ريال")
            print(f"[Simulation] المحتوى:\n{message_body}\n")
        else:
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": client_email,
                "subject": f"تذكير — مبلغ {amount:,.0f} ريال",
                "text": message_body
            })

        # Log the action
        supabase.table("agent_actions").insert({
            "bond_id": bond_id,
            "action_type": "reminder_sent",
            "details": {
                "to": client_email,
                "tone": tone,
                "days_overdue": days_overdue
            }
        }).execute()

        # Update last reminder timestamp on bond
        supabase.table("bonds").update({
            "last_reminder_at": datetime.now().isoformat()
        }).eq("id", bond_id).execute()

        return f"تم إرسال التذكير لـ {client_name} ({client_email})"

    except Exception as e:
        return f"فشل الإرسال: {str(e)}"


@tool
def generate_daily_report() -> str:
    """
    Generates a comprehensive daily report for management.
    Includes: total debt, overdue amounts, monthly collections, forecast.
    """
    today = date.today()

    active = supabase.table("bonds") \
        .select("amount, status, days_overdue") \
        .in_("status", ["pending", "reminded", "overdue"]) \
        .execute()

    settled = supabase.table("bonds") \
        .select("amount") \
        .eq("status", "settled") \
        .gte("created_at", f"{today.year}-{today.month:02d}-01") \
        .execute()

    total_active = sum(b["amount"] for b in active.data)
    total_overdue = sum(b["amount"] for b in active.data if b["status"] == "overdue")
    total_settled = sum(b["amount"] for b in settled.data)

    report = {
        "تاريخ_التقرير": str(today),
        "إجمالي_الديون_النشطة": f"{total_active:,.2f} ريال",
        "المتأخرات": f"{total_overdue:,.2f} ريال",
        "المحصّل_هذا_الشهر": f"{total_settled:,.2f} ريال",
        "عدد_السندات_النشطة": len(active.data),
        "عدد_المتأخرة": len([b for b in active.data if b["status"] == "overdue"])
    }

    return json.dumps(report, ensure_ascii=False, indent=2)
