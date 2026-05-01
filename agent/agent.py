# agent/agent.py
# Main LangGraph Agent — runs the full daily collection cycle

from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from typing import TypedDict, Annotated
from datetime import date
import operator
import os

from agent.tools import (
    analyze_and_update_risks,
    get_high_risk_bonds,
    send_smart_reminder,
    generate_daily_report
)


# ── Agent State — what the agent remembers between steps ────────────────────

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    high_risk_bonds: list
    reminders_sent: int
    report: dict
    step: str


# ── LLM — Gemini 2.5 Flash with all tools bound ───────────────────────────────

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    api_key=os.getenv("GEMINI_API_KEY", ""),
    temperature=0
).bind_tools([
    analyze_and_update_risks,
    get_high_risk_bonds,
    send_smart_reminder,
    generate_daily_report
])

SYSTEM_PROMPT = """
أنت وكيل ذكي متخصص في إدارة وتحصيل الديون.
مهمتك اليومية تتم بالترتيب الآتي:
1. تحليل وتحديث درجات المخاطر لكل السندات
2. تحديد السندات عالية الخطر (أكثر من 70%)
3. إرسال تذكيرات مخصصة لكل حالة خطر
4. توليد التقرير اليومي للإدارة

تصرّف بشكل منهجي وأنجز كل مرحلة قبل الانتقال للتالية.
"""


# ── Graph Nodes ───────────────────────────────────────────────────────────────

def run_agent_step(state: AgentState) -> AgentState:
    """Agent thinking step — decides what tool to call next."""
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm.invoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    """Determines if agent is done or has more tools to run."""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END


def execute_tools(state: AgentState) -> AgentState:
    """Executes the tools requested by the agent."""
    from langchain_core.messages import ToolMessage

    tool_map = {
        "analyze_and_update_risks": analyze_and_update_risks,
        "get_high_risk_bonds": get_high_risk_bonds,
        "send_smart_reminder": send_smart_reminder,
        "generate_daily_report": generate_daily_report,
    }

    last_message = state["messages"][-1]
    tool_results = []
    reminders_delta = 0

    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        result = tool_map[tool_name].invoke(tool_args)

        # Count only reminders that were actually delivered through Resend.
        # `send_smart_reminder` returns a string starting with "تم إرسال التذكير"
        # on real success, with separate prefixes for simulation, validation
        # failures, and Resend errors.
        if tool_name == "send_smart_reminder" and isinstance(result, str) \
                and result.startswith("تم إرسال التذكير"):
            reminders_delta += 1

        tool_results.append(
            ToolMessage(content=str(result), tool_call_id=tool_call["id"])
        )

    update: dict = {"messages": tool_results}
    if reminders_delta:
        update["reminders_sent"] = state.get("reminders_sent", 0) + reminders_delta
    return update


# ── Graph Builder ──────────────────────────────────────────────────────────────

def build_agent():
    graph = StateGraph(AgentState)

    graph.add_node("agent", run_agent_step)
    graph.add_node("tools", execute_tools)

    graph.set_entry_point("agent")

    graph.add_conditional_edges("agent", should_continue)
    graph.add_edge("tools", "agent")

    return graph.compile()


def run_daily_agent() -> dict:
    """
    Main entry point — called by the cron job every day at 08:00.
    Runs the full agent loop until all tasks are complete.
    """
    agent = build_agent()

    initial_state = {
        "messages": [HumanMessage(
            content=(
                "ابدأ الدورة اليومية: حلّل المخاطر، حدّد الحالات الحرجة، "
                "أرسل التذكيرات، ثم ولّد التقرير اليومي."
            )
        )],
        "high_risk_bonds": [],
        "reminders_sent": 0,
        "report": {},
        "step": "start"
    }

    print(f"[Agent] بدء الدورة اليومية — {date.today()}")
    result = agent.invoke(initial_state)
    print(f"[Agent] انتهت الدورة — أُرسلت {result.get('reminders_sent', 0)} تذكيرات")
    return result
