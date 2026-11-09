export type DecisionType = 'ALLOW' | 'REVIEW' | 'BLOCK';
export type CaseStatus = 'OPEN' | 'REVIEWING' | 'CLOSED';
export type RuleType = 'STATIC' | 'AGGREGATION';
export type RuleAction = 'SCORE' | 'BLOCK';
export type RuleStatus = 'ACTIVE' | 'INACTIVE';
export type ListType = 'BLACKLIST' | 'WATCHLIST';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type EntityType = 'MOBILE' | 'CARD_TOKEN' | 'EMAIL' | 'IP' | 'DEVICE' | 'VPA';

export interface ScreeningRequest {
  txnId: string;
  merchantId: string;
  amount: number;
  currency?: string;
  paymentMode?: string;
  payerMobile?: string;
  payerEmail?: string;
  cardToken?: string;
  cardBin?: string;
  cardLast4?: string;
  vpa?: string;
  ipAddress?: string;
  deviceId?: string;
}

export interface ScreeningResponse {
  txnId: string;
  decision: DecisionType;
  riskScore: number;
  triggeredRules: string[];
  caseGenerated: boolean;
  caseRef?: string | null;
  screeningMs: number;
}

export interface RiskAssessment {
  txnId: string;
  riskScore: number;
  decision: DecisionType;
  triggeredRules: string[];
  hardBlock?: boolean;
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
  extra?: string;
  [key: string]: any;
}

export interface FrmRule {
  ruleId: number;
  ruleCode: string;
  ruleName: string;
  ruleType: RuleType;
  entityScope: string;
  conditionJson: RuleCondition;
  riskScore: number;
  action: RuleAction;
  priority: number;
  status: RuleStatus;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionLog {
  txnId: string;
  merchantId: string;
  amount: number;
  currency: string;
  paymentMode?: string;
  payerMobile?: string;
  payerEmail?: string;
  cardToken?: string;
  cardBin?: string;
  cardLast4?: string;
  vpa?: string;
  ipAddress?: string;
  deviceId?: string;
  riskScore: number;
  decision: DecisionType;
  triggeredRules?: string[];
  screeningMs: number;
  receivedAt: Date;
}

export interface FraudCase {
  caseId: number;
  caseRef: string;
  txnId: string;
  merchantId?: string;
  riskScore: number;
  decision: DecisionType;
  triggeredRules?: string[];
  caseStatus: CaseStatus;
  assignedTo?: string | null;
  remarks?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RiskEntity {
  id: number;
  entityType: EntityType;
  entityValue: string;
  listType: ListType;
  riskLevel: RiskLevel;
  action: 'BLOCK' | 'MONITOR';
  source: string;
  caseRef?: string | null;
  remarks?: string | null;
  expiryDate?: Date | null;
  createdBy: string;
  createdAt: Date;
}

export interface AdminUser {
  userId: number;
  username: string;
  password?: string;
  fullName?: string;
  role: 'ADMIN' | 'REVIEWER' | 'VIEWER';
  status: string;
  createdAt: Date;
}

