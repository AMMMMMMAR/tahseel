# streamlit_app.py
# Tahseel — Testing Dashboard (Arabic RTL UI)

import streamlit as st
import json
import os
import tempfile
from datetime import date, datetime
from dotenv import load_dotenv

load_dotenv()

# ── Page Config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Tahseel — منصة التحصيل الذكي",
    layout="wide",
    page_icon="📄",
    initial_sidebar_state="expanded"
)

# ── CSS — Dark Theme matching the screenshot ──────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Cairo', sans-serif !important;
    direction: rtl;
    background-color: #0f0f0f;
    color: #e0e0e0;
}

/* Sidebar */
[data-testid="stSidebar"] {
    background-color: #1a1a1a !important;
    border-right: 1px solid #2a2a2a;
}
[data-testid="stSidebar"] * { color: #ccc !important; }

/* Metric cards */
div[data-testid="metric-container"] {
    background: #1e1e1e;
    border: 1px solid #2e2e2e;
    border-radius: 12px;
    padding: 20px;
}
div[data-testid="metric-container"] label { color: #888 !important; font-size: 13px; }
div[data-testid="metric-container"] [data-testid="stMetricValue"] {
    font-size: 28px !important;
    font-weight: 700;
}

/* Dataframe */
[data-testid="stDataFrame"] { border-radius: 10px; overflow: hidden; }

/* Buttons */
.stButton > button {
    background: #2563eb;
    color: white;
    border-radius: 8px;
    border: none;
    padding: 8px 20px;
    font-family: 'Cairo', sans-serif;
    font-weight: 600;
    width: 100%;
}
.stButton > button:hover { background: #1d4ed8; }

/* Tabs */
[data-baseweb="tab"] { font-family: 'Cairo', sans-serif !important; }

/* Section headers */
.section-title {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #2e2e2e;
}

/* Alert boxes */
.alert-box {
    background: #1e1e1e;
    border: 1px solid #2e2e2e;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 8px;
    font-size: 14px;
    color: #ddd;
}

/* Risk bar container */
.risk-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
    direction: rtl;
}

/* Status badge */
.badge-overdue   { background:#7f1d1d; color:#fca5a5; padding:2px 10px; border-radius:20px; font-size:12px; }
.badge-reminded  { background:#78350f; color:#fcd34d; padding:2px 10px; border-radius:20px; font-size:12px; }
.badge-pending   { background:#1e3a5f; color:#93c5fd; padding:2px 10px; border-radius:20px; font-size:12px; }
.badge-settled   { background:#14532d; color:#86efac; padding:2px 10px; border-radius:20px; font-size:12px; }
</style>
""", unsafe_allow_html=True)


# ── Supabase helper ───────────────────────────────────────────────────────────
def get_supabase():
    """Returns the supabase proxy — always live, never cached."""
    try:
        from database import supabase
        return supabase
    except Exception as e:
        st.error(f"خطأ في الاتصال ب Supabase: {e}")
        return None


def safe_query(fn):
    """Wraps Supabase queries — shows a clear error instead of crashing."""
    try:
        result = fn()
        return result.data or []
    except Exception as e:
        st.warning(f"خطأ في قاعدة البيانات: {e}")
        return []


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style='padding: 20px 0 10px 0;'>
        <div style='font-size:22px; font-weight:700; color:#fff;'>Tahseel</div>
        <div style='font-size:13px; color:#888;'>منصة التحصيل الذكي</div>
    </div>
    <hr style='border-color:#2e2e2e; margin:10px 0 20px 0;'>
    """, unsafe_allow_html=True)

    page = st.radio(
        "",
        ["لوحة التحكم", "رفع السندات", "العملاء", "الفواتير", "AI Agent", "التقارير"],
        label_visibility="collapsed"
    )

    st.markdown("<br>" * 8, unsafe_allow_html=True)
    company = os.getenv("COMPANY_NAME", "")
    st.markdown(f"<div style='color:#555; font-size:12px; text-align:center;'>{company}</div>",
                unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE 1 — DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════
if page == "لوحة التحكم":
    db = get_supabase()

    st.markdown("<h2 style='color:#fff; margin-bottom:4px;'>لوحة التحكم</h2>", unsafe_allow_html=True)
    now_str = datetime.now().strftime("%H:%M — %Y/%m/%d")
    st.markdown(f"<div style='color:#666; font-size:13px; margin-bottom:20px;'>آخر تحديث: {now_str}</div>",
                unsafe_allow_html=True)

    # ── KPI Cards ─────────────────────────────────────────────────────────────
    bonds_data = safe_query(lambda: db.table("bonds")
                            .select("amount, status, days_overdue, client_id").execute()) if db else []
    clients_data = safe_query(lambda: db.table("clients").select("id, risk_score").execute()) if db else []

    total_amount = sum(b["amount"] for b in bonds_data) if bonds_data else 284500
    overdue_amount = sum(b["amount"] for b in bonds_data if b.get("status") == "overdue") if bonds_data else 89200
    settled_month = 142300   # placeholder
    avg_days = 38            # placeholder

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("إجمالي الديون (ر.س)", f"{total_amount:,.0f}",
                  delta=f"{len(bonds_data) or 17} عميل")
    with col2:
        st.metric("متأخرة السداد", f"{overdue_amount:,.0f}",
                  delta=f"{len([b for b in bonds_data if b.get('status')=='overdue']) or 5} عملاء",
                  delta_color="inverse")
    with col3:
        st.metric("محصّلة هذا الشهر", f"{settled_month:,.0f}",
                  delta="+12% عن الشهر الماضي")
    with col4:
        st.metric("متوسط أيام التحصيل", f"{avg_days}",
                  delta="كان 61 يوم", delta_color="normal")

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Bottom two columns ────────────────────────────────────────────────────
    left_col, right_col = st.columns([1.1, 1])

    # Risk Bars
    with left_col:
        st.markdown("<div class='section-title'>AI توقع لمخاطر التأخير</div>", unsafe_allow_html=True)

        if bonds_data and clients_data:
            high_risk = [(c["risk_score"], f"عميل {i+1}")
                         for i, c in enumerate(clients_data) if c.get("risk_score", 0) > 0]
            high_risk = sorted(high_risk, reverse=True)[:5]
        else:
            high_risk = []

        if high_risk:
            for score, name in high_risk:
                color = "#ef4444" if score >= 70 else "#f97316" if score >= 40 else "#22c55e"
                st.markdown(f"""
                <div class='risk-row'>
                    <span style='width:120px; font-size:13px; color:#ccc; text-align:right;'>{name}</span>
                    <div style='flex:1; background:#2a2a2a; border-radius:6px; height:14px; overflow:hidden;'>
                        <div style='width:{score}%; background:{color}; height:100%; border-radius:6px;'></div>
                    </div>
                    <span style='width:40px; font-size:13px; font-weight:700; color:{color};'>{score:.0f}%</span>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style='color:#555; font-size:13px; padding:20px 0; text-align:center;'>
                — لا توجد درجات خطر بعد — شغّل الـ Agent أولاً
            </div>
            """, unsafe_allow_html=True)

    # Agent Alerts
    with right_col:
        st.markdown("<div class='section-title'>تنبيهات AI Agent — اليوم</div>", unsafe_allow_html=True)

        actions = safe_query(lambda: db.table("agent_actions")
                             .select("action_type, details, executed_at")
                             .order("executed_at", desc=True).limit(5).execute()) if db else []

        if actions:
            for a in actions:
                details = a.get("details", {})
                msg = f"تم إرسال تذكير إلى {details.get('to', '')} — تأخير {details.get('days_overdue', 0)} يوم"
                st.markdown(f"<div class='alert-box'>— {msg}</div>", unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style='color:#555; font-size:13px; padding:20px 0; text-align:center;'>
                — لا توجد تنبيهات بعد — شغّل الـ Agent لتظهر النتائج هنا
            </div>
            """, unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Bonds Table preview ───────────────────────────────────────────────────
    st.markdown("""
    <div style='display:flex; justify-content:space-between; align-items:center;'>
        <div class='section-title' style='margin:0;'>العملاء — حالة السداد</div>
        <a href='#' style='color:#3b82f6; font-size:13px;'>عرض الكل</a>
    </div><br>
    """, unsafe_allow_html=True)

    if bonds_data:
        import pandas as pd
        df = pd.DataFrame(bonds_data)[["client_id", "amount", "status", "days_overdue"]]
        df.columns = ["معرف العميل", "المبلغ (ر.س)", "الحالة", "أيام التأخير"]
        st.dataframe(df, use_container_width=True, hide_index=True)
    else:
        st.markdown("""
        <div style='color:#555; font-size:13px; padding:20px 0; text-align:center;'>
            — لا توجد بيانات بعد — ارفع سنداً من تبويب "رفع السندات"
        </div>
        """, unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE 2 — UPLOAD BONDS
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "رفع السندات":
    st.markdown("<h2 style='color:#fff;'>رفع السندات</h2>", unsafe_allow_html=True)
    st.markdown("<div style='color:#888; margin-bottom:20px;'>ارفع صورة السند — سيتم استخراج البيانات تلقائياً بالذكاء الاصطناعي</div>",
                unsafe_allow_html=True)

    col_upload, col_result = st.columns([1, 1])

    with col_upload:
        uploaded = st.file_uploader("اختر صورة السند (JPG / PNG)", type=["jpg", "jpeg", "png"])

        if uploaded:
            st.image(uploaded, caption="صورة السند المرفوعة", width=400)

            if st.button("🔍 استخراج البيانات"):
                image_bytes = uploaded.read()
                with st.spinner("جاري التحليل..."):
                    try:
                        from ocr.ocr_model import extract_bond_from_bytes
                        result = extract_bond_from_bytes(image_bytes)
                        st.session_state["ocr_result"] = result
                        st.success("✅ تم استخراج البيانات بنجاح")
                    except Exception as e:
                        st.error(f"خطأ في OCR: {e}")
                        st.session_state["ocr_result"] = None

    with col_result:
        if "ocr_result" in st.session_state and st.session_state["ocr_result"]:
            r = st.session_state["ocr_result"]
            st.markdown("<div class='section-title'>البيانات المستخرجة</div>", unsafe_allow_html=True)

            r["رقم_السند"] = st.text_input("رقم السند", value=r.get("رقم_السند", ""))
            r["اسم_العميل"] = st.text_input("اسم العميل", value=r.get("اسم_العميل", ""))
            r["تاريخ_الاصدار"] = st.text_input("تاريخ الإصدار", value=r.get("تاريخ_الاصدار", ""))
            r["المبلغ"] = st.text_input("المبلغ", value=r.get("المبلغ", ""))
            r["رقم_الهاتف"] = st.text_input("رقم الهاتف", value=r.get("رقم_الهاتف", ""))
            r["ايميل_العميل"] = st.text_input("البريد الإلكتروني", value=r.get("ايميل_العميل", ""))
            r["وصف_سبب_الصرف"] = st.text_area("الوصف", value=r.get("وصف_سبب_الصرف", ""))

            if st.button("💾 حفظ السند في قاعدة البيانات"):
                supabase_url = os.getenv("SUPABASE_URL", "")
                if not supabase_url or "xxxx" in supabase_url:
                    st.warning("⚠️ أضف SUPABASE_URL و SUPABASE_KEY في ملف .env أولاً لحفظ البيانات.")
                else:
                    try:
                        from database import save_bond_from_ocr
                        saved = save_bond_from_ocr(r)
                        st.success(f"✅ تم الحفظ — رقم السند: {saved['id'][:8]}...")
                        st.session_state["ocr_result"] = None
                    except Exception as e:
                        st.error(f"خطأ في الحفظ: {e}")
        else:
            st.markdown("""
            <div style='background:#1e1e1e; border:1px dashed #3a3a3a; border-radius:12px;
                        padding:40px; text-align:center; color:#555; margin-top:40px;'>
                <div style='font-size:48px; margin-bottom:12px;'>📄</div>
                <div>ارفع صورة السند من اليسار لعرض البيانات المستخرجة هنا</div>
            </div>
            """, unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE 3 — CLIENTS
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "العملاء":
    st.markdown("<h2 style='color:#fff;'>العملاء</h2>", unsafe_allow_html=True)
    db = get_supabase()

    if db:
        clients = safe_query(lambda: db.table("clients")
                             .select("*").order("risk_score", desc=True).execute())
    else:
        clients = []

    if clients:
        import pandas as pd
        df = pd.DataFrame(clients)
        df = df[["name", "phone", "email", "risk_score", "avg_delay_days", "total_bonds", "created_at"]]
        df.columns = ["الاسم", "الهاتف", "البريد", "درجة الخطر", "متوسط التأخير", "عدد السندات", "تاريخ الإنشاء"]
        st.dataframe(df, use_container_width=True, hide_index=True)
    else:
        st.markdown("""
        <div style='background:#1e1e1e; border:1px solid #2e2e2e; border-radius:12px;
                    padding:40px; text-align:center; color:#555;'>
            <div style='font-size:48px;'>👥</div>
            <div style='margin-top:12px;'>لا يوجد عملاء بعد — ارفع سنداً لإضافة عميل تلقائياً</div>
        </div>
        """, unsafe_allow_html=True)


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE 4 — ALL BONDS
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "الفواتير":
    st.markdown("<h2 style='color:#fff;'>السندات والفواتير</h2>", unsafe_allow_html=True)
    db = get_supabase()

    status_filter = st.selectbox("تصفية حسب الحالة",
                                 ["الكل", "pending", "reminded", "overdue", "settled"])

    if db:
        if status_filter == "الكل":
            bonds = safe_query(lambda: db.table("bonds")
                               .select("*, clients(name)").order("created_at", desc=True).execute())
        else:
            bonds = safe_query(lambda: db.table("bonds")
                               .select("*, clients(name)").eq("status", status_filter)
                               .order("created_at", desc=True).execute())
    else:
        bonds = []

    if bonds:
        import pandas as pd
        rows = []
        for b in bonds:
            client_name = b.get("clients", {}).get("name", "—") if b.get("clients") else "—"
            rows.append({
                "العميل": client_name,
                "رقم السند": b.get("bond_number", ""),
                "النوع": b.get("bond_type", ""),
                "المبلغ": f"{b.get('amount', 0):,.0f}",
                "الحالة": b.get("status", ""),
                "أيام التأخير": b.get("days_overdue", 0),
                "تاريخ الإصدار": b.get("issue_date", ""),
            })
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)
        st.caption(f"إجمالي النتائج: {len(bonds)} سند")
    else:
        st.info("لا توجد سندات مطابقة للفلتر المحدد")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE 5 — AI AGENT
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "AI Agent":
    st.markdown("<h2 style='color:#fff;'>AI Agent — التشغيل اليدوي</h2>", unsafe_allow_html=True)
    st.markdown("<div style='color:#888; margin-bottom:20px;'>يُشغّل الدورة الكاملة: تحليل المخاطر + إرسال تذكيرات + تقرير يومي</div>",
                unsafe_allow_html=True)

    col_a, col_b = st.columns([1, 1])

    with col_a:
        st.markdown("<div class='section-title'>تشغيل الدورة الكاملة</div>", unsafe_allow_html=True)
        st.markdown("""
        <div style='background:#1e1e1e; border:1px solid #2e2e2e; border-radius:10px; padding:16px; margin-bottom:16px;'>
            <div style='color:#ccc; font-size:14px; line-height:2;'>
                ① تحليل وتحديث درجات المخاطر لكل السندات<br>
                ② تحديد السندات عالية الخطر (أكثر من 70%)<br>
                ③ إرسال تذكيرات مخصصة لكل حالة خطر<br>
                ④ توليد التقرير اليومي للإدارة
            </div>
        </div>
        """, unsafe_allow_html=True)

        if st.button("🤖 تشغيل الـ Agent الآن"):
            with st.spinner("الـ Agent يعمل... قد يستغرق دقيقة"):
                try:
                    from agent.agent import run_daily_agent
                    result = run_daily_agent()
                    st.success("✅ اكتملت الدورة بنجاح")
                    st.json(result)
                except Exception as e:
                    st.error(f"خطأ: {e}")

    with col_b:
        st.markdown("<div class='section-title'>تشغيل أداة واحدة فقط</div>", unsafe_allow_html=True)

        tool_choice = st.selectbox("اختر الأداة", [
            "analyze_and_update_risks — تحليل المخاطر",
            "get_high_risk_bonds — السندات عالية الخطر",
            "generate_daily_report — التقرير اليومي",
        ])

        if st.button("▶ تشغيل الأداة"):
            with st.spinner("جاري التنفيذ..."):
                try:
                    from agent.tools import (
                        analyze_and_update_risks,
                        get_high_risk_bonds,
                        generate_daily_report
                    )
                    if "analyze" in tool_choice:
                        out = analyze_and_update_risks.invoke({})
                    elif "high_risk" in tool_choice:
                        out = get_high_risk_bonds.invoke({})
                    else:
                        out = generate_daily_report.invoke({})

                    st.success("✅ اكتمل")
                    try:
                        st.json(json.loads(out))
                    except Exception:
                        st.text(out)
                except Exception as e:
                    st.error(f"خطأ: {e}")

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("<div class='section-title'>سجل تصرفات الـ Agent</div>", unsafe_allow_html=True)

    db = get_supabase()
    if db:
        actions = safe_query(lambda: db.table("agent_actions")
                             .select("*").order("executed_at", desc=True).limit(20).execute())
        if actions:
            import pandas as pd
            df = pd.DataFrame(actions)[["action_type", "details", "executed_at"]]
            df.columns = ["نوع التصرف", "التفاصيل", "وقت التنفيذ"]
            st.dataframe(df, use_container_width=True, hide_index=True)
        else:
            st.info("لا يوجد سجل بعد — شغّل الـ Agent أولاً")


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE 6 — REPORTS
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "التقارير":
    st.markdown("<h2 style='color:#fff;'>التقارير</h2>", unsafe_allow_html=True)
    db = get_supabase()

    if st.button("📊 توليد تقرير يومي الآن"):
        with st.spinner("جاري التوليد..."):
            try:
                from agent.tools import generate_daily_report
                report_json = generate_daily_report.invoke({})
                report = json.loads(report_json)

                st.markdown(f"<div class='section-title'>تقرير يوم {report.get('تاريخ_التقرير', date.today())}</div>",
                            unsafe_allow_html=True)

                c1, c2, c3 = st.columns(3)
                c1.metric("إجمالي الديون النشطة", report.get("إجمالي_الديون_النشطة", "—"))
                c2.metric("المتأخرات", report.get("المتأخرات", "—"))
                c3.metric("المحصّل هذا الشهر", report.get("المحصّل_هذا_الشهر", "—"))

                col1, col2 = st.columns(2)
                col1.metric("عدد السندات النشطة", report.get("عدد_السندات_النشطة", 0))
                col2.metric("عدد المتأخرة", report.get("عدد_المتأخرة", 0))

                st.markdown("<br>", unsafe_allow_html=True)
                st.download_button(
                    "⬇ تحميل التقرير JSON",
                    data=report_json,
                    file_name=f"report_{date.today()}.json",
                    mime="application/json"
                )
            except Exception as e:
                st.error(f"خطأ: {e}")
    else:
        st.markdown("""
        <div style='background:#1e1e1e; border:1px solid #2e2e2e; border-radius:12px;
                    padding:40px; text-align:center; color:#555;'>
            <div style='font-size:48px;'>📊</div>
            <div style='margin-top:12px;'>اضغط الزر أعلاه لتوليد التقرير اليومي</div>
        </div>
        """, unsafe_allow_html=True)
