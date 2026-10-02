from sqlmodel import Session

from app.agent.agent import run_daily_cycle
from app.agent.tools import (
    analyze_and_update_risks_sync,
    determine_escalation_strategy,
    generate_daily_report_sync,
    get_high_risk_bonds_sync,
    send_smart_reminder_sync,
)
from app.core.db import get_engine
from app.models.bond import Bond
from app.models.notification import Notification
from app.repositories.action_repo import ActionRepository
from app.repositories.bond_repo import BondRepository
from app.repositories.client_repo import ClientRepository


def test_escalation_strategy_tiers():
    """Validates that 4-tier escalation correctly categorizes delinquency and risk."""
    # Level 1: Friendly / Pre-due
    s1 = determine_escalation_strategy(days_overdue=0, risk_score=25.0)
    assert s1["level"] == 1
    assert s1["urgency"] == "friendly"
    assert "ودي" in s1["label"]

    # Level 2: Official Follow-Up
    s2 = determine_escalation_strategy(days_overdue=7, risk_score=50.0)
    assert s2["level"] == 2
    assert s2["urgency"] == "official"
    assert "رسمية" in s2["label"]

    # Level 3: Urgent Warning & Payment Plan
    s3 = determine_escalation_strategy(days_overdue=20, risk_score=75.0)
    assert s3["level"] == 3
    assert s3["urgency"] == "urgent"
    assert "خطة سداد" in s3["label"]

    # Level 4: Final Legal Notice
    s4 = determine_escalation_strategy(days_overdue=45, risk_score=90.0)
    assert s4["level"] == 4
    assert s4["urgency"] == "legal_notice"
    assert "إنذار قانوني" in s4["label"]


def test_risk_assessment_sync():
    """Verifies portfolio delay risk calculations and SQLite persistence."""
    engine = get_engine()
    with Session(engine) as session:
        client = ClientRepository.upsert_client(
            session=session,
            name="شركة السالم للإنشاءات",
            phone="0501234567",
            email="salem@example.com",
        )
        client.avg_delay_days = 15
        session.add(client)
        session.commit()

        bond = Bond(
            bond_number="BOND-RISK-01",
            bond_type="صرف",
            issue_date="2026-01-01",
            due_date="2026-01-15",
            client_id=client.id,
            description="توريد مواد بناء",
            amount=75000.0,
            status="pending",
        )
        BondRepository.create_bond(session, bond)

        # Run risk assessment
        result = analyze_and_update_risks_sync(session)
        assert result["status"] == "success"
        assert result["updated_count"] >= 1

        # Check that bond days overdue and status were updated
        session.refresh(bond)
        assert bond.days_overdue > 0
        assert bond.status in ("reminded", "overdue")

        # Check client risk score
        session.refresh(client)
        assert client.risk_score > 0

        # Check action logging
        actions = ActionRepository.list_actions(session, limit=10)
        assert any(a.action_type == "analyze_risks" for a in actions)


def test_get_high_risk_bonds_sync():
    """Verifies that high-risk debtors are filtered with escalation strategies."""
    engine = get_engine()
    with Session(engine) as session:
        client = ClientRepository.upsert_client(
            session=session,
            name="مؤسسة النور المتميزة",
            phone="0559988776",
            email="alnoor@example.com",
        )
        client.risk_score = 88.0
        session.add(client)
        session.commit()

        bond = Bond(
            bond_number="BOND-HIGH-01",
            bond_type="صرف",
            issue_date="2026-01-01",
            due_date="2026-02-01",
            client_id=client.id,
            description="خدمات استشارية",
            amount=60000.0,
            status="pending",
            days_overdue=35,
        )
        BondRepository.create_bond(session, bond)

        high_risk = get_high_risk_bonds_sync(session, threshold=70.0)
        assert len(high_risk) >= 1

        found = next((b for b in high_risk if b["bond_number"] == "BOND-HIGH-01"), None)
        assert found is not None
        assert found["strategy"]["level"] == 4
        assert found["client_name"] == "مؤسسة النور المتميزة"


def test_send_smart_reminder_sync_simulation():
    """Verifies message drafting, notification creation, and simulation logging."""
    engine = get_engine()
    with Session(engine) as session:
        client = ClientRepository.upsert_client(
            session=session,
            name="شركة الوفاق التجارية",
            phone="0512345678",
            email="wefaq@example.com",
        )
        bond = Bond(
            bond_number="BOND-REMIND-01",
            bond_type="صرف",
            issue_date="2026-01-01",
            client_id=client.id,
            description="شحنة مستلزمات طبية",
            amount=42000.0,
            status="pending",
        )
        BondRepository.create_bond(session, bond)

        result = send_smart_reminder_sync(
            session=session,
            bond_id=bond.id,
            client_name=client.name,
            client_email=client.email,
            amount=bond.amount,
            days_overdue=18,
            description=bond.description,
            bond_number=bond.bond_number,
            risk_score=75.0,
        )

        assert result["status"] == "success"
        assert result["level"] == 3
        assert result["simulation"] is True

        # Check notification record
        notif = session.get(Notification, result["notification_id"])
        assert notif is not None
        assert notif.recipient_name == "شركة الوفاق التجارية"
        assert "42,000" in notif.message_body

        # Check bond updated
        session.refresh(bond)
        assert bond.last_reminder_at is not None


def test_generate_daily_report_sync():
    """Verifies aggregate portfolio figures calculation."""
    engine = get_engine()
    with Session(engine) as session:
        report = generate_daily_report_sync(session)
        assert "تاريخ_التقرير" in report
        assert "إجمالي_الديون_النشطة" in report
        assert "المتأخرات_المتراكمة" in report
        assert "عدد_السندات_النشطة" in report


def test_run_daily_cycle_end_to_end():
    """Tests the full LangGraph 4-node execution cycle end-to-end."""
    state = run_daily_cycle(session_id="test-session-e2e")
    assert state.get("error") is None
    assert state.get("session_id") == "test-session-e2e"
    assert state.get("current_step") == "generate_report"
    assert "report" in state
    assert len(state.get("logs", [])) >= 4


def test_agent_api_routes(client):
    """Verifies FastAPI endpoints POST /api/agent/run and GET /api/agent/logs."""
    # 1. Trigger agent run
    run_resp = client.post("/api/agent/run")
    assert run_resp.status_code == 200
    data = run_resp.json()
    assert data["success"] is True
    assert "report" in data
    assert "reminders_sent" in data

    # 2. Query logs
    logs_resp = client.get("/api/agent/logs?limit=10")
    assert logs_resp.status_code == 200
    logs_data = logs_resp.json()
    assert logs_data["success"] is True
    assert isinstance(logs_data["logs"], list)


def test_websocket_agent_endpoint(client):
    """Verifies WebSocket handshake and interactive messaging on /ws/agent."""
    with client.websocket_connect("/ws/agent") as ws:
        # Initial greeting event
        greeting = ws.receive_json()
        assert greeting["type"] == "connected"
        assert "Tahseel" in greeting["data"]["message"]

        # Heartbeat ping-pong
        ws.send_text("ping")
        response = ws.receive_text()
        assert response == "pong"
