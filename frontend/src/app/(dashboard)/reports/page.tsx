"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useBonds } from "@/hooks/useBonds";
import { isSettled, summarizeBonds } from "@/lib/bonds";
import { formatCurrencyAr, formatNumberAr } from "@/lib/utils";
import type { Bond } from "@/lib/types";

interface StatusBucket {
  status: string;
  label: string;
  count: number;
  total: number;
  tone: "high" | "medium" | "low" | "success";
}

const STATUS_CONFIG: Array<Pick<StatusBucket, "status" | "label" | "tone">> = [
  { status: "pending", label: "قيد المتابعة", tone: "low" },
  { status: "reminded", label: "تمّ التذكير", tone: "medium" },
  { status: "overdue", label: "متأخر", tone: "high" },
  { status: "settled", label: "مسدّد", tone: "success" },
];

function buildStatusBuckets(bonds: Bond[]): StatusBucket[] {
  return STATUS_CONFIG.map((s) => {
    const matching = bonds.filter((b) => b.status === s.status);
    return {
      ...s,
      count: matching.length,
      total: matching.reduce((sum, b) => sum + Number(b.amount || 0), 0),
    };
  });
}

export default function ReportsPage() {
  const { data, isLoading, isError, error, refetch } = useBonds({
    status: "all",
    limit: 500,
  });

  const summary = useMemo(
    () => summarizeBonds(data?.bonds ?? []),
    [data?.bonds]
  );

  const buckets = useMemo(
    () => buildStatusBuckets(data?.bonds ?? []),
    [data?.bonds]
  );

  const recentSettled = useMemo(
    () =>
      [...(data?.bonds ?? [])]
        .filter(isSettled)
        .sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        )
        .slice(0, 5),
    [data?.bonds]
  );

  const collectionRate = useMemo(() => {
    const total = (data?.bonds ?? []).reduce(
      (s, b) => s + Number(b.amount || 0),
      0
    );
    if (!total) return 0;
    return Math.round((summary.collectedThisMonth / total) * 100);
  }, [data?.bonds, summary.collectedThisMonth]);

  return (
    <>
      <PageHeader
        title="التقارير"
        subtitle="نظرة شاملة على أداء التحصيل خلال الفترة الحالية"
      />

      {isLoading ? (
        <Card className="p-4">
          <LoadingState />
        </Card>
      ) : isError ? (
        <Card className="p-4">
          <ErrorState
            title="تعذّر تحميل التقارير"
            description={error?.detail || error?.message}
            onRetry={() => refetch()}
          />
        </Card>
      ) : (data?.bonds?.length ?? 0) === 0 ? (
        <Card className="p-4">
          <EmptyState
            title="لا توجد بيانات لإنشاء تقرير"
            description="ارفع سندًا واحدًا على الأقل لتظهر التقارير هنا."
          />
        </Card>
      ) : (
        <>
          <section className="grid gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
            <SummaryStat
              label="إجمالي المستحقات"
              value={formatCurrencyAr(summary.totalReceivables)}
              unit="ر.س"
            />
            <SummaryStat
              label="المتأخر سداده"
              value={formatCurrencyAr(summary.overdueAmount)}
              unit="ر.س"
              tone="danger"
            />
            <SummaryStat
              label="المحصّل هذا الشهر"
              value={formatCurrencyAr(summary.collectedThisMonth)}
              unit="ر.س"
              tone="success"
            />
            <SummaryStat
              label="نسبة التحصيل"
              value={`${formatNumberAr(collectionRate)}٪`}
            />
          </section>

          <Card className="flex flex-col gap-3 p-[18px]">
            <h2 className="text-start text-[16px] font-bold text-[var(--color-fg)]">
              توزّع السندات حسب الحالة
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {buckets.map((b) => (
                <div
                  key={b.status}
                  className="flex flex-col gap-2 rounded-[10px] bg-[var(--color-bg-row)] p-4 text-start"
                >
                  <div className="flex">
                    <Badge tone={b.tone} pill>
                      {b.label}
                    </Badge>
                  </div>
                  <p className="tabular text-[24px] font-bold text-[var(--color-fg)]">
                    {formatNumberAr(b.count)}
                  </p>
                  <p className="tabular text-[12px] text-[var(--color-fg-subtle)]">
                    {formatCurrencyAr(b.total)} ر.س
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-3 p-[18px]">
            <h2 className="text-start text-[16px] font-bold text-[var(--color-fg)]">
              آخر السندات المسوّاة
            </h2>
            {recentSettled.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-[var(--color-fg-subtle)]">
                لا توجد سندات مسوّاة بعد.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentSettled.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] bg-[var(--color-bg-row)] px-3 py-3"
                  >
                    <div className="flex min-w-0 flex-col text-start">
                      <p className="truncate text-[13px] font-semibold text-[var(--color-fg)]">
                        {b.clients?.name || "—"}
                      </p>
                      <p className="tabular truncate text-[11px] text-[var(--color-fg-subtle)]">
                        {b.bond_number}
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-[13px] font-semibold text-[var(--color-fg)]">
                      {formatCurrencyAr(b.amount)} ر.س
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  );
}

function SummaryStat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "success" | "danger";
}) {
  return (
    <Card className="flex flex-col gap-2 p-[18px] text-start">
      <p className="text-[12px] text-[var(--color-fg-subtle)]">{label}</p>
      <div className="flex items-baseline justify-start gap-2">
        <span
          className={`tabular text-[24px] font-bold ${
            tone === "success"
              ? "text-[var(--color-success)]"
              : tone === "danger"
                ? "text-[var(--color-danger-bright)]"
                : "text-[var(--color-fg)]"
          }`}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-[12px] text-[var(--color-fg-subtle)]">
            {unit}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
