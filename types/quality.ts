export type QualityCheckResult = {
  id: string;
  checkType: string;
  status: "pass" | "warning" | "fail";
  severity: "info" | "low" | "medium" | "high";
  description: string;
  affectedColumns?: string[];
  affectedRowCount?: number;
  suggestedAction?: string;
  decisionArea?: string;
  evidenceNeed?: string;
  caveat?: string;
};
