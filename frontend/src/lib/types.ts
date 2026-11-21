export type BondStatus = "pending" | "reminded" | "overdue" | "settled";

export interface ClientSummary {
  id?: string;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  risk_score?: number | null;
  policy_tier?: "standard" | "vip" | "strict" | null;
  custom_grace_days?: number | null;
  preferred_installments?: number | null;
  max_escalation_level?: number | null;
  custom_notes?: string | null;
}

export interface Bond {
  id: string;
  bond_number: string;
  bond_type: string | null;
  issue_date: string;
  due_date: string | null;
  client_id: string | null;
  description: string | null;
  amount: number;
  status: BondStatus | string;
  days_overdue?: number | null;
  last_reminder_at?: string | null;
  created_at?: string | null;
  clients?: ClientSummary | null;
}

export interface ListBondsResponse {
  bonds: Bond[];
  count: number;
}

export interface OcrBondPayload {
  "رقم_السند": string;
  "تاريخ_الاصدار": string;
  "اسم_العميل": string;
  "المبلغ": string;
  "رقم_الهاتف"?: string;
  "ايميل_العميل"?: string;
  "وصف_سبب_الصرف"?: string;
}

export interface CreateBondResponse {
  success: boolean;
  bond_id: string;
  message: string;
}

export interface UploadBondResponse extends CreateBondResponse {
  ocr_data: OcrBondPayload;
}

export interface AgentRunResponse {
  success: boolean;
  reminders_sent: number;
  report: Record<string, unknown>;
  message: string;
}

export interface AgentLog {
  id: string;
  executed_at: string;
  bond_id: string | null;
  bond_number?: string | null;
  client_name?: string | null;
  action_type: string;
  details?: {
    to?: string;
    recipient?: string;
    email?: string;
    level?: number;
    label?: string;
    amount?: number;
    tone?: string;
    days_overdue?: number;
    message?: string;
    summary?: string;
    updated_count?: number;
    high_risk_count?: number;
    threshold?: number;
    [key: string]: unknown;
  };
  bonds?: {
    bond_number: string;
    amount: number;
    clients?: {
      name: string;
    };
  };
}

export interface AgentLogsResponse {
  success: boolean;
  logs: AgentLog[];
}


export interface HealthResponse {
  status: string;
  service: string;
}

export type RiskLevel = "high" | "medium" | "low";

export interface RiskInfo {
  level: RiskLevel;
  score: number;
  label: string;
}

export interface AggregatedClient {
  id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  risk_score: number;
  policy_tier?: "standard" | "vip" | "strict";
  custom_grace_days?: number;
  preferred_installments?: number | null;
  max_escalation_level?: number | null;
  custom_notes?: string | null;
  bonds_count: number;
  total_amount: number;
  outstanding_amount: number;
  overdue_count: number;
  last_bond_date: string | null;
}

export interface CollectionPolicy {
  id: string;
  company_name: string;
  friendly_reminder_days: number;
  official_followup_days: number;
  legal_warning_days: number;
  enable_installment_plans: boolean;
  default_installments_count: number;
  allow_auto_legal_notice: boolean;
  communication_tone: "balanced" | "friendly" | "firm";
  custom_prompt_notes: string;
  updated_at?: string;
}

