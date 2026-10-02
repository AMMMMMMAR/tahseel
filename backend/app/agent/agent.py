import asyncio
import logging
import uuid
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, StateGraph

from app.agent.tools import (
    analyze_and_update_risks_sync,
    generate_daily_report_sync,
    get_high_risk_bonds_sync,
    send_smart_reminder_sync,
)
from app.core.db import get_db_session
from app.core.websocket_manager import ws_manager

logger = logging.getLogger(__name__)


# ── Broadcast Helper for Real-Time UI Streaming ──────────────────────────────

def emit_agent_event(event_type: str, payload: Dict[str, Any]):
    """Safely dispatches WebSocket events across async and sync contexts."""
    try:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            asyncio.create_task(ws_manager.broadcast(event_type, payload))
        else:
            asyncio.run(ws_manager.broadcast(event_type, payload))
    except Exception as e:
        logger.debug(f"WebSocket broadcast skipped or unavailable: {e}")


# ── Agent State ──────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    session_id: str
    current_step: str
    bonds_evaluated: int
    high_risk_bonds: List[Dict[str, Any]]
    actions_dispatched: List[Dict[str, Any]]
    report: Dict[str, Any]
    logs: List[str]
    error: Optional[str]


# ── StateGraph Nodes ──────────────────────────────────────────────────────────

def assess_risks_node(state: AgentState) -> Dict[str, Any]:
    """Node 1: Evaluates portfolio delay risks, updates debt statuses and risk scores."""
    emit_agent_event("agent_step", {
        "step": "assess_risks",
        "title": "تقييم المخاطر",
        "description": "فحص السندات النشطة وحساب درجات التأخير والمخاطر...",
    })

    with get_db_session() as session:
        result = analyze_and_update_risks_sync(session)
        updated_count = result.get("updated_count", 0)

    log_entry = f"تم تقييم وتحديث درجات المخاطر لـ {updated_count} سند نشط."
    emit_agent_event("risk_evaluated", {
        "updated_count": updated_count,
        "message": log_entry,
    })

    return {
        "current_step": "assess_risks",
        "bonds_evaluated": updated_count,
        "logs": state.get("logs", []) + [log_entry],
    }


def select_strategies_node(state: AgentState) -> Dict[str, Any]:
    """Node 2: Filters bonds requiring intervention and maps them to 4-tier escalation levels."""
    emit_agent_event("agent_step", {
        "step": "select_strategies",
        "title": "تحديد استراتيجيات التحصيل",
        "description": "تصنيف المدينين وتطبيق سلم التصعيد المتدرج (1 إلى 4)...",
    })

    with get_db_session() as session:
        high_risk = get_high_risk_bonds_sync(session, threshold=60.0)

    log_entry = f"تم رصد {len(high_risk)} حالات مؤهلة للمتابعة والتصعيد."
    emit_agent_event("strategies_selected", {
        "candidates_count": len(high_risk),
        "candidates": high_risk,
    })

    return {
        "current_step": "select_strategies",
        "high_risk_bonds": high_risk,
        "logs": state.get("logs", []) + [log_entry],
    }


def draft_and_dispatch_node(state: AgentState) -> Dict[str, Any]:
    """Node 3: Composes contextual Arabic notifications and dispatches them via channels."""
    emit_agent_event("agent_step", {
        "step": "draft_and_dispatch",
        "title": "صياغة وإرسال التنبيهات",
        "description": "توليد الرسائل المخصصة وتسجيل الإشعارات في النظام...",
    })

    high_risk = state.get("high_risk_bonds", [])
    dispatched = []

    with get_db_session() as session:
        for item in high_risk:
            res = send_smart_reminder_sync(
                session=session,
                bond_id=item["bond_id"],
                client_name=item["client_name"],
                client_email=item.get("client_email", ""),
                amount=item["amount"],
                days_overdue=item["days_overdue"],
                description=item.get("description", ""),
                bond_number=item.get("bond_number", ""),
                risk_score=item.get("risk_score", 50.0),
            )
            dispatched.append(res)
            emit_agent_event("notification_dispatched", {
                "recipient": item["client_name"],
                "bond_number": item.get("bond_number", ""),
                "amount": item["amount"],
                "level": res.get("level"),
                "label": res.get("label"),
                "simulation": res.get("simulation", True),
            })

    log_entry = f"تم إرسال وجدولة {len(dispatched)} تنبيهات تحصيل مخصصة."
    return {
        "current_step": "draft_and_dispatch",
        "actions_dispatched": dispatched,
        "logs": state.get("logs", []) + [log_entry],
    }


