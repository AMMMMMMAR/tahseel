import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.db import get_session
from app.models.client import Client
from app.models.policy import CollectionPolicy
from app.repositories.policy_repo import PolicyRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/policy", tags=["policy"])


class PolicyUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    friendly_reminder_days: Optional[int] = Field(None, ge=1, le=90)
    official_followup_days: Optional[int] = Field(None, ge=1, le=120)
    legal_warning_days: Optional[int] = Field(None, ge=1, le=365)
    enable_installment_plans: Optional[bool] = None
    default_installments_count: Optional[int] = Field(None, ge=2, le=12)
    allow_auto_legal_notice: Optional[bool] = None
    communication_tone: Optional[str] = Field(None, pattern="^(balanced|friendly|firm)$")
    custom_prompt_notes: Optional[str] = None


class ClientPolicyUpdateRequest(BaseModel):
    policy_tier: Optional[str] = Field("standard", pattern="^(standard|vip|strict)$")
    custom_grace_days: Optional[int] = Field(default=0, ge=0, le=180)
    preferred_installments: Optional[int] = Field(None, ge=1, le=24)
    max_escalation_level: Optional[int] = Field(None, ge=1, le=4)
    custom_notes: Optional[str] = None


@router.get("", summary="جلب سياسات التحصيل المعتمدة للشركة")
def get_policy(session: Session = Depends(get_session)) -> CollectionPolicy:
    """Returns the company's active collection policy."""
    try:
        return PolicyRepository.get_policy(session)
    except Exception as e:
        logger.error(f"Error fetching policy: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("", summary="تحديث سياسات وقواعد التحصيل")
def update_policy(
    payload: PolicyUpdateRequest,
    session: Session = Depends(get_session)
) -> CollectionPolicy:
    """Updates collection policy rules and thresholds."""
    try:
        updates = payload.model_dump(exclude_unset=True)
        return PolicyRepository.update_policy(session, updates)
    except Exception as e:
        logger.error(f"Error updating policy: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset", summary="استعادة سياسة التحصيل الافتراضية")
def reset_policy(session: Session = Depends(get_session)) -> CollectionPolicy:
    """Resets collection policy to factory defaults."""
    try:
        return PolicyRepository.reset_policy(session)
    except Exception as e:
        logger.error(f"Error resetting policy: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/clients/{client_id}", summary="تخصيص سياسة وشروط العميل الفردي")
def update_client_policy(
    client_id: str,
    payload: ClientPolicyUpdateRequest,
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """Sets custom terms (VIP, installments, grace days, max level) for a specific client."""
    client = session.exec(select(Client).where((Client.id == client_id) | (Client.name == client_id))).first()
    if not client:
        raise HTTPException(status_code=404, detail="العميل غير موجود")

    client.policy_tier = payload.policy_tier
    client.custom_grace_days = payload.custom_grace_days
    client.preferred_installments = payload.preferred_installments
    client.max_escalation_level = payload.max_escalation_level
    if payload.custom_notes is not None:
        client.custom_notes = payload.custom_notes

    session.add(client)
    session.commit()
    session.refresh(client)

    return {
        "success": True,
        "client_id": client.id,
        "name": client.name,
        "policy_tier": client.policy_tier,
        "custom_grace_days": client.custom_grace_days,
        "preferred_installments": client.preferred_installments,
        "max_escalation_level": client.max_escalation_level,
        "custom_notes": client.custom_notes,
        "message": f"تم تحديث شروط اتفاقية العميل {client.name} بنجاح.",
    }
