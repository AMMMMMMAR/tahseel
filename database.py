# database.py
# Supabase client + helper functions shared across the project

"""
SQL to run once in Supabase SQL Editor to create all tables:

-- 1. Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    risk_score FLOAT DEFAULT 0.0,
    avg_delay_days INT DEFAULT 0,
    total_bonds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bonds table (main table)
CREATE TABLE bonds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bond_number TEXT UNIQUE NOT NULL,
    bond_type TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    client_id UUID REFERENCES clients(id),
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    days_overdue INT DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Agent actions log
CREATE TABLE agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bond_id UUID REFERENCES bonds(id),
    action_type TEXT,
    details JSONB,
    executed_at TIMESTAMPTZ DEFAULT now()
);
"""

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

# Lazy Supabase client — only connects when first used.
# This prevents a startup crash when SUPABASE_URL is not yet set.
_supabase_client = None

def _get_supabase():
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_KEY", "")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL و SUPABASE_KEY غير موجودَين في ملف .env\n"
                "أضفهما أولاً ثم أعِد تشغيل الخادم."
            )
        _supabase_client = create_client(url, key)
    return _supabase_client

# Proxy object — use `supabase.table(...)` anywhere in the project
class _SupabaseProxy:
    def __getattr__(self, name):
        return getattr(_get_supabase(), name)

supabase = _SupabaseProxy()


def upsert_client(name: str, phone: str, email: str) -> str:
    """
    Finds a client by name — returns existing ID or creates a new one.
    Prevents duplicate clients from multiple bonds.
    """
    existing = supabase.table("clients") \
        .select("id") \
        .eq("name", name) \
        .execute()

    if existing.data:
        client_id = existing.data[0]["id"]
        supabase.table("clients").update({
            "phone": phone,
            "email": email
        }).eq("id", client_id).execute()
        return client_id
    else:
        result = supabase.table("clients").insert({
            "name": name,
            "phone": phone,
            "email": email
        }).execute()
        return result.data[0]["id"]


def save_bond_from_ocr(ocr_json: dict) -> dict:
    """
    Receives OCR JSON dict and stores it in Supabase.
    Called from FastAPI right after OCR completes.
    """
    # Step 1: find or create the client
    client_id = upsert_client(
        name=ocr_json.get("اسم_العميل", "غير محدد"),
        phone=ocr_json.get("رقم_الهاتف", ""),
        email=ocr_json.get("ايميل_العميل", "")
    )

    # Step 2: determine bond type from description
    description = ocr_json.get("وصف_سبب_الصرف", "")
    bond_type = "قبض" if "قبض" in description else "صرف"

    # Step 3: save the bond
    bond = supabase.table("bonds").insert({
        "bond_number": ocr_json.get("رقم_السند", ""),
        "bond_type": bond_type,
        "issue_date": ocr_json.get("تاريخ_الاصدار", ""),
        "client_id": client_id,
        "description": description,
        "amount": float(str(ocr_json.get("المبلغ", "0")).replace(",", "")),
        "status": "pending"
    }).execute()

    return bond.data[0]