# Tahseel — نظام تحصيل الديون الذكي

<div dir="rtl">

نظام متكامل لإدارة السندات التجارية العربية باستخدام الذكاء الاصطناعي. يقرأ السندات من الصور تلقائياً، يحللها، ويُرسل تذكيرات مخصصة للعملاء عبر البريد الإلكتروني.

</div>

---

## 🏗️ Project Architecture

```
[Bond Image]
     │
     ▼
 OCR (Gemini 2.5 Flash)          ← extracts Arabic JSON from bond photos
     │
     ▼
 FastAPI  /api/bonds/upload       ← receives & validates the JSON
     │
     ▼
 Supabase PostgreSQL              ← stores clients, bonds, agent logs
     │
     ▼ (daily at 08:00 via cron)
 LangGraph AI Agent               ← reads DB → analyzes risk → acts
     │
     ├── analyze_risk()           → updates risk scores per client
     ├── send_reminder()          → sends personalized emails via Resend
     └── generate_report()        → daily summary for management
```

---

## 📁 Project Structure

```
tahseeI/
├── .env                    # 🔐 Secret keys (never commit)
├── .env.example            # Template for new team members
├── requirements.txt        # All Python dependencies
├── main.py                 # FastAPI entry point
├── database.py             # Supabase client + DB helper functions
├── cron_job.py             # Daily scheduler (runs agent at 08:00)
├── streamlit_app.py        # Testing dashboard UI
│
├── ocr/
│   ├── __init__.py
│   └── ocr_model.py        # Gemini OCR — image → Arabic JSON
│
├── api/
│   ├── __init__.py
│   └── bonds.py            # FastAPI router (/api/bonds, /api/bonds/upload)
│
└── agent/
    ├── __init__.py
    ├── agent.py            # LangGraph StateGraph orchestrator
    └── tools.py            # 4 agent tools (analyze, remind, report, query)
```

---

## ⚙️ Setup Guide

### 1. Clone & Install

```bash
git clone <repo-url>
cd tahseeI
pip install -r requirements.txt
```

### 2. Environment Variables

Copy the example file and fill in your keys:

```bash
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux
```

Edit `.env`:

```env
# Gemini — for OCR (image → JSON)
GEMINI_API_KEY=AIzaSy...

# Supabase — for database storage
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_KEY=<your-service-role-key>

# OpenAI — for the LangGraph AI Agent
OPENAI_API_KEY=sk-...

# Resend — for sending reminder emails
RESEND_API_KEY=re_...
FROM_EMAIL=collections@yourcompany.com

# Shown in the Streamlit sidebar
COMPANY_NAME=شركة الأمل للتجارة
```

