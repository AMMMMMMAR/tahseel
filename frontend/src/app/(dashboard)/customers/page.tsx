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

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            placeholder="ابحث باسم العميل، البريد، أو الهاتف…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-[320px] rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition"
          />
          <p className="text-xs text-slate-400">
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
                <tr className="text-xs font-medium text-slate-400">
                  <th className="px-3.5 py-2 text-start font-medium">العميل</th>
                  <th className="px-3.5 py-2 text-start font-medium">عدد السندات</th>
                  <th className="px-3.5 py-2 text-start font-medium">المستحقّ (ر.س)</th>
                  <th className="px-3.5 py-2 text-start font-medium">إجمالي التعامل (ر.س)</th>
                  <th className="px-3.5 py-2 text-start font-medium">عدد المتأخرات</th>
                  <th className="px-3.5 py-2 text-start font-medium">آخر تعامل</th>
                  <th className="px-3.5 py-2 text-start font-medium">درجة الخطر</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={`${c.id ?? c.name}`}
                    className="bg-slate-900/40 hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="rounded-s-xl px-3.5 py-3 align-middle border-y border-s border-slate-800/70">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} />
                        <div className="flex min-w-0 flex-col text-start">
                          <p className="truncate text-xs font-semibold text-white">
                            {c.name}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {c.email || c.phone || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="tabular px-3.5 py-3 align-middle text-xs text-slate-200 border-y border-slate-800/70">
                      {formatNumberAr(c.bonds_count)}
                    </td>
                    <td className="tabular px-3.5 py-3 align-middle text-xs font-semibold whitespace-nowrap text-white border-y border-slate-800/70">
                      {formatCurrencyAr(c.outstanding_amount)}
                    </td>
                    <td className="tabular px-3.5 py-3 align-middle text-xs whitespace-nowrap text-slate-400 border-y border-slate-800/70">
                      {formatCurrencyAr(c.total_amount)}
                    </td>
                    <td className="tabular px-3.5 py-3 align-middle text-xs text-rose-400 font-semibold border-y border-slate-800/70">
                      {formatNumberAr(c.overdue_count)}
                    </td>
                    <td className="tabular px-3.5 py-3 align-middle text-xs whitespace-nowrap text-slate-400 border-y border-slate-800/70">
                      {formatDateAr(c.last_bond_date)}
                    </td>
                    <td className="rounded-e-xl px-3.5 py-3 align-middle border-y border-e border-slate-800/70">
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
