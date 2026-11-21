"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useHealth } from "@/hooks/useBonds";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { api } from "@/lib/api";
import { CollectionPolicy } from "@/lib/types";
import {
  CheckCircle2,
  Clock,
  Layers,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Terminal,
} from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: health, isLoading: isHealthLoading, isError: isHealthError } = useHealth();

  // Fetch Company Collection Policy
  const { data: policyData } = useQuery({
    queryKey: ["collection-policy"],
    queryFn: () => api.getPolicy(),
  });

  const [form, setForm] = useState<Partial<CollectionPolicy>>({
    company_name: "شركة الأمل للتجارة",
    friendly_reminder_days: 7,
    official_followup_days: 15,
    legal_warning_days: 30,
    enable_installment_plans: true,
    default_installments_count: 3,
    allow_auto_legal_notice: true,
    communication_tone: "balanced",
    custom_prompt_notes: "",
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync loaded policy into local form
  const [prevPolicy, setPrevPolicy] = useState(policyData);
  if (policyData && policyData !== prevPolicy) {
    setPrevPolicy(policyData);
    setForm(policyData);
  }

  // Mutation to save policy
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<CollectionPolicy>) => api.updatePolicy(updates),
    onSuccess: (saved) => {
      queryClient.setQueryData(["collection-policy"], saved);
      setToastMessage("تم حفظ سياسة التحصيل بنجاح وتطبيقها على محرك الوكيل");
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  // Mutation to reset policy
  const resetMutation = useMutation({
    mutationFn: () => api.resetPolicy(),
    onSuccess: (resetted) => {
      queryClient.setQueryData(["collection-policy"], resetted);
      setForm(resetted);
      setToastMessage("تمت استعادة إعدادات سياسة التحصيل الافتراضية");
      setTimeout(() => setToastMessage(null), 4000);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const userName = process.env.NEXT_PUBLIC_USER_NAME || "عمر عبدالله";
  const userRole = process.env.NEXT_PUBLIC_USER_ROLE || "مدير التحصيل";

  return (
    <>
      <PageHeader
        title="سياسات التحصيل وبيئة التشغيل"
        subtitle="تخصيص قواعد التحصيل، مهل التصعيد وسلّم الإجراءات القانونية دون كتابة أي كود برمجي"
        action={
          toastMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-fadeIn">
              <CheckCircle2 size={14} />
              <span>{toastMessage}</span>
            </div>
          )
        }
      />

      <div className="flex flex-col gap-5">
        {/* Policy Configuration Card */}
        <Card className="p-6 text-start">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sliders size={20} />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">
                  محرك سياسات التحصيل وقواعد التصعيد للشركة
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  يقرأ الوكيل الذكي (LangGraph Agent) هذه القواعد ديناميكياً لتحديد توقيت ونبرة التنبيهات
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <RotateCcw size={13} className={resetMutation.isPending ? "animate-spin" : ""} />
              <span>استعادة الافتراضي</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-6">
            {/* 1. Escalation Timeline Days */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  سلّم التصعيد والمهل الزمنية (بالأيام بعد الاستحقاق)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Friendly Reminder */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">المستوى 1: تذكير ودي</span>
                    <span className="text-xs font-bold text-emerald-400 tabular font-mono">
                      {form.friendly_reminder_days} أيام
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={form.friendly_reminder_days ?? 7}
                    onChange={(e) => setForm({ ...form, friendly_reminder_days: Number(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500">
                    مهلة استباقية بلهجة استشارية قبل تصعيد المتابعة
                  </span>
                </div>

                {/* Official Followup */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">المستوى 2: متابعة رسمية</span>
                    <span className="text-xs font-bold text-amber-400 tabular font-mono">
                      {form.official_followup_days} يوماً
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={form.official_followup_days ?? 15}
                    onChange={(e) => setForm({ ...form, official_followup_days: Number(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                  <span className="text-[11px] text-slate-500">
                    خطاب محاسبي لمطالبة تأكيد موعد التحويل البنكي
                  </span>
                </div>

                {/* Legal Warning Notice */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">المستوى 4: إنذار ناجز القضائي</span>
                    <span className="text-xs font-bold text-rose-400 tabular font-mono">
                      {form.legal_warning_days} يوماً
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={90}
                    value={form.legal_warning_days ?? 30}
                    onChange={(e) => setForm({ ...form, legal_warning_days: Number(e.target.value) })}
                    className="w-full accent-rose-500"
                  />
                  <span className="text-[11px] text-slate-500">
                    مهلة 48 ساعة قبل رفع السند إلى الدائرة التنفيذية
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Behavior & Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Installments Plan */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers size={14} className="text-emerald-400" />
                      عرض جدولة المديونية على دفعات ميسرة
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      إذا كان مفعلاً، يقترح الوكيل تلقائياً في التنبيه العاجل (المستوى 3) تقسيط المبلغ لحل التعثر ودياً.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.enable_installment_plans ?? true}
                    onChange={(e) => setForm({ ...form, enable_installment_plans: e.target.checked })}
                    className="size-4.5 rounded accent-emerald-500 cursor-pointer mt-0.5"
                  />
                </div>

                {form.enable_installment_plans && (
                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                    <span className="text-xs text-slate-400">عدد الأقساط المقترحة:</span>
                    <select
                      value={form.default_installments_count ?? 3}
                      onChange={(e) => setForm({ ...form, default_installments_count: Number(e.target.value) })}
                      className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={2}>دفعتان (شهرين)</option>
                      <option value={3}>3 دفعات (3 أشهر - موصى به)</option>
                      <option value={4}>4 دفعات (4 أشهر)</option>
                      <option value={6}>6 دفعات (نصف سنوي)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Automatic Legal Notice Guardrail */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-rose-400" />
                      السماح بإصدار الإنذار القانوني آلياً
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      عند التعطيل، يمتنع الوكيل عن إرسال إشعار ناجز تلقائياً لأي عميل ويحيله لمدير التحصيل للموافقة اليدوية.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.allow_auto_legal_notice ?? true}
                    onChange={(e) => setForm({ ...form, allow_auto_legal_notice: e.target.checked })}
                    className="size-4.5 rounded accent-rose-500 cursor-pointer mt-0.5"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                  <span className="text-xs text-slate-400">حالة ضابط الأمان:</span>
                  <Badge tone={form.allow_auto_legal_notice ? "warning" : "success"} pill>
                    {form.allow_auto_legal_notice ? "إجراء آلي مفعل" : "يتطلب موافقة بشرية"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 3. Communication Tone */}
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={16} className="text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  نبرة التواصل المعتمدة في المراسلات
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    key: "friendly",
                    title: "ودية واستشارية",
                    desc: "تركز على حماية الشراكة وتقديم الدعم المالي الودي",
                  },
                  {
                    key: "balanced",
                    title: "متوازنة (الموصى بها)",
                    desc: "تجمع بين الاحترام المهني والوضوح الصريح في الالتزامات",
                  },
                  {
                    key: "firm",
                    title: "رسمية وحازمة",
                    desc: "تعتمد الأسلوب المحاسبي المباشر مع التركيز على المهل",
                  },
                ].map((tone) => (
                  <button
                    key={tone.key}
                    type="button"
                    onClick={() => setForm({ ...form, communication_tone: tone.key as CollectionPolicy["communication_tone"] })}
                    className={`p-3.5 rounded-xl border text-start transition-all ${
                      form.communication_tone === tone.key
                        ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <p className="text-xs font-bold text-white mb-1">{tone.title}</p>
                    <p className="text-[11px] text-slate-400 leading-normal">{tone.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Custom Disclaimers & Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                توجيهات أو شروط خاصة تضاف للرسائل (اختياري)
              </label>
              <textarea
                rows={2}
                value={form.custom_prompt_notes ?? ""}
                onChange={(e) => setForm({ ...form, custom_prompt_notes: e.target.value })}
                placeholder="مثال: يرجى التحويل على الآيبان المصرفي المعتمد SA44... مع إرسال إشعار عبر الواتساب."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition leading-relaxed"
              />
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition disabled:opacity-50"
              >
                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ السياسة واعتمادها"}
              </button>
            </div>
          </form>
        </Card>

        {/* Existing System & Open Source Meta */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Company & Profile Info */}
          <Card className="flex flex-col gap-3 p-5 text-start">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck size={18} />
              </span>
              <h2 className="text-sm font-bold text-white">
                بيانات الحساب والجهة
              </h2>
            </div>
            <Row label="الجهة التجارية" value={form.company_name || "شركة الأمل للتجارة"} />
            <Row label="مسؤول التحصيل" value={`${userName} · ${userRole}`} />
            <p className="mt-2 text-xs text-slate-500">
              يتم حفظ سياسات الشركة مباشرة في قاعدة البيانات المحلية SQLite لتفعيلها الفوري.
            </p>
          </Card>

          {/* Server Health */}
          <Card className="flex flex-col gap-3 p-5 text-start">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Terminal size={18} />
              </span>
              <h2 className="text-sm font-bold text-white">
                حالة اتصال الخادم (Backend API)
              </h2>
            </div>
            <Row label="عنوان الخادم" value={apiBase} mono />
            <Row
              label="حالة الاتصال"
              value={
                isHealthLoading ? (
                  <Badge tone="neutral">جاري الفحص…</Badge>
                ) : isHealthError ? (
                  <Badge tone="danger">غير متصل</Badge>
                ) : (
                  <Badge tone="success">متصل بنجاح ({health?.status ?? "ok"})</Badge>
                )
              }
            />
            <Row label="معرّف الخدمة" value={health?.service ?? "Tahseel API"} mono />
          </Card>

          {/* Open Source Project Details (Full width) */}
          <Card className="lg:col-span-2 flex flex-col gap-3 p-5 text-start">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                <GithubIcon className="size-4.5" />
              </span>
              <h2 className="text-sm font-bold text-white">
                مشروع تحصيل مفتوح المصدر (Open Source Project)
              </h2>
            </div>
            <Row label="المستودع الرئيسي" value="github.com/AMMMMMMAR/tahseel" mono />
            <Row label="الترخيص البرمجي" value="MIT License (مفتوح المصدر بالكامل)" />
            <Row label="معمارية الوكيل" value="LangGraph StateGraph + Dynamic Policy Engine" mono />
            <Row label="قاعدة البيانات" value="SQLite (محلية وسريعة بدون إعدادات خارجية)" />
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-800/80 pt-3 first:border-0 first:pt-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span
        className={`text-xs font-semibold text-white ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

