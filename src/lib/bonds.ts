import type {
  AggregatedClient,
  Bond,
  BondStatus,
  RiskInfo,
  RiskLevel,
} from "./types";
import { daysBetween } from "./utils";

export const STATUS_LABELS: Record<BondStatus, string> = {
  pending: "قيد المتابعة",
  reminded: "تمّ التذكير",
  overdue: "متأخر",
  settled: "مسدّد",
};

export const STATUS_FILTER_OPTIONS: Array<{
  value: BondStatus | "all";
  label: string;
}> = [
  { value: "all", label: "كل الحالات" },
  { value: "pending", label: "قيد المتابعة" },
  { value: "reminded", label: "تمّ التذكير" },
  { value: "overdue", label: "متأخر" },
  { value: "settled", label: "مسدّد" },
];

export function getRiskLevel(score: number | null | undefined): RiskLevel {
  const s = Number(score) || 0;
  if (s >= 70) return "high";
  if (s >= 40) return "medium";
  return "low";
}

export function getRiskInfo(score: number | null | undefined): RiskInfo {
  const s = Math.round(Number(score) || 0);
  const level = getRiskLevel(s);
  const label = level === "high" ? "عالٍ" : level === "medium" ? "متوسط" : "منخفض";
  return { level, score: s, label };
}

export function getDaysOverdue(bond: Bond): number {
  if (typeof bond.days_overdue === "number" && bond.days_overdue > 0) {
    return bond.days_overdue;
  }
  if (bond.due_date) {
    const diff = daysBetween(bond.due_date, new Date());
    return diff > 0 ? diff : 0;
  }
  if (bond.issue_date) {
    const diff = daysBetween(bond.issue_date, new Date());
    return diff > 30 ? diff - 30 : 0;
  }
  return 0;
}

export function isSettled(bond: Bond): boolean {
  return bond.status === "settled";
}

export function isOverdue(bond: Bond): boolean {
  return bond.status === "overdue" || getDaysOverdue(bond) > 0;
}

export interface SuggestedAction {
  label: string;
  tone: RiskLevel;
}

export function getSuggestedAction(bond: Bond): SuggestedAction {
  const risk = getRiskInfo(bond.clients?.risk_score ?? 0);
  const daysOverdue = getDaysOverdue(bond);

  if (isSettled(bond)) {
    return { label: "متابعة آلية فقط", tone: "low" };
  }

  if (risk.level === "high" || daysOverdue >= 20) {
    return { label: "تصعيد للإدارة", tone: "high" };
  }

  if (daysOverdue >= 7 || bond.status === "overdue") {
    return { label: "اتصال هاتفي اليوم", tone: "high" };
  }

  if (risk.level === "medium" || bond.status === "reminded") {
    return { label: "تذكير عبر واتساب", tone: "medium" };
  }

  return { label: "متابعة آلية فقط", tone: "low" };
}

export function getStatusBadgeText(bond: Bond): string {
  const daysOverdue = getDaysOverdue(bond);
  if (isSettled(bond)) return "مسدّد";
  if (daysOverdue > 0) return `متأخر ${daysOverdue} يوم`;
  if (bond.status === "reminded") return "تمّ التذكير";
  if (bond.due_date) {
    const daysUntilDue = -daysBetween(bond.due_date, new Date());
    if (daysUntilDue > 0 && daysUntilDue <= 7) return `يستحق خلال ${daysUntilDue} أيام`;
  }
  return "ضمن الموعد";
}

export interface KpiSummary {
  totalReceivables: number;
  collectedThisMonth: number;
  overdueAmount: number;
  overdueCount: number;
  totalClients: number;
  avgCycleDays: number;
}

export function summarizeBonds(bonds: Bond[]): KpiSummary {
  const totalReceivables = bonds
    .filter((b) => !isSettled(b))
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const collectedThisMonth = bonds
    .filter(
      (b) => isSettled(b) && b.created_at && new Date(b.created_at) >= startOfMonth
    )
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const overdueBonds = bonds.filter((b) => !isSettled(b) && getDaysOverdue(b) > 0);
  const overdueAmount = overdueBonds.reduce((s, b) => s + Number(b.amount || 0), 0);
  const overdueClients = new Set(
    overdueBonds.map((b) => b.client_id).filter((id): id is string => Boolean(id))
  );

  const allClientIds = new Set(
    bonds.map((b) => b.client_id).filter((id): id is string => Boolean(id))
  );

  const cycles = bonds
    .filter((b) => isSettled(b) && b.issue_date)
    .map((b) => daysBetween(b.issue_date, b.created_at || new Date().toISOString()));
  const avgCycleDays =
    cycles.length > 0
      ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
      : 0;

  return {
    totalReceivables,
    collectedThisMonth,
    overdueAmount,
    overdueCount: overdueClients.size,
    totalClients: allClientIds.size,
    avgCycleDays,
  };
}

export function aggregateClients(bonds: Bond[]): AggregatedClient[] {
  const map = new Map<string, AggregatedClient>();
  for (const bond of bonds) {
    const id = bond.client_id || bond.clients?.name || "unknown";
    const name = bond.clients?.name || "—";
    const existing = map.get(id) ?? {
      id: bond.client_id || null,
      name,
      email: bond.clients?.email ?? null,
      phone: bond.clients?.phone ?? null,
      risk_score: Number(bond.clients?.risk_score ?? 0),
      bonds_count: 0,
      total_amount: 0,
      outstanding_amount: 0,
      overdue_count: 0,
      last_bond_date: null,
    };
    existing.bonds_count += 1;
    existing.total_amount += Number(bond.amount || 0);
    if (!isSettled(bond)) {
      existing.outstanding_amount += Number(bond.amount || 0);
    }
    if (getDaysOverdue(bond) > 0 && !isSettled(bond)) {
      existing.overdue_count += 1;
    }
    if (bond.issue_date) {
      if (!existing.last_bond_date || bond.issue_date > existing.last_bond_date) {
        existing.last_bond_date = bond.issue_date;
      }
    }
    if (bond.clients?.risk_score) {
      existing.risk_score = Math.max(
        existing.risk_score,
        Number(bond.clients.risk_score)
      );
    }
    map.set(id, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.risk_score - a.risk_score);
}

export function getPriorityBonds(bonds: Bond[], limit = 4): Bond[] {
  return [...bonds]
    .filter((b) => !isSettled(b))
    .sort((a, b) => {
      const ra = Number(a.clients?.risk_score ?? 0) + getDaysOverdue(a) * 0.5;
      const rb = Number(b.clients?.risk_score ?? 0) + getDaysOverdue(b) * 0.5;
      return rb - ra;
    })
    .slice(0, limit);
}
