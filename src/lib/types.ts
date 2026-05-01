export type BondStatus = "pending" | "reminded" | "overdue" | "settled";

export interface ClientSummary {
  id?: string;
  name: string | null;
  email?: string | null;
  phone?: string | null;
  risk_score?: number | null;
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
  report: Record<string, any>;
  message: string;
}

export interface AgentLog {
  id: string;
  executed_at: string;
  bond_id: string;
  action_type: string;
  details: {
    to: string;
    tone: string;
    days_overdue: number;
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
  bonds_count: number;
  total_amount: number;
  outstanding_amount: number;
  overdue_count: number;
  last_bond_date: string | null;
}
