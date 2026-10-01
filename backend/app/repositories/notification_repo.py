from typing import List, Optional

from sqlmodel import Session, func, select

from app.models.notification import Notification


class NotificationRepository:
    @staticmethod
    def create_notification(
        session: Session,
        recipient_name: str,
        title: str,
        message_body: str,
        bond_id: Optional[str] = None,
        channel: str = "simulated_whatsapp",
        urgency: str = "friendly"
    ) -> Notification:
        """Creates an in-app or simulated notification record."""
        notification = Notification(
            bond_id=bond_id,
            recipient_name=recipient_name,
            channel=channel,
            urgency=urgency,
            title=title,
            message_body=message_body,
        )
        session.add(notification)
        session.commit()
        session.refresh(notification)
        return notification

    @staticmethod
    def list_notifications(
        session: Session,
        limit: int = 20,
        unread_only: bool = False
    ) -> List[Notification]:
        """Lists notifications ordered by newest first."""
        statement = select(Notification)
        if unread_only:
            statement = statement.where(Notification.is_read == False)  # noqa: E712
        statement = statement.order_by(Notification.created_at.desc()).limit(limit)
        return list(session.exec(statement).all())

    @staticmethod
    def mark_as_read(session: Session, notification_id: str) -> Optional[Notification]:
        """Marks a notification as read."""
        notification = session.get(Notification, notification_id)
        if notification:
            notification.is_read = True
            session.add(notification)
            session.commit()
            session.refresh(notification)
        return notification

    @staticmethod
    def count_unread(session: Session) -> int:
        """Returns the number of unread notifications."""
        statement = select(func.count(Notification.id)).where(Notification.is_read == False)  # noqa: E712
        result = session.exec(statement).first()
        return result or 0
