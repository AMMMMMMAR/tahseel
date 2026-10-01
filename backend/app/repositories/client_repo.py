from typing import List, Optional

from sqlmodel import Session, select

from app.models.client import Client


class ClientRepository:
    @staticmethod
    def upsert_client(
        session: Session,
        name: str,
        phone: str = "",
        email: str = ""
    ) -> Client:
        """Finds existing client by name or creates a new one to prevent duplicates."""
        statement = select(Client).where(Client.name == name)
        existing = session.exec(statement).first()

        if existing:
            if phone:
                existing.phone = phone
            if email:
                existing.email = email
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing

        new_client = Client(name=name, phone=phone, email=email)
        session.add(new_client)
        session.commit()
        session.refresh(new_client)
        return new_client

    @staticmethod
    def get_client(session: Session, client_id: str) -> Optional[Client]:
        """Fetches a client by their UUID."""
        return session.get(Client, client_id)

    @staticmethod
    def list_clients(session: Session, limit: int = 50) -> List[Client]:
        """Lists clients ordered by creation date."""
        statement = select(Client).order_by(Client.created_at.desc()).limit(limit)
        return list(session.exec(statement).all())

    @staticmethod
    def update_risk_score(session: Session, client_id: str, risk_score: float) -> Optional[Client]:
        """Updates a client's risk score."""
        client = session.get(Client, client_id)
        if client:
            client.risk_score = risk_score
            session.add(client)
            session.commit()
            session.refresh(client)
        return client
