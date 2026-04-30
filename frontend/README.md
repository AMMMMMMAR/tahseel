# Tahseel — Frontend (Next.js)

واجهة Next.js احترافية لمنصّة **Tahseel** للتحصيل الذكي. تُستهلَك واجهات FastAPI الحالية في مجلد [`tahseel/`](../tahseel/) مباشرة، مع دعم RTL عربي كامل وهوية بصرية مطابقة لتصميم Figma الرسمي.

## التقنيات

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** (مع design tokens مستخرَجة من Figma)
- **TanStack React Query** لإدارة حالة الخادم والتخزين المؤقت
- **Cairo** خط Google لدعم العربية
- **lucide-react** للأيقونات

## بدء التشغيل

من جذر المستودع:

```bash
cd frontend
npm install
cp .env.local.example .env.local   # عدّل القيم حسب البيئة
npm run dev
```

ثم افتح: <http://localhost:3000>

> الباكند يجب أن يعمل على `http://localhost:8000` (الافتراضي) أو على القيمة المُحدَّدة في `NEXT_PUBLIC_API_BASE_URL`.

## متغيّرات البيئة

| المفتاح                     | الوصف                                | المثال                            |
| --------------------------- | ------------------------------------ | --------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`  | عنوان Tahseel API                    | `http://localhost:8000`           |
| `NEXT_PUBLIC_COMPANY_NAME`  | اسم الشركة الظاهر في الشريط الجانبي  | `شركة الأمل للتجارة`              |
| `NEXT_PUBLIC_USER_NAME`     | اسم المستخدم الحالي                  | `عمر عبدالله`                     |
| `NEXT_PUBLIC_USER_ROLE`     | دور المستخدم                         | `مدير التحصيل`                    |

## الأوامر

```bash
npm run dev      # تطوير محلّي
npm run build    # بناء للإنتاج
npm run start    # تشغيل النسخة المبنيّة
npm run lint     # فحص ESLint
```

## بنية المجلدات

```
frontend/
├── src/
│   ├── app/
│   │   ├── (dashboard)/        # تخطيط مشترك مع الـ Sidebar
│   │   │   ├── page.tsx        # لوحة التحكم
│   │   │   ├── customers/      # العملاء
│   │   │   ├── bonds/          # الفواتير والسندات
│   │   │   ├── upload/         # رفع سند جديد
│   │   │   ├── reports/        # التقارير
│   │   │   ├── agent-logs/     # نشاط الوكيل الذكي (AI Agent Logs)
│   │   │   └── settings/       # الإعدادات
│   │   ├── globals.css         # design tokens + RTL
│   │   └── layout.tsx          # الجذر (HTML, خط Cairo, providers)
│   ├── components/
│   │   ├── providers/          # QueryProvider, ToastProvider
│   │   ├── layout/             # Sidebar, PageHeader
│   │   ├── ui/                 # Card, Badge, Button, RiskBadge, ...
│   │   └── dashboard/          # KpiCard, PriorityTable, DecisionCard
│   ├── hooks/
│   │   └── useBonds.ts         # React Query hooks
│   ├── lib/
│   │   ├── api.ts              # API client مع معالجة أخطاء موحّدة
│   │   ├── bonds.ts            # منطق المخاطر والاقتراحات والتجميعات
│   │   ├── types.ts            # أنواع TypeScript
│   │   └── utils.ts            # تنسيق أرقام/تواريخ/أحرف
│   └── ...
├── .env.local.example
└── next.config.ts
```

## التكامل مع الباكند

| الواجهة الخلفية              | الواجهة الأمامية                    |
| ---------------------------- | ----------------------------------- |
| `GET  /health`               | يُستخدم في صفحة الإعدادات للفحص    |
| `GET  /api/bonds`            | لوحة التحكم، السندات، العملاء، التقارير |
| `POST /api/bonds`            | حفظ سند من JSON يدويًا             |
| `POST /api/bonds/ocr`        | رفع صورة → OCR فقط دون الحفظ التلقائي |
| `POST /api/agent/run`        | تشغيل الوكيل الذكي يدوياً          |
| `GET  /api/agent/logs`       | جلب سجل النشاطات الخاص بالوكيل     |

كل الطلبات تمرّ عبر `src/lib/api.ts` بنوعٍ آمن ومعالجة أخطاء موحّدة (`ApiError`).

## ملاحظات تشغيلية

- **CORS:** الباكند يفتح `*` افتراضيًا، يكفي للتطوير. في الإنتاج ضع دومين الواجهة الفعلي.
- **الخط:** يستخدم Cairo من Google Fonts عبر `next/font` مع `display: swap`.
- **التواريخ:** نستخدم locale ثابت `ar-SA-u-ca-gregory-nu-arab` لتجنّب اختلاف SSR/Client.
- **المفاتيح العربية في الـ OCR:** تُرسل كما يطلبها الباكند (`رقم_السند`, `اسم_العميل`, ...) دون تعديل.

## Roadmap

- إضافة طبقة مصادقة (Supabase Auth) مع حماية المسارات.
- صفحة تفاصيل العميل/السند لعرض السجل الكامل والإجراءات.
- إشعارات Realtime عبر Supabase channels.
- اختبارات تكامل (Playwright) للسيناريوهات الأساسية.
