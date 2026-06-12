export type UseCaseTemplateId = "response_prioritization";

export type UseCaseTemplate = {
  id: UseCaseTemplateId;
  title: string;
  description: string;
  requiredEvidence: string[];
};

export type DecisionBrief = {
  useCaseId: UseCaseTemplateId;
  decisionQuestion: string;
  intendedAction: string;
  decisionMaker: string;
  geographyScope: string;
  timeframe: string;
  requiredEvidence: string[];
};

export type CollectionFieldType =
  | "text"
  | "date"
  | "integer"
  | "number"
  | "percent";

export type SuggestedCollectionField = {
  name: string;
  label: string;
  type: CollectionFieldType;
  required: boolean;
  evidenceNeed: string;
  description: string;
  example: string;
  caveat?: string;
};

export type SuggestedDataCollectionTemplate = {
  title: string;
  decisionQuestion: string;
  intendedAction: string;
  decisionMaker: string;
  geographyScope: string;
  timeframe: string;
  fields: SuggestedCollectionField[];
};

export type DecisionReadinessStatus =
  | "ready"
  | "review_needed"
  | "decision_unsafe";

export type DecisionReadinessResult = {
  status: DecisionReadinessStatus;
  title: string;
  summary: string;
  caveats: string[];
  blockerCount: number;
  reviewCount: number;
  requiredEvidenceCovered: string[];
  requiredEvidenceMissing: string[];
};

export type EvidenceCoverageStatus = "covered" | "ambiguous" | "missing";

export type EvidenceCoverageCandidate = {
  datasetId: string;
  datasetName: string;
  columnName: string;
  inferredType: string;
  missingPercentage: number;
  confidence: number;
  rationale: string;
};

export type EvidenceCoverageItem = {
  evidenceNeed: string;
  status: EvidenceCoverageStatus;
  candidates: EvidenceCoverageCandidate[];
  caveat: string;
  nextAction: string;
};

export type EvidenceCoverageSummary = {
  coveredCount: number;
  ambiguousCount: number;
  missingCount: number;
  items: EvidenceCoverageItem[];
};
