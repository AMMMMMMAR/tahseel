import pytest
from sqlmodel import Session

from app.core.db import engine, init_db
from app.models.bond import Bond
from app.repositories.bond_repo import BondRepository
from app.repositories.client_repo import ClientRepository
from app.repositories.notification_repo import NotificationRepository


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database tables are initialized before each test."""
    init_db()


def test_client_repository_upsert():
    """Tests creating and updating a client via ClientRepository."""
    with Session(engine) as session:
        client = ClientRepository.upsert_client(
            session=session,
            name="شركة الاختبار",
            phone="0500000000",
            email="test@company.sa",
        )
        assert client.id is not None
        assert client.name == "شركة الاختبار"
        assert client.email == "test@company.sa"

        # Update existing client
        updated = ClientRepository.upsert_client(
            session=session,
            name="شركة الاختبار",
            phone="0511111111",
        )
        assert updated.id == client.id
        assert updated.phone == "0511111111"


def test_bond_repository_lifecycle():
    """Tests bond creation and status updates."""
    with Session(engine) as session:
        client = ClientRepository.upsert_client(
            session=session,
            name="عميل السند",
        )

        bond = Bond(
            bond_number="BOND-TEST-001",
            amount=50000.0,
            issue_date="2026-08-01",
            client_id=client.id,
            status="pending",
        )
        created = BondRepository.create_bond(session, bond)
        assert created.id is not None
        assert created.amount == 50000.0

        # Query bond
        fetched = BondRepository.get_bond(session, created.id)
        assert fetched is not None
        assert fetched.bond_number == "BOND-TEST-001"

        # Update status
        updated = BondRepository.update_bond_status(session, created.id, status="overdue", days_overdue=10)
        assert updated.status == "overdue"
        assert updated.days_overdue == 10


def test_notification_repository():
    """Tests creating, querying, and marking notifications as read."""
    with Session(engine) as session:
        notif = NotificationRepository.create_notification(
            session=session,
            recipient_name="عميل تجريبي",
            title="تنبيه تجريبي",
            message_body="رسالة اختبارية",
            urgency="formal",
        )
        assert notif.id is not None
        assert not notif.is_read

        # Count unread
        unread = NotificationRepository.count_unread(session)
        assert unread >= 1

        # Mark read
        marked = NotificationRepository.mark_as_read(session, notif.id)
        assert marked.is_read is True


def test_api_bonds_endpoint(client):
    """Tests GET /api/bonds returns bonds with client relation."""
    response = client.get("/api/bonds")
    assert response.status_code == 200
    data = response.json()
    assert "bonds" in data
    assert "count" in data
    assert isinstance(data["bonds"], list)


def test_api_notifications_endpoints(client):
    """Tests /api/notifications endpoints."""
    # List notifications
    response = client.get("/api/notifications")
    assert response.status_code == 200
    data = response.json()
    assert "notifications" in data
    assert "unread_count" in data

    # Create new notification via API
    payload = {
        "recipient_name": "شركة تجريبية",
        "title": "إشعار API",
        "message_body": "محتوى الإشعار",
        "urgency": "friendly",
    }
    create_res = client.post("/api/notifications", json=payload)
    assert create_res.status_code == 200
    created_id = create_res.json()["notification"]["id"]

    # Mark as read
    patch_res = client.patch(f"/api/notifications/{created_id}/read")
    assert patch_res.status_code == 200
    assert patch_res.json()["notification"]["is_read"] is True