def generate_report_node(state: AgentState) -> Dict[str, Any]:
    """Node 4: Compiles aggregate portfolio health report and saves executive log."""
    emit_agent_event("agent_step", {
        "step": "generate_report",
        "title": "إعداد التقرير اليومي",
        "description": "تجميع المؤشرات المالية ومعدلات التحصيل للإدارة...",
    })

    with get_db_session() as session:
        report = generate_daily_report_sync(session)

    log_entry = "تم إعداد التقرير الإداري اليومي بنجاح."
    emit_agent_event("agent_finished", {
        "report": report,
        "total_dispatched": len(state.get("actions_dispatched", [])),
        "message": "اكتملت دورة التحصيل الذاتية بنجاح.",
    })

    return {
        "current_step": "generate_report",
        "report": report,
        "logs": state.get("logs", []) + [log_entry],
    }


# ── Graph Builder ─────────────────────────────────────────────────────────────

def build_collection_graph():
    """Builds and compiles the 4-stage LangGraph workflow for autonomous debt collection."""
    graph = StateGraph(AgentState)

    graph.add_node("assess_risks", assess_risks_node)
    graph.add_node("select_strategies", select_strategies_node)
    graph.add_node("draft_and_dispatch", draft_and_dispatch_node)
    graph.add_node("generate_report", generate_report_node)

    graph.set_entry_point("assess_risks")

    graph.add_edge("assess_risks", "select_strategies")
    graph.add_edge("select_strategies", "draft_and_dispatch")
    graph.add_edge("draft_and_dispatch", "generate_report")
    graph.add_edge("generate_report", END)

    return graph.compile()


# ── Execution Entrypoint ──────────────────────────────────────────────────────

def run_daily_cycle(session_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes the autonomous collection cycle through LangGraph.
    Emits real-time WebSocket events and supports LangSmith tracing.
    """
    sid = session_id or str(uuid.uuid4())
    emit_agent_event("agent_start", {
        "session_id": sid,
        "message": "بدء دورة التحصيل اليومية للوكيل الذكي...",
    })

    app_graph = build_collection_graph()

    initial_state: AgentState = {
        "session_id": sid,
        "current_step": "start",
        "bonds_evaluated": 0,
        "high_risk_bonds": [],
        "actions_dispatched": [],
        "report": {},
        "logs": ["بدء تشغيل دورة التحصيل."],
        "error": None,
    }

    config = {
        "run_name": "tahseel_daily_collection_cycle",
        "tags": ["production", "collection_agent", "tahseel"],
        "metadata": {"session_id": sid},
    }

    try:
        final_state = app_graph.invoke(initial_state, config=config)
        return final_state
    except Exception as e:
        logger.error(f"Collection cycle failed: {e}", exc_info=True)
        emit_agent_event("agent_error", {"error": str(e)})
        initial_state["error"] = str(e)
        return initial_state


def run_daily_agent() -> Dict[str, Any]:
    """Backward compatibility wrapper returning standard summary dict."""
    state = run_daily_cycle()
    return {
        "success": state.get("error") is None,
        "reminders_sent": len(state.get("actions_dispatched", [])),
        "report": state.get("report", {}),
        "logs": state.get("logs", []),
        "error": state.get("error"),
    }
