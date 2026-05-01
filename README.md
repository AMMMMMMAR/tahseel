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
     ▼ (daily at 08:00 via cron or manually via UI)
 LangGraph AI Agent (Gemini)      ← reads DB → analyzes risk → acts
     │
     ├── analyze_risk()           → updates risk scores per client
     ├── send_reminder()          → sends personalized emails via Resend
     └── generate_report()        → daily summary for management
```

---

## 📁 Project Structure

```
tahseel/
├── .env                    # 🔐 Backend secret keys (never commit)
├── .env.local              # 🔐 Frontend env (NEXT_PUBLIC_*) — never commit
├── .env.local.example      # Template for frontend env
├── requirements.txt        # Python dependencies (used by Vercel python runtime)
├── package.json            # Next.js dependencies (frontend at repo root)
├── next.config.ts          # Next.js config
├── vercel.json             # Vercel monorepo routing (Next.js + FastAPI)
├── database.py             # Supabase client + DB helper functions
├── cron_job.py             # Optional daily scheduler (08:00)
│
├── src/                    # Next.js 16 App Router (frontend)
│   ├── app/                # Routes, layouts, dashboard pages
│   ├── components/         # UI + dashboard + layout components
│   ├── hooks/              # React Query hooks
│   └── lib/                # API client, types, utils
├── public/                 # Next.js static assets
│
├── api/                    # FastAPI app (Vercel Python serverless)
│   ├── index.py            # Entry point exposed as `app`
│   ├── bonds.py            # /api/bonds, /api/bonds/upload, /api/bonds/ocr
│   └── agent.py            # /api/agent/run, /api/agent/logs
│
├── ocr/
│   └── ocr_model.py        # Gemini OCR — image → Arabic JSON
│
└── agent/
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

Backend (`.env` at repo root):

```env
# Gemini — for OCR (image → JSON) AND LangGraph AI Agent
GEMINI_API_KEY=AIzaSy...

# Supabase — for database storage
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_KEY=<your-service-role-key>

# Resend — for sending reminder emails
RESEND_API_KEY=re_...
FROM_EMAIL=collections@yourcompany.com
```

Frontend (`.env.local` at repo root, copy from `.env.local.example`):

```env
# Leave empty in production — calls become same-origin (/api/*) on Vercel.
# Locally, point at the FastAPI dev server.
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_COMPANY_NAME=شركة الأمل للتجارة
NEXT_PUBLIC_USER_NAME=عمر عبدالله
NEXT_PUBLIC_USER_ROLE=مدير التحصيل
```

> **Where to get each key:**
> | Key | Source |
> |-----|--------|
> | `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
> | `SUPABASE_URL` / `SUPABASE_KEY` | Supabase → Project Settings → API |
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

### Local Development (two terminals)

**Terminal 1 — Backend (FastAPI):**
```bash
uvicorn api.index:app --reload
```
Runs at **http://localhost:8000**. Check API docs at `/docs`.

**Terminal 2 — Frontend (Next.js):**
```bash
npm install
npm run dev
```
Opens at **http://localhost:3000** — the professional web dashboard.

### Production (Vercel)

A single Vercel project deploys the whole repo:
- `/` and any non-API path → Next.js frontend.
- `/api/*`, `/health`, `/docs`, `/openapi.json` → FastAPI (Python serverless via `api/index.py`).

Routing is defined in `vercel.json`. Set the same secret keys (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`) in **Project → Settings → Environment Variables**. Leave `NEXT_PUBLIC_API_BASE_URL` empty (or unset) in production so calls stay same-origin.

### Optional — Daily Cron Job

```bash
python cron_job.py
```

Runs the AI Agent every day at **08:00**.

---

## 🧪 Testing Flow (Step by Step)

```
1. Start Backend & Frontend
2. Go to:               http://localhost:3000
3. Upload Bond:         Click "+ رفع سند جديد" and upload an Arabic bond/invoice.
4. OCR & Save:          Review the extracted JSON from Gemini and click Save.
5. Verify:              Go back to Dashboard, see the new bond and updated metrics.
6. Trigger Agent:       Click "🤖 تشغيل الوكيل الذكي" in the top bar.
7. Agent Logs:          Navigate to "نشاط الوكيل (Logs)" to see the explainable AI timeline (risk analysis, warnings, and emails sent).
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
| `langchain-google-genai`| Gemini 2.5 Flash for agent decisions |
| `resend` | Transactional email sending |
| `next.js` (frontend) | Production web dashboard |
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
