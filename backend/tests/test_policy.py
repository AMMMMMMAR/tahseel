import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.agent.tools import determine_escalation_strategy, generate_reminder_message
from app.core.db import get_session
from app.main import app
from app.models.client import Client


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_policy_crud_endpoints(client: TestClient):
    # 1. Fetch initial default policy
    resp = client.get("/api/policy")
    assert resp.status_code == 200
    data = resp.json()
    assert data["company_name"] == "شركة الأمل للتجارة"
    assert data["legal_warning_days"] == 30

    # 2. Update policy
    update_payload = {
        "company_name": "شركة التوفيق للتمويل",
        "legal_warning_days": 45,
        "official_followup_days": 20,
        "friendly_reminder_days": 5,
        "enable_installment_plans": True,
        "default_installments_count": 4,
        "communication_tone": "firm",
        "allow_auto_legal_notice": False,
    }
    resp = client.put("/api/policy", json=update_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["company_name"] == "شركة التوفيق للتمويل"
    assert data["legal_warning_days"] == 45
    assert data["default_installments_count"] == 4

    # 3. Reset policy
    resp = client.post("/api/policy/reset")
    assert resp.status_code == 200
    reset_data = resp.json()
    assert reset_data["company_name"] == "شركة الأمل للتجارة"
    assert reset_data["legal_warning_days"] == 30


def test_client_agreement_endpoint_and_strategy(client: TestClient, session: Session):
    # Create test client
    db_client = Client(
        id="CLI-AGREE-01",
        name="سالم عبد العزيز",
        phone="966500000001",
        preferred_installments=6,
        max_escalation_level=2,
        custom_notes="اتفاقية سداد استثنائية على 6 أقساط"
    )
    session.add(db_client)
    session.commit()

    # Update client agreement via API
    resp = client.put(
        "/api/policy/clients/CLI-AGREE-01",
        json={
            "policy_tier": "vip",
            "custom_grace_days": 10,
            "preferred_installments": 6,
            "max_escalation_level": 2,
            "custom_notes": "جدولة خاصة وافقت عليها الإدارة"
        }
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    assert resp.json()["preferred_installments"] == 6

    # Verify escalation capping
    # Even if overdue is 45 days (normally Level 4 legal notice), max_escalation_level=2 caps it at Level 2
    strat_capped = determine_escalation_strategy(
        days_overdue=45,
        risk_score=75.0,
        policy=None,
        max_escalation_level=2
    )
    assert strat_capped["level"] == 2
    assert "سقف" in strat_capped["label"] or strat_capped["level"] == 2

    # Verify customized installments in reminder message
    # Client B with 6 installments: 30,000 / 6 = 5,000 SAR per month
    res_client_b = generate_reminder_message(
        client_name="سالم عبد العزيز",
        amount=30000.0,
        days_overdue=20,
        description="فاتورة توريد",
        preferred_installments=6,
    )
    msg_b = res_client_b["body"]
    assert "6" in msg_b
    assert "5,000.00" in msg_b

    # Client A with default/3 installments: 30,000 / 3 = 10,000 SAR per month
    res_client_a = generate_reminder_message(
        client_name="خالد التميمي",
        amount=30000.0,
        days_overdue=20,
        description="فاتورة توريد",
        preferred_installments=3,
    )
    msg_a = res_client_a["body"]
    assert "3" in msg_a
    assert "10,000.00" in msg_a
