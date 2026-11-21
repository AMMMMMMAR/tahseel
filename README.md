# Tahseel (تحصيل)

> Autonomous Arabic Financial Document Processing & Intelligent Debt Collection Engine.

[![CI Pipeline](https://github.com/AMMMMMMAR/tahseel/actions/workflows/ci.yml/badge.svg)](https://github.com/AMMMMMMAR/tahseel/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-16_(Turbopack)-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/Agent-LangGraph_StateGraph-1C3C3C)](https://langchain-ai.github.io/langgraph/)
[![SQLite](https://img.shields.io/badge/Database-SQLite_(Zero--Config)-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)

🇸🇦 **[اضغط هنا لقراءة التوثيق باللغة العربية (README in Arabic)](README.ar.md)**

---

## Overview

Tahseel is an open-source, production-grade financial automation system tailored for Arabic commercial instruments, promissory notes (*Sanad Li-Amr*), and invoice management. 

Combining **Multi-Modal Vision AI** with a **LangGraph StateGraph Engine**, Tahseel ingests financial papers, evaluates collection risks, executes configurable escalation policies, and communicates with debtors across verified channels (WhatsApp & Email).

---

## Key Features

1. **Arabic Financial OCR (Multi-Modal Vision)**
   - Extracts structured financial entities from mobile photos and scanned PDFs of Arabic commercial promissory notes.
   - Normalizes Arabic-Indic digits (٠-٩) and Hijri/Gregorian date formats.
   - Calculates real-time extraction confidence scores.

2. **Autonomous Decision Agent (LangGraph StateGraph)**
   - 4-Node cyclic financial workflow:
     1. `assess_risks`: Evaluates delinquency buckets, debtor history, and overdue exposure.
     2. `select_strategies`: Matches individual client agreements against customizable corporate collection policies.
     3. `draft_and_dispatch`: Dispatches personalized notifications via WhatsApp or Email.
     4. `generate_report`: Compiles daily portfolio executive analytics.

3. **Dynamic Corporate Policy Engine**
   - Configurable escalation thresholds (Friendly Reminder -> Formal Follow-up -> Legal Notice).
   - Client-tier agreements (VIP Executive Courtesy vs. Strict Legal Expedited Track).
   - Installment proposal automation.

4. **Zero-Setup Local SQLite Database**
   - Self-bootstrapping database via SQLModel.
   - Instant developer seeding via UI or `/api/seed`.

5. **Real-Time Observability**
   - WebSocket streaming for agent trace visualization and step progression.
   - Executive financial reports and audit logs.

6. **Automated Evaluation Benchmark**
   - 20 realistic financial scenarios in `backend/evals/`.
   - 47 automated tests guaranteeing 100% test pass rate.

---

## System Architecture

```text
  [ Commercial Bond / Invoice (Image or PDF) ]
                       │
                       ▼
         [ Gemini 2.5 Flash Vision OCR ]
                       │ (Structured Extraction)
                       ▼
       [ FastAPI Application Core (Python 3.11) ]
         ├── SQLite Database (SQLModel Engine)
         ├── WebSocket Live Trace Broadcaster
         └── Corporate Policy Engine
                       │
                       ▼
         [ LangGraph StateGraph Agent ]
         ├── Node 1: Risk Assessment
         ├── Node 2: Strategy Determination
         ├── Node 3: Notification Dispatch (WhatsApp / Resend)
         └── Node 4: Daily Portfolio Reporting
                       │
                       ▼
      [ Next.js 16 Production Dashboard ]
        (RTL Arabic Interface • Tailwind CSS)
```

---

## Project Structure

```text
tahseel/
├── backend/
│   ├── app/
│   │   ├── agent/           # LangGraph StateGraph, nodes, and policy router
│   │   ├── api/             # FastAPI routers (bonds, agent, policy, websocket)
│   │   ├── core/            # Config, SQLite database engine, repositories
│   │   ├── models/          # SQLModel table definitions & schemas
│   │   ├── ocr/             # Multi-modal vision extraction & normalizers
│   │   └── services/        # Delivery services (WhatsApp, Resend Email)
│   ├── data/                # Local SQLite storage directory
│   ├── evals/               # 20 financial scenarios and benchmark runner
│   ├── tests/               # 47 automated Pytest unit and integration tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (Dashboard, OCR, Reports, Settings)
│   │   ├── components/      # UI components, traces, tables, and dialogs
│   │   ├── hooks/           # WebSocket and TanStack Query hooks
│   │   └── lib/             # API client, bond calculations, utilities
│   ├── Dockerfile
│   └── package.json
├── .github/                 # GitHub Actions CI workflow & issue templates
├── docker-compose.yml       # One-click multi-container stack
├── LICENSE                  # MIT License
└── README.md                # Documentation
```

---

## Quickstart Guide

### Option 1: Local Development (Recommended)

#### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

#### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Open .env and set GEMINI_API_KEY=your_key_here

# Start backend server
uvicorn app.main:app --port 8000 --reload
```

Backend will be accessible at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

#### 2. Frontend Setup

In a new terminal:

```bash
cd frontend

# Install packages
npm install

# Start Next.js development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

### Option 2: Docker Compose

Run the entire stack with a single command:

```bash
docker compose up --build
```

---

## Testing & Quality Assurance

Tahseel includes automated test suites covering OCR normalization, repository lifecycles, escalation logic, and evaluation benchmarks:

```bash
# Run backend test suite (47 tests)
cd backend
pytest tests/ -v

# Run frontend linting & production build
cd frontend
npm run lint
npm run build
```

---

## Contributing

Contributions, issues, and feature requests are welcome! Please check [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## License

This project is licensed under the terms of the [MIT License](LICENSE).
