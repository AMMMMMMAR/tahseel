# cron_job.py
# Runs the AI Agent daily at 08:00 — deploy on Railway or Render

import schedule
import time
from dotenv import load_dotenv

load_dotenv()

from agent.agent import run_daily_agent


def job():
    print("[Cron] تشغيل الـ Agent اليومي...")
    try:
        run_daily_agent()
        print("[Cron] اكتملت الدورة بنجاح")
    except Exception as e:
        print(f"[Cron] خطأ: {e}")


# Run every day at 08:00
schedule.every().day.at("08:00").do(job)

print("[Cron] المجدوِل يعمل — ينتظر الساعة 08:00 كل يوم")

while True:
    schedule.run_pending()
    time.sleep(60)