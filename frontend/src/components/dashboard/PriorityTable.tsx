import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/States";
import type { Bond } from "@/lib/types";
import { getSuggestedAction } from "@/lib/bonds";
import { cn, formatCurrencyAr, formatDateAr } from "@/lib/utils";

const actionToneClasses = {
  high: "bg-[var(--color-danger)]",
  medium: "bg-[var(--color-warn)]",
  low: "bg-[var(--color-info)]",
} as const;

const GRID_COLS =
  "grid-cols-[minmax(180px,1.4fr)_minmax(110px,0.8fr)_minmax(110px,0.8fr)_minmax(120px,0.9fr)_minmax(120px,0.9fr)_minmax(180px,1.6fr)]";

const headers = [
  { label: "العميل", align: "text-start" },
  { label: "المبلغ (ر.س)", align: "text-start" },
  { label: "الاستحقاق", align: "text-start" },
  { label: "درجة الخطر", align: "text-start" },
  { label: "الحالة", align: "text-start" },
  { label: "الإجراء المقترح", align: "text-start" },
];

interface PriorityTableProps {
  bonds: Bond[];
}

export function PriorityTable({ bonds }: PriorityTableProps) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 text-start">
          <h2 className="text-sm font-bold text-white">
            قائمة المتابعة ذات الأولوية
          </h2>
          <p className="text-xs text-slate-400">
            السندات المرتبة حسب درجة الخطر واستحقاق السداد
          </p>
        </div>
        <Link
          href="/bonds"
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
        >
          عرض كل السندات ←
        </Link>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[820px]">
          <div className={cn("grid items-center gap-3 px-3 py-2 text-xs text-slate-400 font-medium", GRID_COLS)}>
            {headers.map((h) => (
              <p key={h.label} className={cn("whitespace-nowrap", h.align)}>
                {h.label}
              </p>
            ))}
          </div>

          {bonds.length === 0 ? (
            <EmptyState
              title="لا توجد سندات بعد"
              description="ابدأ برفع سند جديد أو تحقّق من اتصال الخادم."
            />
          ) : (
            <div className="flex flex-col gap-2">
              {bonds.map((bond) => {
                const action = getSuggestedAction(bond);
                return (
                  <div
                    key={bond.id}
                    className={cn(
                      "grid items-center gap-3 rounded-xl bg-slate-900/40 border border-slate-800/70 hover:border-slate-700/80 px-3.5 py-3 transition-colors",
                      GRID_COLS
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={bond.clients?.name} />
                      <p className="truncate text-xs font-semibold text-white">
                        {bond.clients?.name || "—"}
                      </p>
                    </div>

                    <p className="tabular truncate text-xs font-semibold text-white">
                      {formatCurrencyAr(bond.amount)}
                    </p>

                    <p className="tabular truncate text-xs text-slate-400">
                      {formatDateAr(bond.due_date || bond.issue_date)}
                    </p>

                    <div className="flex">
                      <RiskBadge score={bond.clients?.risk_score ?? 0} />
                    </div>

                    <div className="flex">
                      <StatusBadge bond={bond} />
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white",
                          actionToneClasses[action.tone]
                        )}
                      >
                        ←
                      </span>
                      <p className="truncate text-xs font-medium text-slate-200">
                        {action.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function PriorityTableSkeleton() {
  return (
    <Card className="flex flex-col gap-3 p-[18px]">
      <div className="flex items-center justify-start gap-3">
        <div className="h-[20px] w-[260px] animate-pulse rounded bg-[var(--color-bg-row)]" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[64px] animate-pulse rounded-[10px] bg-[var(--color-bg-row)]"
        />
      ))}
      <div className="hidden">
        <Badge tone="neutral">—</Badge>
      </div>
    </Card>
  );
}
