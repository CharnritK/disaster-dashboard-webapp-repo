export type FuzzyReviewOutcome =
  | "exact_match"
  | "near_match"
  | "conflict"
  | "no_match";

export type FuzzyReviewStatus = "review_required" | "ready" | "no_match";

export type FuzzyReviewFieldMetadata = {
  fieldName: string;
  label?: string;
};

export type FuzzyReviewInput = {
  sourceFields: unknown[];
  targetFields: unknown[];
};

export type FuzzyReviewUnsafeMetadataIssue = {
  path: string;
  reason: string;
};

export type FuzzyReviewCandidate = {
  id: string;
  outcome: FuzzyReviewOutcome;
  confidence: number;
  rationale: string;
  sourceFieldName: string;
  sourceLabel?: string;
  targetFieldName: string | null;
  targetLabel?: string;
  conflictingTargetFieldNames?: string[];
  status: FuzzyReviewStatus;
};
