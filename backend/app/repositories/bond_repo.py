import re
from typing import Any, Dict, List, Optional

from sqlmodel import Session, select

from app.models.bond import Bond
from app.repositories.client_repo import ClientRepository


def _parse_amount(raw: Any) -> float:
    """Safely extracts a numeric float from string with Arabic/English digits."""
    if isinstance(raw, (int, float)):
        return float(raw)
    cleaned = re.sub(r"[^\d.]", "", str(raw))
    return float(cleaned) if cleaned else 0.0


class BondRepository:
    @staticmethod
    def create_bond(session: Session, bond: Bond) -> Bond:
        """Persists a new bond record."""
        session.add(bond)
        session.commit()
        session.refresh(bond)
        return bond

    @staticmethod
    def get_bond(session: Session, bond_id: str) -> Optional[Bond]:
        """Gets a bond by its UUID."""
        return session.get(Bond, bond_id)

    @staticmethod
    def get_bond_by_number(session: Session, bond_number: str) -> Optional[Bond]:
        """Gets a bond by its unique bond number."""
        statement = select(Bond).where(Bond.bond_number == bond_number)
        return session.exec(statement).first()

    @staticmethod
    def list_bonds(
        session: Session,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Bond]:
        """Lists bonds optionally filtered by status, ordered by creation date."""
        statement = select(Bond)
        if status:
            statement = statement.where(Bond.status == status)
        statement = statement.order_by(Bond.created_at.desc()).limit(limit)
        return list(session.exec(statement).all())

    @staticmethod
    def list_active_bonds(session: Session) -> List[Bond]:
        """Lists all bonds that are active (pending, reminded, or overdue)."""
        statement = select(Bond).where(
            Bond.status.in_(["pending", "reminded", "overdue"])  # type: ignore
        ).order_by(Bond.created_at.desc())
        return list(session.exec(statement).all())

    @staticmethod
    def record_reminder(session: Session, bond_id: str) -> Optional[Bond]:
        """Updates last reminder timestamp and sets status to reminded if currently pending."""
        from datetime import datetime, timezone
        bond = session.get(Bond, bond_id)
        if bond:
            bond.last_reminder_at = datetime.now(timezone.utc)
            if bond.status == "pending":
                bond.status = "reminded"
            session.add(bond)
            session.commit()
            session.refresh(bond)
        return bond

    @staticmethod
    def update_bond_status(
        session: Session,
        bond_id: str,
        status: str,
        days_overdue: int = 0
    ) -> Optional[Bond]:
        """Updates status and overdue days for a bond."""
        bond = session.get(Bond, bond_id)
        if bond:
            bond.status = status
            bond.days_overdue = days_overdue
            session.add(bond)
            session.commit()
            session.refresh(bond)
        return bond

    @staticmethod
    def save_bond_from_ocr(session: Session, ocr_data: Dict[str, Any]) -> Bond:
        """
        Parses OCR extracted Arabic dictionary, upserts debtor client,
        and saves or updates the bond.
        """
        client_name = ocr_data.get("اسم_العميل", "عميل غير محدد")
        client_phone = ocr_data.get("رقم_الهاتف", "")
        client_email = ocr_data.get("ايميل_العميل", "")

        client = ClientRepository.upsert_client(
            session=session,
            name=client_name,
            phone=client_phone,
            email=client_email,
        )

        bond_number = ocr_data.get("رقم_السند", f"BOND-{client.name[:3]}")
        amount = _parse_amount(ocr_data.get("المبلغ", 0))
        issue_date = ocr_data.get("تاريخ_الاصدار", "2026-01-01")
        due_date = ocr_data.get("تاريخ_الاستحقاق") or ocr_data.get("تاريخ_الاصدار")
        description = ocr_data.get("وصف_سبب_الصرف", "")

        # Check if bond with this number already exists
        existing = BondRepository.get_bond_by_number(session, bond_number)
        if existing:
            existing.amount = amount
            existing.description = description
            existing.issue_date = issue_date
            existing.due_date = due_date
            existing.client_id = client.id
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

        new_bond = Bond(
            bond_number=bond_number,
            bond_type="صرف",
            issue_date=issue_date,
            due_date=due_date,
            client_id=client.id,
            description=description,
            amount=amount,
            status="pending",
        )
        return BondRepository.create_bond(session, new_bond)
