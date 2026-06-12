import type {
  DecisionBrief,
  DecisionReadinessResult,
  EvidenceCoverageSummary,
} from "./decision";
import type {
  AIRecommendationResponse,
  CopilotTaskType,
  DashboardInsightFact,
} from "./recommendations";

export type DecisionHandoffAiMode = "llm" | "deterministic" | "disabled" | "fallback";

export type CopilotFallbackReason = NonNullable<
  AIRecommendationResponse["fallbackReason"]
>;

export type HandoffRepairAction = {
  title: string;
  rationale: string;
  priority: "high" | "medium" | "low";
  ownerHint: string;
};

export type DecisionHandoffSummary = {
  source: "deterministic" | "llm";
  fallbackReason?: CopilotFallbackReason;
  retryAfterSeconds?: number;
  readinessExplanation: string;
  repairActions: HandoffRepairAction[];
  handoffNarrative: string;
  caveats: string[];
  assumptions: string[];
};

export type DecisionHandoffCopilotContext = {
  taskType: Extract<CopilotTaskType, "decision_handoff_summary">;
  decisionBrief: DecisionBrief;
  decisionReadiness?: DecisionReadinessResult;
  evidenceCoverage?: EvidenceCoverageSummary;
  qualitySummary: string[];
  transformationSummary: string[];
  dashboardFacts?: DashboardInsightFact[];
  aiMode: DecisionHandoffAiMode;
  reviewNotice?: string;
  limitations?: string[];
};
