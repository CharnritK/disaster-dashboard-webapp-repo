export type UseCaseTemplateId =
  | "response_prioritization"
  | "service_gap_monitoring"
  | "preparedness_risk_screening";

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
export type SourceConfidenceLevel = "high" | "medium" | "low" | "unknown";
export type ReviewActionSafetyState =
  | "ready_for_review"
  | "needs_review"
  | "blocked_for_action";

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

export type EvidenceReadinessControlTower = {
  deterministicAuthority: true;
  status: DecisionReadinessStatus;
  actionSafetyState: ReviewActionSafetyState;
  evidenceCovered: string[];
  ambiguousEvidence: string[];
  missingEvidence: string[];
  blockers: string[];
  nextCollectionAsks: string[];
  sourceConfidence: SourceConfidenceLevel;
  sourceConfidenceRationale: string;
  reviewState: string;
};

export type DecisionPlaybook = {
  id: UseCaseTemplateId;
  title: string;
  decisionQuestion: string;
  requiredEvidence: string[];
  knownCaveats: string[];
  suggestedFields: SuggestedCollectionField[];
  sampleScenario: string;
  sourceFreshnessExpectations: string[];
  handoffLanguage: string;
  nextCollectionAsks: string[];
};

export type AiGuardrailExplanation = {
  advisoryOnly: true;
  aiRecommendationStatus: "not_requested" | "returned" | "fallback";
  deterministicValidation: "accepted" | "partially_accepted" | "rejected";
  deterministicAuthorityStatement: string;
  fallbackReason?: string;
  unsupportedSuggestions: string[];
  validationCaveats: string[];
};

export type SafeBetaLearningSignal = {
  useCaseId: UseCaseTemplateId;
  readinessStatus: DecisionReadinessStatus;
  blockerCount: number;
  ambiguousEvidenceCount: number;
  missingEvidenceCount: number;
  fallbackReason?: string;
  exportType?: "csv" | "handoff_log" | "pdf_report" | "png" | "project_kit";
  feedbackTags: string[];
  templateOrPlaybookSelected: UseCaseTemplateId;
  metadataOnly: true;
};
