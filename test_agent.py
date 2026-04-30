from dotenv import load_dotenv
import os

# Ensure environment variables are loaded
load_dotenv()

from agent.agent import run_daily_agent

print("========================================")
print("🤖 بدء اختبار الـ AI Agent (باستخدام Gemini)...")
print("========================================")

try:
    result = run_daily_agent()
    print("\n✅ اكتملت دورة الوكيل الذكي بنجاح!")
    print("النتائج:")
    import json
    # Print the report from the state if available
    for msg in result.get("messages", []):
        if hasattr(msg, "content") and "تاريخ_التقرير" in msg.content:
            print("\nالتقرير النهائي الذي ولده الوكيل:")
            print(msg.content)
except Exception as e:
    print(f"\n❌ حدث خطأ أثناء التشغيل: {e}")
