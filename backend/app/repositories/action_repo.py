import json
from typing import Any, Dict, List, Optional

from sqlmodel import Session, select

from app.models.agent_action import AgentAction


class ActionRepository:
    @staticmethod
    def log_action(
        session: Session,
        action_type: str,
        details: Dict[str, Any],
        bond_id: Optional[str] = None
    ) -> AgentAction:
        """Records an explainable AI action log in the database."""
        action = AgentAction(
            bond_id=bond_id,
            action_type=action_type,
            details=json.dumps(details, ensure_ascii=False),
        )
        session.add(action)
        session.commit()
        session.refresh(action)
        return action

    @staticmethod
    def list_actions(session: Session, limit: int = 50) -> List[AgentAction]:
        """Lists recent agent actions ordered by execution timestamp."""
        statement = select(AgentAction).order_by(AgentAction.executed_at.desc()).limit(limit)
        return list(session.exec(statement).all())
