"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useBonds } from "@/hooks/useBonds";
import { aggregateClients } from "@/lib/bonds";
import { formatCurrencyAr, formatDateAr, formatNumberAr } from "@/lib/utils";

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading, isError, error, refetch } = useBonds({
    status: "all",
    limit: 500,
  });

  const clients = useMemo(
    () => aggregateClients(data?.bonds ?? []),
    [data?.bonds]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return clients;
    const q = query.trim().toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    );
  }, [clients, query]);

  return (
    <>
      <PageHeader
        title="العملاء"
        subtitle={`عدد العملاء: ${formatNumberAr(clients.length)}`}
      />

      <Card className="flex flex-col gap-3 p-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            placeholder="ابحث باسم العميل، البريد، أو الهاتف…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-[320px] rounded-[8px] border border-[var(--color-border)] bg-[var(--color-bg-row)] px-3 py-2 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)] focus:border-[var(--color-brand)] focus:outline-none"
          />
          <p className="text-[12px] text-[var(--color-fg-subtle)]">
            مرتّبون حسب درجة الخطر — الأعلى أولاً
          </p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            title="تعذّر تحميل العملاء"
            description={error?.detail || error?.message}
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="لا يوجد عملاء بعد"
            description="ارفع أوّل سند ليتم إنشاء العميل تلقائيًا."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[11px] font-medium text-[var(--color-fg-faint)]">
                  <th className="px-3 py-2 text-start font-medium">العميل</th>
                  <th className="px-3 py-2 text-start font-medium">عدد السندات</th>
                  <th className="px-3 py-2 text-start font-medium">المستحقّ (ر.س)</th>
                  <th className="px-3 py-2 text-start font-medium">إجمالي التعامل (ر.س)</th>
                  <th className="px-3 py-2 text-start font-medium">عدد المتأخرات</th>
                  <th className="px-3 py-2 text-start font-medium">آخر تعامل</th>
                  <th className="px-3 py-2 text-start font-medium">درجة الخطر</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={`${c.id ?? c.name}`}
                    className="bg-[var(--color-bg-row)]"
                  >
                    <td className="rounded-s-[10px] px-3 py-3 align-middle">
                      <div className="flex items-center gap-[10px]">
                        <Avatar name={c.name} />
                        <div className="flex min-w-0 flex-col text-start">
                          <p className="truncate text-[13px] font-semibold text-[var(--color-fg)]">
                            {c.name}
                          </p>
                          <p className="truncate text-[11px] text-[var(--color-fg-subtle)]">
                            {c.email || c.phone || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="tabular px-3 py-3 align-middle text-[13px] text-[var(--color-fg)]">
                      {formatNumberAr(c.bonds_count)}
                    </td>
                    <td className="tabular px-3 py-3 align-middle text-[13px] font-semibold whitespace-nowrap text-[var(--color-fg)]">
                      {formatCurrencyAr(c.outstanding_amount)}
                    </td>
                    <td className="tabular px-3 py-3 align-middle text-[13px] whitespace-nowrap text-[var(--color-fg-subtle)]">
                      {formatCurrencyAr(c.total_amount)}
                    </td>
                    <td className="tabular px-3 py-3 align-middle text-[13px] text-[var(--color-fg)]">
                      {formatNumberAr(c.overdue_count)}
                    </td>
                    <td className="tabular px-3 py-3 align-middle text-[12px] whitespace-nowrap text-[var(--color-fg-subtle)]">
                      {formatDateAr(c.last_bond_date)}
                    </td>
                    <td className="rounded-e-[10px] px-3 py-3 align-middle">
                      <RiskBadge score={c.risk_score} />
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
