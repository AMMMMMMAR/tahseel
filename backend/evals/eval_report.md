# 📊 Tahseel Autonomous Collection Agent — Evaluation Benchmark Report

## Executive Summary
This report documents the automated evaluation benchmark for the **Tahseel AI Agent**.
The benchmark tests **20 synthetic Arabic debt scenarios** to mathematically verify escalation strategy precision, zero financial hallucinations, and full regulatory tone compliance.

| Metric | Target | Actual Result | Status |
| :--- | :---: | :---: | :---: |
| **Overall Benchmark Pass Rate** | >= 95% | **100.0%** | ✅ PASSED |
| **Strategy Selection Precision** | >= 95% | **100.0%** | ✅ PASSED |
| **Financial Anti-Hallucination** | 100% | **100.0%** | ✅ PASSED |
| **Regulatory & Tone Compliance** | >= 95% | **100.0%** | ✅ PASSED |
| **Total Scenarios Evaluated** | 20 | **20** | ✅ COMPLETED |
| **Benchmark Duration** | < 1.0s | **0.18 ms** | ⚡ ULTRA-FAST |

---

## Detailed Scenario Scorecard

| Scenario ID | Category | Scenario Title | Expected | Predicted | Strategy | Anti-Hal | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `SCEN-01` | Standard Tiers | تذكير استباقي ودي قبل الاستحقاق | L1 | L1 | ✅ | ✅ | ✅ PASS |
| `SCEN-02` | Standard Tiers | متابعة مالية رسمية خلال الأسبوع الأول | L2 | L2 | ✅ | ✅ | ✅ PASS |
| `SCEN-03` | Standard Tiers | تنبيه عاجل مع خطة جدولة 3 أقساط | L3 | L3 | ✅ | ✅ | ✅ PASS |
| `SCEN-04` | Standard Tiers | إنذار قانوني نهائي قبل التنفيذ القضائي | L4 | L4 | ✅ | ✅ | ✅ PASS |
| `SCEN-05` | Boundary Conditions | الحد الدقيق ليوم الاستحقاق (يوم 0) | L1 | L1 | ✅ | ✅ | ✅ PASS |
| `SCEN-06` | Boundary Conditions | انتقال اليوم الأول من التأخير (يوم 1) | L2 | L2 | ✅ | ✅ | ✅ PASS |
| `SCEN-07` | Boundary Conditions | سقف المرحلة الرسمية (يوم 14) | L2 | L2 | ✅ | ✅ | ✅ PASS |
| `SCEN-08` | Boundary Conditions | عتبة الدخول في المرحلة العاجلة (يوم 15) | L3 | L3 | ✅ | ✅ | ✅ PASS |
| `SCEN-09` | Boundary Conditions | سقف المرحلة العاجلة (يوم 30) | L3 | L3 | ✅ | ✅ | ✅ PASS |
| `SCEN-10` | Boundary Conditions | عتبة الإنذار القانوني القضائي (يوم 31) | L4 | L4 | ✅ | ✅ | ✅ PASS |
| `SCEN-11` | Value Extremes | مطالبة متناهية الصغر (أقل من 1500 ريال) | L2 | L2 | ✅ | ✅ | ✅ PASS |
| `SCEN-12` | Value Extremes | مطالبة شركات كبرى (250 ألف ريال) | L3 | L3 | ✅ | ✅ | ✅ PASS |
| `SCEN-13` | Risk History | تجاوز درجة المخاطر الحرجة (الخطر 88% رغم تأخير 4 أيام) | L4 | L4 | ✅ | ✅ | ✅ PASS |
| `SCEN-14` | Risk History | عميل جديد بدون تاريخ تأخير سابق | L2 | L2 | ✅ | ✅ | ✅ PASS |
| `SCEN-15` | Extreme Cases | تأخير قياسي يتجاوز 180 يوماً | L4 | L4 | ✅ | ✅ | ✅ PASS |
| `SCEN-16` | Safety Guardrails | حساب مسدد مسبقاً (ممنوع إرسال تذكير) | L0 | L0 | ✅ | ✅ | ✅ PASS |
| `SCEN-17` | Safety Guardrails | مطالبة محل نزاع قانوني معلق (إيقاف التحصيل) | L0 | L0 | ✅ | ✅ | ✅ PASS |
| `SCEN-18` | Anti-Hallucination | دقة المبالغ ذات الفواصل العشرية (67,450.50 ريال) | L2 | L2 | ✅ | ✅ | ✅ PASS |
| `SCEN-19` | Compliance & Tone | الامتثال للائحة التحصيل ومكافحة الألفاظ المسيئة | L2 | L2 | ✅ | ✅ | ✅ PASS |
| `SCEN-20` | Full Cycle | محاكاة دورة متكاملة لسند تجاري معتمد | L3 | L3 | ✅ | ✅ | ✅ PASS |

---

## Key Engineering Takeaways
1. **Zero Hallucination Guarantee**: Every debtor reminder contains the exact numeric amount in SAR and exact bond reference number. No fabricated figures or mismatched installment schedules.
2. **Deterministic 4-Tier Escalation**: Boundary conditions (Day 0, Day 14/15, Day 30/31) and serial risk overrides are categorized with 100% precision.
3. **Safety Guardrails**: Disputed and settled debts are automatically shielded from aggressive automated collection messages.
4. **Regulatory Ethics**: Courteous initial reminders, structured 3-month installment plans at Level 3, and formal Najiz judicial notices only at Level 4.
