import { Badge, type BadgeTone } from "./Badge";
import type { Bond } from "@/lib/types";
import { getDaysOverdue, getStatusBadgeText, isSettled } from "@/lib/bonds";

interface StatusBadgeProps {
  bond: Bond;
}

export function StatusBadge({ bond }: StatusBadgeProps) {
  const text = getStatusBadgeText(bond);
  let tone: BadgeTone = "low";
  if (isSettled(bond)) tone = "success";
  else if (getDaysOverdue(bond) > 0) tone = "high";
  else if (text.startsWith("يستحق")) tone = "medium";
  else if (bond.status === "reminded") tone = "medium";
  return <Badge tone={tone}>{text}</Badge>;
}
