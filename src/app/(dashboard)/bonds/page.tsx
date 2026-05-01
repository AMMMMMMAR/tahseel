"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useBonds } from "@/hooks/useBonds";
import { STATUS_FILTER_OPTIONS } from "@/lib/bonds";
import { formatCurrencyAr, formatDateAr, cn } from "@/lib/utils";
import type { BondStatus } from "@/lib/types";

export default function BondsPage() {
  const [status, setStatus] = useState<BondStatus | "all">("all");
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, error, refetch } = useBonds({
    status,
    limit: 200,
  });

  const filtered = useMemo(() => {
    const list = data?.bonds ?? [];
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter(
      (b) =>
        b.bond_number?.toLowerCase().includes(q) ||
        (b.clients?.name || "").toLowerCase().includes(q) ||
        (b.description || "").toLowerCase().includes(q)
    );
  }, [data?.bonds, query]);

  return (
    <>
      <PageHeader
        title="الفواتير والسندات"
        subtitle={`عدد السندات: ${data?.bonds?.length ?? 0}`}
        action={
          <Link
            href="/upload"
            className="rounded-[5px] bg-[var(--color-brand)] px-4 py-3 text-[13px] font-semibold text-white hover:bg-[#2563eb]"
          >
            + رفع سند جديد
          </Link>
        }
      />

      <Card className="flex flex-col gap-3 p-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            placeholder="ابحث برقم السند، اسم العميل، أو الوصف…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-[320px] rounded-[8px] border border-[var(--color-border)] bg-[var(--color-bg-row)] px-3 py-2 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)] focus:border-[var(--color-brand)] focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={cn(
                  "rounded-[8px] px-3 py-2 text-[12px] font-semibold transition-colors",
                  status === opt.value
                    ? "bg-[var(--color-brand)] text-white"
                    : "bg-[var(--color-bg-row)] text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-card-soft)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            title="تعذّر تحميل السندات"
            description={error?.detail || error?.message}
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="لا توجد سندات مطابقة"
            description="جرّب تعديل البحث أو فلتر الحالة، أو ارفع سندًا جديدًا."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-separate border-spacing-y-2 text-start">
              <thead>
                <tr className="text-[11px] font-medium text-[var(--color-fg-faint)]">
                  <th className="px-3 py-2 text-start font-medium">العميل</th>
                  <th className="px-3 py-2 text-start font-medium">رقم السند</th>
                  <th className="px-3 py-2 text-start font-medium">المبلغ (ر.س)</th>
                  <th className="px-3 py-2 text-start font-medium">الإصدار</th>
                  <th className="px-3 py-2 text-start font-medium">الاستحقاق</th>
                  <th className="px-3 py-2 text-start font-medium">درجة الخطر</th>
                  <th className="px-3 py-2 text-start font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bond) => (
                  <tr key={bond.id} className="bg-[var(--color-bg-row)]">
                    <td className="rounded-s-[10px] px-3 py-3 align-middle">
                      <div className="flex items-center gap-[10px]">
                        <Avatar name={bond.clients?.name} />
                        <p className="truncate text-[13px] font-semibold text-[var(--color-fg)]">
                          {bond.clients?.name || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="tabular px-3 py-3 align-middle text-[12px] whitespace-nowrap text-[var(--color-fg-subtle)]">
                      {bond.bond_number}
                    </td>
                    <td className="tabular px-3 py-3 align-middle text-[14px] font-semibold whitespace-nowrap text-[var(--color-fg)]">
                      {formatCurrencyAr(bond.amount)}
                    </td>
                    <td className="tabular px-3 py-3 align-middle text-[12px] whitespace-nowrap text-[var(--color-fg-subtle)]">
                      {formatDateAr(bond.issue_date)}
                    </td>
                    <td className="tabular px-3 py-3 align-middle text-[12px] whitespace-nowrap text-[var(--color-fg-subtle)]">
                      {formatDateAr(bond.due_date)}
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <RiskBadge score={bond.clients?.risk_score ?? 0} />
                    </td>
                    <td className="rounded-e-[10px] px-3 py-3 align-middle">
                      <StatusBadge bond={bond} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
