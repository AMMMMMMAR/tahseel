import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type KpiTone = "success" | "danger" | "neutral";

const dotClasses: Record<KpiTone, string> = {
  success: "bg-[var(--color-success)]",
  danger: "bg-[var(--color-danger)]",
  neutral: "bg-white",
};

const captionClasses: Record<KpiTone, string> = {
  success: "text-[var(--color-success)]",
  danger: "text-[var(--color-danger-strong)]",
  neutral: "text-[var(--color-fg-subtle)]",
};

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  caption: string;
  tone?: KpiTone;
}

export function KpiCard({
  label,
  value,
  unit,
  caption,
  tone = "neutral",
}: KpiCardProps) {
  return (
    <Card className="flex h-[132px] w-full flex-col gap-[10px] overflow-clip px-[18px] pt-[10px] pb-[18px]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] text-[var(--color-fg-subtle)]">{label}</p>
        <span
          className={cn("size-[8px] shrink-0 rounded-full", dotClasses[tone])}
        />
      </div>
      <div className="flex items-baseline justify-start gap-[8px]">
        <span className="tabular text-[28px] leading-none font-bold text-[var(--color-fg)]">
          {value}
        </span>
        {unit ? (
          <span className="text-[13px] text-[var(--color-fg-subtle)]">
            {unit}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-auto text-start text-[11px] font-medium",
          captionClasses[tone]
        )}
      >
        {caption}
      </p>
    </Card>
  );
}
