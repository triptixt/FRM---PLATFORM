export type DecisionType = 'ALLOW' | 'REVIEW' | 'BLOCK';
export type CaseStatus = 'OPEN' | 'REVIEWING' | 'CLOSED';
export type RuleType = 'STATIC' | 'AGGREGATION';
export type RuleAction = 'SCORE' | 'BLOCK';
export type RuleStatus = 'ACTIVE' | 'INACTIVE';
export type ListType = 'BLACKLIST' | 'WATCHLIST';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type EntityType = 'MOBILE' | 'CARD_TOKEN' | 'EMAIL' | 'IP' | 'DEVICE' | 'VPA';
export type PaymentMode = 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'BNPL' | 'EMI';

export interface User {
  username: string;
  role: string;
  token?: string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface DashboardSummary {
  totalTransactions: number;
  allowed: number;
  reviewed: number;
  blocked: number;
  openCases: number;
  reviewingCases?: number;
  closedCases: number;
  blockRate?: string;
}

export interface RuleCondition {
  entity?: string;
  metric?: 'COUNT' | 'SUM' | 'DISTINCT_COUNT' | string;
  field?: string;
  window?: string;
  threshold?: number | string;
  operator?: string;
  value?: any;
  paymentModeIn?: string;
  entityType?: string;
  [key: string]: any;
}

export interface Rule {
  ruleId: number;
  ruleCode: string;
  ruleName: string;
  ruleType: RuleType;
  entityScope: string;
  priority: number;
  riskScore: number;
  action: RuleAction;
  status: RuleStatus;
  conditionJson: RuleCondition | string;
  version: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  txnId: string;
  merchantId: string;
  amount: number;
  currency?: string;
  paymentMode?: PaymentMode | string;
  payerMobile?: string;
  payerEmail?: string;
  ipAddress?: string;
  deviceId?: string;
  cardToken?: string;
  cardBin?: string;
  vpa?: string;
  riskScore: number;
  decision: DecisionType;
  triggeredRules?: string[];
  caseGenerated?: boolean;
  caseRef?: string;
  screeningMs?: number;
  receivedAt: string;
}

export interface FraudCase {
  caseId: number;
  caseRef: string;
  txnId: string;
  merchantId: string;
  riskScore: number;
  decision: DecisionType;
  caseStatus: CaseStatus;
  assignedTo?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseAuditLog {
  id: number;
  case_id: number;
  case_ref: string;
  changed_by: string;
  old_status?: string | null;
  new_status: string;
  assigned_to?: string | null;
  remarks?: string | null;
  changed_at: string;
}

export interface BlacklistEntry {
  id: number;
  entity_type: EntityType;
  entity_value: string;
  list_type: ListType;
  risk_level: RiskLevel;
  action: 'BLOCK' | 'MONITOR';
  source: string;
  case_ref?: string | null;
  remarks?: string | null;
  expiry_date?: string | null;
  created_by: string;
  created_at: string;
}

export interface BlacklistStat {
  entity_type: string;
  list_type: string;
  count: number | string;
}

export interface ScreeningRequest {
  txnId: string;
  merchantId: string;
  amount: number;
  currency?: string;
  paymentMode: PaymentMode | string;
  payerMobile?: string;
  payerEmail?: string;
  vpa?: string;
  ipAddress?: string;
  deviceId?: string;
  cardToken?: string;
  cardBin?: string;
}

export interface ScreeningResultData {
  txnId: string;
  decision: DecisionType;
  riskScore: number;
  triggeredRules: string[];
  caseGenerated: boolean;
  caseRef?: string | null;
  screeningMs: number;
}

