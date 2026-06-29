import type { FormFamily, FormIntakeSourceKind } from "@/types/formIntake";

export type FormRegistryReviewStatus =
  | "archived"
  | "draft"
  | "review_needed"
  | "reviewed";

export type FormRegistryVisibility = "private" | "reviewed";
export type MappingConfidenceBucket = "high" | "low" | "medium";
export type MappingReviewStatus = "accepted" | "needs_review" | "rejected";

export type FormRegistryFieldSummary = {
  fieldName: string;
  fieldType?: string;
  label?: string;
  required?: boolean;
  evidenceNeed?: string;
  confidenceBucket?: MappingConfidenceBucket;
  status?: "ready" | "review_needed";
};

export type FormRegistryEvidenceMapping = {
  evidenceNeed: string;
  fieldName: string;
  confidenceBucket: MappingConfidenceBucket;
  reviewStatus: MappingReviewStatus;
  rationale?: string;
};

export type FormRegistryDraft = {
  title: string;
  description?: string | null;
  formFamily: FormFamily;
  sourceKind: FormIntakeSourceKind;
  schemaFingerprint: string;
  fieldCount: number;
  requiredFieldCount: number;
  fieldSummaries: FormRegistryFieldSummary[];
  evidenceMappings: FormRegistryEvidenceMapping[];
  caveats: string[];
};
