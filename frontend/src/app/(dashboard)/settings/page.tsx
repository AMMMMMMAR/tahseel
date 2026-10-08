"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useHealth } from "@/hooks/useBonds";
import { GithubIcon } from "@/components/icons/GithubIcon";
import { ShieldCheck, Sparkles, Terminal } from "lucide-react";

export default function SettingsPage() {
  const { data, isLoading, isError } = useHealth();
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const company =
    process.env.NEXT_PUBLIC_COMPANY_NAME || "شركة الأمل للتجارة";
  const userName = process.env.NEXT_PUBLIC_USER_NAME || "عمر عبدالله";
  const userRole = process.env.NEXT_PUBLIC_USER_ROLE || "مدير التحصيل";

  return (
    <>
      <PageHeader
        title="الإعدادات وبيئة التشغيل"
        subtitle="معلومات النظام، حالة اتصال الخادم، وروابط مستودع المصدر المفتوح"
      />

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
          <Row label="الجهة التجارية" value={company} />
          <Row label="مسؤول التحصيل" value={`${userName} · ${userRole}`} />
          <p className="mt-2 text-xs text-slate-500">
            يمكن تخصيص هذه المعطيات عبر متغيرات البيئة في ملف <span className="font-mono text-slate-400">.env</span>.
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
              isLoading ? (
                <Badge tone="neutral">جاري الفحص…</Badge>
              ) : isError ? (
                <Badge tone="danger">غير متصل</Badge>
              ) : (
                <Badge tone="success">متصل بنجاح ({data?.status ?? "ok"})</Badge>
              )
            }
          />
          <Row label="معرّف الخدمة" value={data?.service ?? "tahseel-backend"} mono />
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
          <Row label="الترخيص البرمجي" value="MIT License (مفتوح المصدر)" />
          <Row label="حزمة الذكاء الاصطناعي" value="Google Gemini 2.5 Flash + LangGraph StateGraph" mono />
          <Row label="قاعدة البيانات" value="SQLite (محلية وسريعة بدون إعدادات)" />
        </Card>
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
