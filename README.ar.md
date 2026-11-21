# منصة تحصيل (Tahseel)

> منظومة مفتوحة المصدر لأتمتة فحص ومتابعة السندات التجارية وإدارة التحصيل المالي الذاتي.

[![CI Pipeline](https://github.com/AMMMMMMAR/tahseel/actions/workflows/ci.yml/badge.svg)](https://github.com/AMMMMMMAR/tahseel/actions/workflows/ci.yml)
[![الترخيص: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![بايثون](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-16_(Turbopack)-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/محرك_الوكيل-LangGraph_StateGraph-1C3C3C)](https://langchain-ai.github.io/langgraph/)
[![قاعدة البيانات](https://img.shields.io/badge/قاعدة_البيانات-SQLite_(تلقائية)-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)

🇬🇧 **[Click here to view the English Documentation (README in English)](README.md)**

---

## نظرة عامة

منصة **تحصيل** هي نظام مالي تقني (FinTech) مفتوح المصدر وموجه للبيئة التجارية والشركات في المملكة العربية السعودية والعالم العربي. يجمع النظام بين تقنيات **الرؤية الحاسوبية المتقدمة (Multi-Modal Vision)** ومحرك اتخاذ القرار المبني على **LangGraph StateGraph** لأتمتة دورة متابعة وتحصيل الديون والالتزامات المالية وفق سياسات حوكمة قابلة للتخصيص بالكامل.

---

## أبرز المزايا والقدرات

1. **القراءة الضوئية للسندات العربية (Arabic Financial OCR):**
   - استخراج وتدقيق بيانات السندات لأمر والفواتير التجارية من الصور وملفات PDF.
   - تحويل وتوحيد الأرقام العربية والمشرقية (٠-٩) وصيغ التواريخ الهجرية والميلادية.
   - احتساب نسبة دقة الاستخراج آلياً للمراجعة السريعة.

2. **محرك اتخاذ القرار الآلي (LangGraph StateGraph Engine):**
   - دورة عمل حركية تتكون من 4 مراحل متتالية:
     1. `تقييم المخاطر`: تحليل مدة التأخير، حجم المديونية، وسجل العميل المالي.
     2. `اختيار الإجراء`: مطابقة تصنيف العميل مع سياسات التصعيد المعتمدة للشركة.
     3. `إرسال الإشعارات`: صياغة وبث رسائل التذكير والمطالبات الرسمية عبر واتساب والبريد الإلكتروني.
     4. `إصدار التقرير`: تلخيص الوضع المالي للمحفظة في تقرير تنفيذي يومي.

3. **محرك سياسات التحصيل المخصصة (Corporate Policy Engine):**
   - تحديد مهل التصعيد الزمني (تذكير ودي ← متابعة رسمية ← إنذار قانوني نهائي).
   - خيارات تصنيف العملاء (كبار العملاء VIP بلهجة استشارية، أو مسار التحصيل الصارم).
   - إمكانية تمكين خطط السداد بالتقسيط آلياً.

4. **قاعدة بيانات SQLite محلية ذات إعداد صفري (Zero-Config):**
   - بناء الجداول والمخطط تلقائياً عند التشغيل الأول بدون الحاجة لأي خوادم سحابية خارجية.
   - إمكانية شحن بيانات تجريبية بنقرة واحدة من لوحة التحكم أو عبر `/api/seed`.

5. **المراقبة والبث المباشر (Real-Time Observability):**
   - متابعة حية لخطوات تفكير وتنفيذ المحرك عبر تقنية WebSockets.
   - سجل تدقيق كامل لكافة القرارات والرسائل المرسلة.

6. **منظومة اختبارات وتقييم شاملة (Evaluation Benchmark):**
   - تتضمن 20 سيناريو مالي واقعي لاختبار دقة وسلوك القرارات المالية.
   - اجتياز 47 اختباراً آلياً بنسبة 100%.

---

## بنية ومعمارية النظام

```text
       [ مستند سند لأمر أو فاتورة تجارية ]
                        │
                        ▼
       [ محرك القراءة الضوئية (Gemini Vision OCR) ]
                        │ (استخراج بيانات مهيكلة)
                        ▼
         [ خادم التطبيق (FastAPI • Python 3.11) ]
         ├── قاعدة بيانات SQLite محلية
         ├── بث القرارات المباشر (WebSockets)
         └── محرك سياسات الشركة والمهل القانونية
                        │
                        ▼
           [ محرك القرارات (LangGraph) ]
         ├── تقييم المخاطر وتصنيف الديون
         ├── اختيار الإجراء ومطابقة السياسة
         ├── إرسال التنبيهات (WhatsApp / Email)
         └── إصدار التقرير المالي اليومي
                        │
                        ▼
        [ واجهة المستخدم (Next.js 16 • App Router) ]
         (تصميم مالي احترافي • دعم كامل للغة العربية RTL)
```

---

## دليل التشغيل السريع

### المتطلبات الأساسية
- بايثون `Python 3.11` أو أحدث.
- بيئة نود `Node.js 18` أو أحدث.
- مفتاح `GEMINI_API_KEY` (مجاني من [Google AI Studio](https://aistudio.google.com/)).

### 1. تشغيل الخادم الخلفي (Backend)

```bash
cd backend

# إنشاء البيئة الافتراضية وتفعيلها
python -m venv venv
# لنظام Windows:
.\venv\Scripts\activate
# لأنظمة Linux/macOS:
source venv/bin/activate

# تثبيت المكتبات
pip install -r requirements.txt

# إعداد ملف البيئة
cp ../.env.example .env
# قم بفتح ملف .env وضع مفتاح GEMINI_API_KEY

# بدء تشغيل الخادم
uvicorn app.main:app --port 8000 --reload
```

ستعمل الواجهة البرمجية على الرابط `http://localhost:8000`، ويمكنك استعراض وثائق الـ API التفاعلية عبر `http://localhost:8000/docs`.

### 2. تشغيل الواجهة الأمامية (Frontend)

في نافذة طرفية جديدة:

```bash
cd frontend

# تثبيت حزم الواجهة
npm install

# بدء خادم التطوير
npm run dev
```

افتح المتصفح على الرابط: `http://localhost:3000`.

---

### التشغيل عبر Docker Compose

يمكنك تشغيل كامل المنظومة بحاوية واحدة عبر الأمر:

```bash
docker compose up --build
```

---

## الاختبارات وضمان الجودة

```bash
# تشغيل كامل حزمة اختبارات الباك اند (47 اختباراً)
cd backend
pytest tests/ -v

# فحص كود الواجهة وبنائها للإنتاج
cd frontend
npm run lint
npm run build
```

---

## الترخيص القانوني (License)

هذا المشروع مرخص بموجب رخصة [MIT License](https://opensource.org/licenses/MIT) مفتوحة المصدر بالكامل.

