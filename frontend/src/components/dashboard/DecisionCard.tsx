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
    <Card variant="soft" className="flex w-full flex-col gap-[14px] p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-[2px] text-start min-w-0">
          <p className="truncate text-[14px] font-bold text-[var(--color-fg)]">
            {bond.clients?.name || "—"}
          </p>
          <p className="truncate text-[10px] text-[var(--color-fg-faint)]">
            عميل آجل · {bond.bond_number}
          </p>
        </div>
        <RiskBadge score={risk.score} />
      </div>

      <Section
        title="السبب"
        dotColor="bg-[var(--color-fg-subtle)]"
        textClass="text-[var(--color-fg-soft)]"
      >
        {buildReason(bond)}
      </Section>

      <Card variant="solid" className="flex flex-col gap-[6px] bg-[var(--color-bg-action)] p-[12px]">
        <Section
          title="الإجراء المقترح"
          dotColor="bg-[var(--color-success)]"
          textClass="text-white"
          headColor="text-[var(--color-success)]"
        >
          {action.label} — {buildActionDetail(bond)}
        </Section>
      </Card>

      <Section
        title="الأثر المتوقّع"
        dotColor="bg-[var(--color-success)]"
        headColor="text-[var(--color-success)]"
        textClass="text-[var(--color-success-soft)]"
      >
        متوقّع تحسين المركز بقيمة {formatCurrencyAr(bond.amount)} ر.س.
      </Section>

      <Button
        variant={buttonVariant}
        size="lg"
        className="h-[64px] w-full"
        onClick={() => onExecute?.(bond)}
      >
        تنفيذ الإجراء الآن
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
