import type { WorkflowStep } from "@/lib/config";
import type { DecisionReadinessStatus } from "@/types/decision";

export type RepairActionIssueType =
  | "missing_evidence"
  | "ambiguous_mapping"
  | "ai_fallback"
  | "quality_issue";

export type RepairActionSeverity = "info" | "review" | "blocker";
export type RepairActionEffort = "seconds" | "minutes" | "needs_owner";
export type SafeAutomationLevel =
  | "suggest_only"
  | "apply_after_review"
  | "not_automatable";

export type RepairAction = {
  id: string;
  issueType: RepairActionIssueType;
  severity: RepairActionSeverity;
  title: string;
  whyItMatters: string;
  easiestFix: string;
  alternatives: string[];
  appCanHelpWith: string[];
  humanMustReview: string;
  estimatedEffort: RepairActionEffort;
  safeAutomationLevel: SafeAutomationLevel;
  evidenceNeed?: string;
  fieldNames?: string[];
};

export type NextBestCoachAction = {
  id: string;
  issueType: RepairActionIssueType;
  title: string;
  rationale: string;
  action: string;
  mode: "triage" | "repair" | "explain" | "proceed" | "handoff";
  severity: RepairActionSeverity;
  estimatedEffort: RepairActionEffort;
  appCanHelpWith: string[];
  humanMustReview: string;
  sourceRepairActionId?: string;
};

export type NextBestCoachInput = {
  step: WorkflowStep;
  readinessStatus?: DecisionReadinessStatus;
  repairActions?: RepairAction[];
};