> **Where to get each key:**
> | Key | Source |
> |-----|--------|
> | `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
> | `SUPABASE_URL` / `SUPABASE_KEY` | Supabase → Project Settings → API |
> | `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) |
> | `RESEND_API_KEY` | [resend.com](https://resend.com) |

---

### 3. Supabase Database Setup

Go to your Supabase project → **SQL Editor** → run this once:

```sql
-- Clients table
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

-- Bonds table (main)
CREATE TABLE bonds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bond_number TEXT UNIQUE NOT NULL,
    bond_type TEXT NOT NULL,              -- 'صرف' or 'قبض'
    issue_date DATE NOT NULL,
    due_date DATE,
    client_id UUID REFERENCES clients(id),
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    status TEXT DEFAULT 'pending',        -- pending | reminded | overdue | settled
    days_overdue INT DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent action log
CREATE TABLE agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bond_id UUID REFERENCES bonds(id),
    action_type TEXT,                     -- reminder_sent | risk_updated | report_generated
    details JSONB,
    executed_at TIMESTAMPTZ DEFAULT now()
);
```

> **Note:** Use the **service_role** key (not the anon key) in `SUPABASE_KEY` so the backend has full DB access.

---

## 🚀 Running the Project

### Option A — Testing Dashboard (Streamlit)

```bash
streamlit run streamlit_app.py
```

Opens at **http://localhost:8501** — use this to:
- Upload bond images and test OCR extraction
- View clients and bonds from the database
- Manually trigger the AI Agent
- Generate and download daily reports

### Option B — FastAPI Server

```bash
uvicorn main:app --reload
```

Opens at **http://localhost:8000/docs** — interactive API documentation.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bonds/upload` | `POST` | Upload bond image → OCR → save to DB |
| `/api/bonds` | `POST` | Send pre-processed OCR JSON directly |
| `/api/bonds` | `GET` | List all bonds (optional `?status=overdue`) |
| `/health` | `GET` | Server health check |

### Option C — Daily Cron Job

```bash
python cron_job.py
```

Runs the AI Agent every day at **08:00**. Deploy this on Railway, Render, or any always-on server.

---

## 🧪 Testing Flow (Step by Step)

```
1. Start Streamlit:     streamlit run streamlit_app.py
2. Go to:               "رفع السندات" tab
3. Upload:              A photo of an Arabic bond/invoice
4. Click:               "استخراج البيانات بـ Gemini"
5. Review & edit:       The extracted JSON fields
6. Click:               "حفظ السند في قاعدة البيانات"
7. Verify:              Go to "الفواتير" tab — bond should appear
8. Verify:              Go to "العملاء" tab — client should appear
9. Test Agent:          Go to "AI Agent" tab → run individual tools
10. Test Report:        Go to "التقارير" tab → generate daily report
```

---

## 🔄 Data Flow Detail

```
Bond Image (JPG/PNG)
        │
        │  ocr/ocr_model.py
        │  extract_bond_from_bytes()
        │  Gemini 2.5 Flash → JSON schema enforcement
        ▼
{
  "رقم_السند": "INV-2024-001",
  "اسم_العميل": "شركة النور",
  "تاريخ_الاصدار": "2024-04-01",
  "المبلغ": "45000",
  "رقم_الهاتف": "0501234567",
  "ايميل_العميل": "info@alnoor.com",
  "وصف_سبب_الصرف": "توريد بضائع"
}
        │
        │  database.py
        │  upsert_client()  → finds or creates client record
        │  save_bond_from_ocr()  → inserts bond record
        ▼
Supabase [clients] + [bonds] tables
        │
        │  (daily at 08:00)
        │  agent/agent.py → LangGraph StateGraph
        ▼
Agent Loop:
  1. analyze_and_update_risks()  → recalculates risk score (0–100) per client
  2. get_high_risk_bonds(70)     → fetches bonds with risk > 70%
  3. send_smart_reminder()       → sends personalized email via Resend
  4. generate_daily_report()     → JSON summary for management
        │
        ▼
[agent_actions] log in Supabase
```

---

## 🤖 AI Agent — Risk Algorithm

```python
risk_score = min(
    (days_since_issue * 2)          # base: 2 points per day, max 60
    + (avg_delay_days * 1.5)        # history: client's past delays
    + (10 if amount > 50000 else 0) # amount: large amounts = higher risk
    , 100
)
```

| Risk Score | Status | Action |
|-----------|--------|--------|
| 0–39% | Low | Monitor only |
| 40–69% | Medium | Friendly reminder |
| 70–100% | High | Formal alert + immediate action |

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` + `uvicorn` | REST API server |
| `supabase` | PostgreSQL database client |
| `google-genai` | Gemini 2.5 Flash for OCR |
| `langgraph` | AI Agent orchestration |
| `langchain-openai` | GPT-4o-mini for agent decisions |
| `resend` | Transactional email sending |
| `streamlit` | Testing dashboard UI |
| `python-dotenv` | Environment variable loading |

---

## 🔐 Security Notes

- **Never commit `.env`** — it's in `.gitignore`
- Use the **service_role** Supabase key server-side only
- The `GEMINI_API_KEY` shown in `.env.example` is a placeholder — rotate your real key regularly
- Enable **Row Level Security (RLS)** in Supabase for production

---

## 🗺️ Roadmap

- [ ] Add `due_date` auto-calculation (e.g., 30 days after `issue_date`)
- [ ] Connect a production frontend (replacing Streamlit)
- [ ] Add WhatsApp reminders via Twilio
- [ ] Multi-company support with tenant isolation
- [ ] Dashboard charts (collection rate over time)
- [ ] PDF report export

---

## 👥 Team Contacts

| Role | Responsible |
|------|-------------|
| Backend / AI Agent | — |
| OCR Pipeline | — |
| Frontend (next phase) | — |
| DevOps / Deployment | — |
