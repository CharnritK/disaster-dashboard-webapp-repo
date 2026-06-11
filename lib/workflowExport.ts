import type { Dataset } from "@/types/dataset";
import type {
  DecisionBrief,
  DecisionReadinessResult,
  EvidenceCoverageSummary,
} from "@/types/decision";
import type { JoinRecommendation } from "@/types/recommendations";
import type { QualityCheckResult } from "@/types/quality";
import type { TransformationStep } from "@/types/transformations";
import { readinessStatusLabel } from "./decisionContext";

export type DecisionHandoffAiMode = "llm" | "deterministic" | "disabled" | "fallback";

export type DecisionHandoffPacketInput = {
  generatedAt?: string;
  decisionBrief: DecisionBrief;
  evidenceCoverage: EvidenceCoverageSummary;
  decisionReadiness?: DecisionReadinessResult;
  datasets: Dataset[];
  selectedJoinRecommendations: JoinRecommendation[];
  qualityResults: QualityCheckResult[];
  transformationLog: TransformationStep[];
  aiMode: DecisionHandoffAiMode;
};

export function buildDecisionHandoffPacket(input: DecisionHandoffPacketInput) {
  const readiness = input.decisionReadiness;
  const isUnsafe = readiness?.status === "decision_unsafe";
  const missingEvidence = input.evidenceCoverage.items.filter(
    (item) => item.status === "missing",
  );
  const qualityIssues = input.qualityResults.filter((issue) => issue.status !== "pass");
  const limitations = [
    ...missingEvidence.map(
      (item) => `Missing ${item.evidenceNeed}: ${item.nextAction}`,
    ),
    ...(readiness?.caveats ?? []),
    ...(isUnsafe
      ? ["Outputs are review-only until blockers are corrected or explicitly accepted by a decision owner."]
      : []),
  ];

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    decisionContext: {
      useCaseId: input.decisionBrief.useCaseId,
      question: input.decisionBrief.decisionQuestion,
      intendedAction: input.decisionBrief.intendedAction,
      decisionMaker: input.decisionBrief.decisionMaker,
      geographyScope: input.decisionBrief.geographyScope,
      timeframe: input.decisionBrief.timeframe,
      requiredEvidence: input.decisionBrief.requiredEvidence,
    },
    evidenceCoverage: input.evidenceCoverage,
    decisionReadiness: readiness
      ? {
          status: readiness.status,
          label: readinessStatusLabel(readiness.status),
          summary: readiness.summary,
          caveats: readiness.caveats,
          blockerCount: readiness.blockerCount,
          reviewCount: readiness.reviewCount,
          requiredEvidenceCovered: readiness.requiredEvidenceCovered,
          requiredEvidenceMissing: readiness.requiredEvidenceMissing,
        }
      : undefined,
    datasetLineage: input.datasets.map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      originalFilename: dataset.originalFilename,
      sourceType: dataset.sourceType,
      fileType: dataset.fileType,
      uploadedAt: dataset.uploadedAt,
      rows: dataset.rowCount ?? dataset.data?.length ?? 0,
      columns: dataset.columnCount ?? dataset.columns?.length ?? 0,
      fields: dataset.columns ?? dataset.profile?.columns.map((column) => column.columnName) ?? [],
      inputHints: dataset.inputHints,
      formatAssessment: dataset.formatAssessment
        ? {
            status: dataset.formatAssessment.status,
            summary: dataset.formatAssessment.summary,
            issues: dataset.formatAssessment.issues,
            learningTips: dataset.formatAssessment.learningTips,
          }
        : undefined,
    })),
    joinReview: input.selectedJoinRecommendations.map((join) => ({
      id: join.id,
      sourceDatasetId: join.sourceDatasetId,
      targetDatasetId: join.targetDatasetId,
      sourceColumns: join.sourceColumns,
      targetColumns: join.targetColumns,
      combineType: join.joinType,
      confidenceScore: join.confidenceScore,
      estimatedMatchRate: join.estimatedMatchRate,
      rationale: join.rationale,
      risks: join.risks,
    })),
    qualitySummary: {
      issueCount: qualityIssues.length,
      highSeverityCount: qualityIssues.filter((issue) => issue.severity === "high").length,
      issues: qualityIssues.map((issue) => ({
        id: issue.id,
        status: issue.status,
        severity: issue.severity,
        checkType: issue.checkType,
        description: issue.description,
        evidenceNeed: issue.evidenceNeed,
        caveat: issue.caveat,
        suggestedAction: issue.suggestedAction,
      })),
    },
    transformations: input.transformationLog,
    aiAssistance: {
      mode: input.aiMode,
      summary: aiModeSummary(input.aiMode),
    },
    limitations: Array.from(new Set(limitations)),
    reviewNotice: isUnsafe
      ? "Dashboard generation is allowed for review, not for automatic action."
      : "Review evidence coverage, quality caveats, joins, and transformations before action.",
  };
}

function aiModeSummary(mode: DecisionHandoffAiMode) {
  if (mode === "llm") {
    return "AI recommendations were used, with deterministic validation and caveats retained.";
  }
  if (mode === "disabled") {
    return "AI was off. Deterministic profiling, evidence coverage, readiness checks, and dashboard recommendations remained available.";
  }
  if (mode === "fallback") {
    return "AI recommendations were unavailable. The app used deterministic recommendations. Review joins and caveats before action.";
  }
  return "Deterministic recommendations were used without external AI assistance.";
}
