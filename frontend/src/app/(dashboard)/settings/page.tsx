"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useHealth } from "@/hooks/useBonds";

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
        title="الإعدادات"
        subtitle="معلومات الشركة وحالة الاتصال بالخادم"
      />

      <div className="grid gap-[14px] lg:grid-cols-2">
        <Card className="flex flex-col gap-3 p-[18px] text-start">
          <h2 className="text-[16px] font-bold text-[var(--color-fg)]">
            بيانات الشركة
          </h2>
          <Row label="اسم الشركة" value={company} />
          <Row label="مدير التحصيل" value={`${userName} · ${userRole}`} />
          <p className="mt-2 text-[11px] text-[var(--color-fg-faint)]">
            يمكن تعديل هذه القيم من ملف <span className="tabular">.env.local</span>.
          </p>
        </Card>

        <Card className="flex flex-col gap-3 p-[18px] text-start">
          <h2 className="text-[16px] font-bold text-[var(--color-fg)]">
            الاتصال بالخادم
          </h2>
          <Row label="عنوان API" value={apiBase} mono />
          <Row
            label="حالة الخادم"
            value={
              isLoading ? (
                <Badge tone="neutral">جاري الفحص…</Badge>
              ) : isError ? (
                <Badge tone="high">غير متاح</Badge>
              ) : (
                <Badge tone="success">{data?.status ?? "ok"}</Badge>
              )
            }
          />
          <Row label="اسم الخدمة" value={data?.service ?? "—"} mono />
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
    <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3 first:border-0 first:pt-0">
      <span className="text-[12px] text-[var(--color-fg-subtle)]">{label}</span>
      <span
        className={`text-[13px] font-semibold text-[var(--color-fg)] ${
          mono ? "tabular" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
