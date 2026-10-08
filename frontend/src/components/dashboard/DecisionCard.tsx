import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Button } from "@/components/ui/Button";
import { getRiskInfo, getSuggestedAction } from "@/lib/bonds";
import { formatCurrencyAr } from "@/lib/utils";
import type { Bond } from "@/lib/types";

interface DecisionCardProps {
  bond: Bond;
  onExecute?: (bond: Bond) => void;
}

export function DecisionCard({ bond, onExecute }: DecisionCardProps) {
  const risk = getRiskInfo(bond.clients?.risk_score ?? 0);
  const action = getSuggestedAction(bond);
  const buttonVariant =
    risk.level === "high" ? "danger" : risk.level === "medium" ? "warn" : "primary";

  return (
    <Card className="flex w-full flex-col justify-between gap-4 p-5 transition-all hover:border-slate-700/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col text-start min-w-0">
          <p className="truncate text-sm font-bold text-white">
            {bond.clients?.name || "—"}
          </p>
          <p className="truncate text-xs text-slate-400">
            سند رقم: {bond.bond_number}
          </p>
        </div>
        <RiskBadge score={risk.score} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-start">
          <p className="text-[11px] font-semibold text-slate-400 mb-1">سبب التوصية</p>
          <p className="text-xs text-slate-300 leading-relaxed">{buildReason(bond)}</p>
        </div>

        <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3 text-start">
          <p className="text-[11px] font-semibold text-emerald-400 mb-1">الإجراء الموصى به</p>
          <p className="text-xs text-white leading-relaxed font-medium">
            {action.label} — {buildActionDetail(bond)}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <span className="text-slate-400">قيمة المطالبة:</span>
          <span className="text-emerald-400 font-semibold tabular">
            {formatCurrencyAr(bond.amount)} ر.س
          </span>
        </div>
      </div>

      <Button
        variant={buttonVariant}
        size="md"
        className="w-full text-xs font-semibold h-10 shadow-sm"
        onClick={() => onExecute?.(bond)}
      >
        تنفيذ الإجراء
      </Button>
    </Card>
  );
}

function Section({
  title,
  children,
  dotColor,
  headColor = "text-[var(--color-fg-subtle)]",
  textClass = "text-[var(--color-fg-soft)]",
}: {
  title: string;
  children: React.ReactNode;
  dotColor: string;
  headColor?: string;
  textClass?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-[6px] text-start">
      <div className="flex w-full items-center justify-start gap-[6px]">
        <span className={`size-[6px] rounded-full ${dotColor}`} />
        <p className={`text-[11px] font-semibold ${headColor}`}>{title}</p>
      </div>
      <p className={`text-[12px] leading-relaxed ${textClass}`}>{children}</p>
    </div>
  );
}

function buildReason(bond: Bond): string {
  const days = bond.days_overdue ?? 0;
  if (days >= 20) {
    return `تأخّر ${days} يوماً عن الاستحقاق، ونمط تأخير متكرّر هذا الربع.`;
  }
  if (days > 0) {
    return `تأخّر ${days} يوماً عن الاستحقاق وقد لا يستجيب لرسائل التذكير العادية.`;
  }
  return "العميل يدفع عادةً بعد تذكير واحد. لم يصل أي تذكير لهذا الشهر.";
}

function buildActionDetail(bond: Bond): string {
  const risk = getRiskInfo(bond.clients?.risk_score ?? 0);
  if (risk.level === "high") {
    return "اتصال هاتفي اليوم قبل الساعة ٢ ظهراً + عرض جدولة دفعتين.";
  }
  if (risk.level === "medium") {
    return "إرسال رسالة واتساب رسمية صباح الثلاثاء (أعلى احتمال للرد).";
  }
  return "استمرار المتابعة الآلية حتى الاستحقاق.";
}
