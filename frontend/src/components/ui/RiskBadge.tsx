import { Badge, type BadgeTone } from "./Badge";
import { getRiskInfo } from "@/lib/bonds";
import { formatNumberAr } from "@/lib/utils";

interface RiskBadgeProps {
  score: number | null | undefined;
  pill?: boolean;
}

export function RiskBadge({ score, pill = false }: RiskBadgeProps) {
  const info = getRiskInfo(score);
  const tone: BadgeTone =
    info.level === "high" ? "high" : info.level === "medium" ? "medium" : "low";
  return (
    <Badge tone={tone} pill={pill}>
      <span className="tabular">{formatNumberAr(info.score)}٪ {info.label}</span>
    </Badge>
  );
}
