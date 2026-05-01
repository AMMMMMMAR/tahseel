from fastapi import APIRouter, HTTPException
import sys, os, traceback

# Ensure root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from agent.agent import run_daily_agent

router = APIRouter(prefix="/api/agent", tags=["agent"])

@router.post("/run", summary="تشغيل الوكيل الذكي يدوياً")
async def trigger_agent():
    """
    Manually triggers the LangGraph AI Agent to run the daily collection cycle.
    Returns the generated report and number of reminders sent.
    """
    try:
        result = run_daily_agent()
        report = {}
        # Extract the report from the agent messages if available
        for msg in result.get("messages", []):
            if hasattr(msg, "content") and "تاريخ_التقرير" in msg.content:
                try:
                    import json
                    report = json.loads(msg.content)
                except:
                    pass
                    
        return {
            "success": True,
            "reminders_sent": result.get("reminders_sent", 0),
            "report": report,
            "message": "تم تشغيل الوكيل الذكي واكتملت الدورة بنجاح"
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs", summary="جلب سجل نشاطات الوكيل الذكي")
async def get_agent_logs(limit: int = 50):
    """
    Fetches the history of actions taken by the AI Agent (e.g., sent reminders).
    Joins with bonds and clients to show full context.
    """
    from database import supabase
    try:
        # Fetch actions and join with bonds to get the bond details, and nested clients for client names
        result = supabase.table("agent_actions") \
            .select("*, bonds(bond_number, amount, clients(name))") \
            .order("executed_at", desc=True) \
            .limit(limit) \
            .execute()
        
        return {"success": True, "logs": result.data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
