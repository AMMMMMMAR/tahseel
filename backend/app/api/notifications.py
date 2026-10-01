from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session

from app.core.db import get_session
from app.repositories.notification_repo import NotificationRepository

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NotificationCreateRequest(BaseModel):
    recipient_name: str
    title: str
    message_body: str
    bond_id: Optional[str] = None
    channel: str = "simulated_whatsapp"
    urgency: str = "friendly"


@router.get("", summary="جلب الإشعارات الأخيرة")
def get_notifications(
    limit: int = 20,
    unread_only: bool = False,
    session: Session = Depends(get_session)
):
    """Returns recent in-app notifications and the count of unread items."""
    items = NotificationRepository.list_notifications(session, limit=limit, unread_only=unread_only)
    unread_count = NotificationRepository.count_unread(session)
    return {
        "notifications": [item.model_dump() for item in items],
        "unread_count": unread_count,
        "count": len(items),
    }


@router.patch("/{notification_id}/read", summary="تحديد إشعار كمقروء")
def mark_read(
    notification_id: str,
    session: Session = Depends(get_session)
):
    """Marks a single notification as read."""
    updated = NotificationRepository.mark_as_read(session, notification_id)
    if not updated:
        raise HTTPException(status_code=404, detail="الإشعار غير موجود")
    return {"success": True, "notification": updated.model_dump()}


@router.post("", summary="إرسال إشعار جديد")
def create_notification(
    data: NotificationCreateRequest,
    session: Session = Depends(get_session)
):
    """Creates a new in-app notification record."""
    item = NotificationRepository.create_notification(
        session=session,
        recipient_name=data.recipient_name,
        title=data.title,
        message_body=data.message_body,
        bond_id=data.bond_id,
        channel=data.channel,
        urgency=data.urgency,
    )
    return {"success": True, "notification": item.model_dump()}
