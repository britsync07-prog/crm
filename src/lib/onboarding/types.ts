export type OnboardingStatus =
  | "INITIALISING"
  | "WAITING_INTERNAL_INFORMATION"
  | "AI_PLANNING"
  | "WAITING_HUMAN_APPROVAL"
  | "WAITING_CLIENT"
  | "IN_PROGRESS"
  | "AT_RISK"
  | "BLOCKED"
  | "READY_FOR_ACTIVATION"
  | "COMPLETED"
  | "CANCELLED";

export type OnboardingHealth = "HEALTHY" | "AT_RISK" | "BLOCKED";

export type AIActionType =
  | "GENERATE_DOCUMENT"
  | "CREATE_INVOICE"
  | "REQUEST_SIGNATURE"
  | "GENERATE_COMMUNICATION"
  | "CREATE_TASK"
  | "SCHEDULE_FOLLOWUP"
  | "UPDATE_STATUS"
  | "FLAG_EXCEPTION"
  | "GENERATE_SOP"
  | "GENERATE_PROJECT_BRIEF"
  | "ACTIVATE_CLIENT";

export type AIActionRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AIActionStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTED"
  | "FAILED";

export type DocumentType =
  | "WELCOME_LETTER"
  | "NDA"
  | "SERVICE_AGREEMENT"
  | "TERMS"
  | "PRIVACY_NOTICE"
  | "DPA"
  | "INVOICE"
  | "PROJECT_BRIEF"
  | "IMPLEMENTATION_SOP"
  | "REQUIREMENTS_DOCUMENT"
  | "KICKOFF_DOCUMENT"
  | "PAYMENT_REMINDER"
  | "OTHER";

export type DocumentStatus =
  | "DRAFT"
  | "AI_GENERATED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "SENT"
  | "VIEWED"
  | "SIGNED"
  | "REJECTED"
  | "SUPERSEDED"
  | "EXPIRED";

export type SignatureStatus =
  | "NOT_REQUIRED"
  | "DRAFT"
  | "READY"
  | "SENT"
  | "VIEWED"
  | "PARTIALLY_SIGNED"
  | "SIGNED"
  | "DECLINED"
  | "EXPIRED";

export interface CommercialDetails {
  price?: number;
  currency?: string;
  duration?: string;
  paymentTerms?: string;
  advancePaymentPercent?: number;
  startDate?: string;
  accountManager?: string;
  specialConditions?: string;
  notes?: string;
}

export interface ContextAnalysisResult {
  known: Record<string, any>;
  missing: string[];
  verification: string[];
  optional: string[];
  summary: string;
}

export interface InternalQuestion {
  id: string;
  key: string;
  label: string;
  type: "currency" | "text" | "date" | "dropdown" | "radio" | "multiselect" | "textarea";
  required: boolean;
  defaultValue?: any;
  options?: string[];
  helpText?: string;
}

export interface ProgressiveQuestion {
  id: string;
  key: string;
  label: string;
  subtitle?: string;
  type: "text" | "choice" | "boolean" | "file" | "verification";
  options?: string[];
  condition?: {
    dependsOnKey: string;
    equals: any;
  };
  required: boolean;
  category?: "general" | "technical" | "compliance" | "kickoff";
}

export interface HealthCheckResult {
  healthStatus: OnboardingHealth;
  healthReason: string;
  exceptions: Array<{
    type: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    description: string;
    recommendedAction: string;
  }>;
  recommendedNextAction: string;
  progressPercentage: number;
}

export interface OnboardingExceptionRecord {
  id: string;
  onboardingId: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  recommendedAction: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "DISMISSED";
  assignedTo?: string | null;
  detectedAt: Date;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
}

export interface AIPermissionItem {
  id: string;
  actionKey: string;
  actionName: string;
  aiAllowed: boolean;
  humanApprovalRequired: boolean;
  description?: string | null;
}

