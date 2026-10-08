import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type KpiTone = "success" | "danger" | "neutral";

const toneBadges: Record<KpiTone, { dot: string; caption: string }> = {
  success: {
    dot: "bg-emerald-400",
    caption: "text-emerald-400 font-medium",
  },
  danger: {
    dot: "bg-rose-400",
    caption: "text-rose-400 font-medium",
  },
  neutral: {
    dot: "bg-slate-400",
    caption: "text-slate-400",
  },
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
  const currentTone = toneBadges[tone];

  return (
    <Card className="flex flex-col justify-between p-5 min-h-[140px] transition-all hover:border-slate-700/80">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span
          className={cn("size-2 rounded-full", currentTone.dot)}
        />
      </div>
      <div className="flex items-baseline gap-2 my-2">
        <span className="tabular text-3xl font-bold tracking-tight text-white">
          {value}
        </span>
        {unit ? (
          <span className="text-xs font-semibold text-slate-400">
            {unit}
          </span>
        ) : null}
      </div>
      <p className={cn("text-xs truncate", currentTone.caption)}>
        {caption}
      </p>
    </Card>
  );
}
