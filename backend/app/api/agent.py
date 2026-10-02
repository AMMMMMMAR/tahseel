import json
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.agent.agent import run_daily_cycle
from app.core.db import get_session
from app.models.bond import Bond
from app.models.client import Client
from app.repositories.action_repo import ActionRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/run", summary="تشغيل الوكيل الذكي يدوياً")
async def trigger_agent() -> Dict[str, Any]:
    """
    Manually triggers the autonomous LangGraph Collection Agent.
    Emits real-time progress events over WebSocket at `/ws/agent`
    and returns final execution state and portfolio report.
    """
    try:
        result = run_daily_cycle()
        if result.get("error"):
            raise HTTPException(status_code=500, detail=result["error"])

        return {
            "success": True,
            "session_id": result.get("session_id"),
            "reminders_sent": len(result.get("actions_dispatched", [])),
            "report": result.get("report", {}),
            "logs": result.get("logs", []),
            "message": "تم تشغيل الوكيل الذكي واكتملت الدورة بنجاح",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing agent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs", summary="جلب سجل نشاطات الوكيل الذكي")
def get_agent_logs(
    limit: int = 50,
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Fetches the history of actions taken by the AI Agent from SQLite.
    Includes details, debtor names, and bond numbers.
    """
    try:
        actions = ActionRepository.list_actions(session=session, limit=limit)
        formatted_logs: List[Dict[str, Any]] = []

        for action in actions:
            # Parse JSON details safely
            details_dict = {}
            if action.details:
                try:
                    details_dict = json.loads(action.details) if isinstance(action.details, str) else action.details
                except Exception:
                    details_dict = {"raw": action.details}

            bond_number = None
            client_name = None

            if action.bond_id:
                bond = session.get(Bond, action.bond_id)
                if bond:
                    bond_number = bond.bond_number
                    if bond.client_id:
                        client = session.get(Client, bond.client_id)
                        if client:
                            client_name = client.name

            formatted_logs.append({
                "id": action.id,
                "action_type": action.action_type,
                "bond_id": action.bond_id,
                "bond_number": bond_number,
                "client_name": client_name,
                "details": details_dict,
                "executed_at": action.executed_at.isoformat() if action.executed_at else None,
            })

        return {"success": True, "logs": formatted_logs}
    except Exception as e:
        logger.error(f"Error fetching agent logs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
