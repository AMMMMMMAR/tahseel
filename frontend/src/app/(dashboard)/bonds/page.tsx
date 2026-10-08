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
        subtitle={`عدد السندات المسجلة: ${data?.bonds?.length ?? 0}`}
        action={
          <Link
            href="/upload"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition"
          >
            + فحص سند جديد (OCR)
          </Link>
        }
      />

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            placeholder="ابحث برقم السند، اسم العميل، أو الوصف…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-[320px] rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                  status === opt.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
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
                <tr className="text-xs font-medium text-slate-400">
                  <th className="px-3.5 py-2 text-start font-medium">العميل</th>
                  <th className="px-3.5 py-2 text-start font-medium">رقم السند</th>
                  <th className="px-3.5 py-2 text-start font-medium">المبلغ (ر.س)</th>
                  <th className="px-3.5 py-2 text-start font-medium">الإصدار</th>
                  <th className="px-3.5 py-2 text-start font-medium">الاستحقاق</th>
                  <th className="px-3.5 py-2 text-start font-medium">درجة الخطر</th>
                  <th className="px-3.5 py-2 text-start font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bond) => (
                  <tr key={bond.id} className="bg-slate-900/40 hover:bg-slate-800/40 transition-colors">
                    <td className="rounded-s-xl px-3.5 py-3 align-middle border-y border-s border-slate-800/70">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={bond.clients?.name} />
                        <p className="truncate text-xs font-semibold text-white">
                          {bond.clients?.name || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="tabular px-3.5 py-3 align-middle text-xs whitespace-nowrap text-slate-400 border-y border-slate-800/70">
                      {bond.bond_number}
                    </td>
                    <td className="tabular px-3.5 py-3 align-middle text-xs font-semibold whitespace-nowrap text-white border-y border-slate-800/70">
                      {formatCurrencyAr(bond.amount)}
                    </td>
                    <td className="tabular px-3.5 py-3 align-middle text-xs whitespace-nowrap text-slate-400 border-y border-slate-800/70">
                      {formatDateAr(bond.issue_date)}
                    </td>
                    <td className="tabular px-3.5 py-3 align-middle text-xs whitespace-nowrap text-slate-400 border-y border-slate-800/70">
                      {formatDateAr(bond.due_date)}
                    </td>
                    <td className="px-3.5 py-3 align-middle border-y border-slate-800/70">
                      <RiskBadge score={bond.clients?.risk_score ?? 0} />
                    </td>
                    <td className="rounded-e-xl px-3.5 py-3 align-middle border-y border-e border-slate-800/70">
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
