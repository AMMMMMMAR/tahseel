import logging
from datetime import datetime, timezone
from typing import Any, Dict

from sqlmodel import Session

from app.models.policy import CollectionPolicy

logger = logging.getLogger(__name__)

DEFAULT_POLICY_ID = "default_policy"


class PolicyRepository:
    @staticmethod
    def get_policy(session: Session) -> CollectionPolicy:
        """
        Retrieves the company's active collection policy.
        Automatically seeds the default policy if not present in SQLite.
        """
        policy = session.get(CollectionPolicy, DEFAULT_POLICY_ID)
        if not policy:
            policy = CollectionPolicy(
                id=DEFAULT_POLICY_ID,
                company_name="شركة الأمل للتجارة",
                friendly_reminder_days=7,
                official_followup_days=15,
                legal_warning_days=30,
                enable_installment_plans=True,
                default_installments_count=3,
                allow_auto_legal_notice=True,
                communication_tone="balanced",
                custom_prompt_notes="",
            )
            session.add(policy)
            session.commit()
            session.refresh(policy)
            logger.info("Initialized default CollectionPolicy in database.")
        return policy

    @staticmethod
    def update_policy(session: Session, updates: Dict[str, Any]) -> CollectionPolicy:
        """
        Updates collection policy rules and returns the persisted model.
        """
        policy = PolicyRepository.get_policy(session)

        allowed_fields = [
            "company_name",
            "friendly_reminder_days",
            "official_followup_days",
            "legal_warning_days",
            "enable_installment_plans",
            "default_installments_count",
            "allow_auto_legal_notice",
            "communication_tone",
            "custom_prompt_notes",
        ]

        for field in allowed_fields:
            if field in updates and updates[field] is not None:
                setattr(policy, field, updates[field])

        policy.updated_at = datetime.now(timezone.utc)
        session.add(policy)
        session.commit()
        session.refresh(policy)
        return policy

    @staticmethod
    def reset_policy(session: Session) -> CollectionPolicy:
        """Resets the policy back to factory default values."""
        policy = PolicyRepository.get_policy(session)
        policy.company_name = "شركة الأمل للتجارة"
        policy.friendly_reminder_days = 7
        policy.official_followup_days = 15
        policy.legal_warning_days = 30
        policy.enable_installment_plans = True
        policy.default_installments_count = 3
        policy.allow_auto_legal_notice = True
        policy.communication_tone = "balanced"
        policy.custom_prompt_notes = ""
        policy.updated_at = datetime.now(timezone.utc)

        session.add(policy)
        session.commit()
        session.refresh(policy)
        return policy
