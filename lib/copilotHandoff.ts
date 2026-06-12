import type {
  DecisionHandoffAiMode,
  DecisionHandoffCopilotContext,
  DecisionHandoffSummary,
  HandoffRepairAction,
} from "@/types/copilot";
import type {
  DecisionBrief,
  DecisionReadinessResult,
  DecisionReadinessStatus,
  EvidenceCoverageSummary,
  EvidenceCoverageStatus,
} from "@/types/decision";
import type { DashboardInsightFact } from "@/types/recommendations";
import type { WorkflowContextLimits } from "./recommendationSchema";

type ParseResult =
  | DecisionHandoffCopilotContext
  | { error: string };

const DEFAULT_STRING_LIMIT = 500;
const MAX_REPAIR_ACTIONS = 5;

export function parseDecisionHandoffCopilotContext(
  input: unknown,
  limits: Pick<
    WorkflowContextLimits,
    "maxStringLength" | "maxDashboardFacts" | "maxSummaryItems"
  >,
): ParseResult {
  if (!isRecord(input)) return { error: "Request body must be a JSON object." };
  if (containsRawRowPayload(input)) {
    return { error: "Copilot handoff requests cannot include raw row data." };
  }
  if (input.taskType !== "decision_handoff_summary") {
    return { error: "Unsupported copilot task type." };
  }
  const decisionBrief = parseDecisionBrief(input.decisionBrief, limits.maxStringLength);
  if (!decisionBrief) return { error: "decisionBrief is required." };

  return {
    taskType: "decision_handoff_summary",
    decisionBrief,
    decisionReadiness: parseDecisionReadiness(
      input.decisionReadiness,
      limits.maxStringLength,
    ),
    evidenceCoverage: parseEvidenceCoverage(
      input.evidenceCoverage,
      limits.maxStringLength,
    ),
    qualitySummary: stringArray(input.qualitySummary, limits.maxStringLength)
      .slice(0, limits.maxSummaryItems),
    transformationSummary: stringArray(
      input.transformationSummary,
      limits.maxStringLength,
    ).slice(0, limits.maxSummaryItems),
    dashboardFacts: Array.isArray(input.dashboardFacts)
      ? input.dashboardFacts
          .map((fact) => parseDashboardFact(fact, limits.maxStringLength))
          .filter((fact): fact is DashboardInsightFact => Boolean(fact))
          .slice(0, limits.maxDashboardFacts)
      : undefined,
    aiMode: parseAiMode(input.aiMode),
    reviewNotice: optionalString(input.reviewNotice, limits.maxStringLength),
    limitations: stringArray(input.limitations, limits.maxStringLength)
      .slice(0, limits.maxSummaryItems),
  };
}

export function buildDeterministicDecisionHandoffSummary(
  context: DecisionHandoffCopilotContext,
): DecisionHandoffSummary {
  const readiness = context.decisionReadiness;
  const status = readiness?.status ?? "review_needed";
  const isUnsafe = status === "decision_unsafe";
  const missingEvidence =
    context.evidenceCoverage?.items
      .filter((item) => item.status === "missing")
      .map((item) => `${item.evidenceNeed}: ${item.nextAction}`) ?? [];
  const caveats = uniqueStrings([
    ...(readiness?.caveats ?? []),
    ...(context.limitations ?? []),
    ...missingEvidence,
    ...(isUnsafe
      ? [
          "Outputs are review-only until blockers are corrected or explicitly accepted by a decision owner.",
        ]
      : []),
  ]).slice(0, 8);
  const repairActions = repairActionsForContext(context, caveats);

  return {
    source: "deterministic",
    readinessExplanation: readiness
      ? `${readiness.status.replaceAll("_", " ")}: ${readiness.summary}`
      : "Review needed: Complete validation before treating this export as decision-ready.",
    repairActions,
    handoffNarrative: handoffNarrativeForContext(context, caveats),
    caveats,
    assumptions: [
      "This summary is based on derived readiness, quality, transformation, and dashboard-fact summaries.",
      "No raw uploaded rows were sent to the copilot route.",
      "Deterministic readiness remains authoritative for action safety.",
    ],
  };
}

export function sanitizeDecisionHandoffSummary(
  input: unknown,
  fallback: DecisionHandoffSummary,
): DecisionHandoffSummary {
  if (!isRecord(input)) return fallback;
  const fallbackNeedsReviewOnly = /review-only/i.test(fallback.handoffNarrative);
  const modelNarrative = stringOr(
    input.handoffNarrative,
    fallback.handoffNarrative,
  );
  const handoffNarrative =
    fallbackNeedsReviewOnly && !/review-only/i.test(modelNarrative)
      ? `${modelNarrative} ${reviewOnlySentence(fallback)}`
      : modelNarrative;

  return {
    source: "llm",
    readinessExplanation: stringOr(
      input.readinessExplanation,
      fallback.readinessExplanation,
    ),
    repairActions: Array.isArray(input.repairActions)
      ? mergeRepairActions(
          input.repairActions
            .map(parseRepairAction)
            .filter((action): action is HandoffRepairAction => Boolean(action)),
          fallback.repairActions,
        )
      : fallback.repairActions,
    handoffNarrative,
    caveats: uniqueStrings([
      ...stringArray(input.caveats).slice(0, 8),
      ...fallback.caveats,
    ]).slice(0, 8),
    assumptions: uniqueStrings([
      ...stringArray(input.assumptions).slice(0, 8),
      ...fallback.assumptions,
    ]).slice(0, 8),
  };
}

function repairActionsForContext(
  context: DecisionHandoffCopilotContext,
  caveats: string[],
): HandoffRepairAction[] {
  const missingEvidenceActions =
    context.evidenceCoverage?.items
      .filter((item) => item.status === "missing")
      .map((item): HandoffRepairAction => ({
        title: `Add ${item.evidenceNeed.toLowerCase()} evidence`,
        rationale: item.nextAction,
        priority: "high",
        ownerHint: context.decisionBrief.decisionMaker,
      })) ?? [];
  const qualityActions = context.qualitySummary
    .filter((item) => /(fail|high|unsafe|missing|invalid|blocker)/i.test(item))
    .slice(0, MAX_REPAIR_ACTIONS)
    .map((item, index): HandoffRepairAction => ({
      title: `Review quality issue ${index + 1}`,
      rationale: item,
      priority: /high|fail|unsafe|blocker/i.test(item) ? "high" : "medium",
      ownerHint: "Data or assessment owner",
    }));
  const caveatActions = caveats
    .slice(0, MAX_REPAIR_ACTIONS)
    .map((caveat, index): HandoffRepairAction => ({
      title: `Resolve caveat ${index + 1}`,
      rationale: caveat,
      priority: /review-only|unsafe|missing|blocker/i.test(caveat)
        ? "high"
        : "medium",
      ownerHint: context.decisionBrief.decisionMaker,
    }));

  const actions = mergeRepairActions(
    [...missingEvidenceActions, ...qualityActions],
    caveatActions,
  );
  return actions.length > 0
    ? actions
    : [
        {
          title: "Review dashboard handoff",
          rationale:
            "Confirm evidence coverage, quality checks, joins, and transformation assumptions before sharing.",
          priority: "low",
          ownerHint: context.decisionBrief.decisionMaker,
        },
      ];
}

function handoffNarrativeForContext(
  context: DecisionHandoffCopilotContext,
  caveats: string[],
) {
  const readiness = context.decisionReadiness;
  const status = readiness?.status ?? "review_needed";
  const reviewOnly = status === "decision_unsafe"
    ? " This export is review-only and not safe for automatic action until blockers are resolved or accepted by the decision owner."
    : "";
  const caveatSentence = caveats.length
    ? ` Key caveats: ${caveats.slice(0, 3).join(" ")}`
    : "";
  return [
    `Decision handoff for ${context.decisionBrief.decisionMaker}: ${context.decisionBrief.decisionQuestion}`,
    readiness?.summary ?? "Readiness needs review before operational use.",
    caveatSentence,
    reviewOnly,
  ].join(" ").replace(/\s+/g, " ").trim();
}

function reviewOnlySentence(fallback: DecisionHandoffSummary) {
  const sentence = fallback.handoffNarrative
    .split(/(?<=[.?!])\s+/)
    .find((part) => /review-only/i.test(part));
  return sentence ?? "This export is review-only until blockers are resolved.";
}

function parseDecisionBrief(
  input: unknown,
  maxLength: number,
): DecisionBrief | null {
  if (!isRecord(input) || input.useCaseId !== "response_prioritization") {
    return null;
  }
  const requiredEvidence = stringArray(input.requiredEvidence, maxLength)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  return {
    useCaseId: "response_prioritization",
    decisionQuestion: stringOr(input.decisionQuestion, "", maxLength),
    intendedAction: stringOr(input.intendedAction, "", maxLength),
    decisionMaker: stringOr(input.decisionMaker, "", maxLength),
    geographyScope: stringOr(input.geographyScope, "", maxLength),
    timeframe: stringOr(input.timeframe, "", maxLength),
    requiredEvidence,
  };
}

function parseDecisionReadiness(
  input: unknown,
  maxLength: number,
): DecisionReadinessResult | undefined {
  if (!isRecord(input) || !isReadinessStatus(input.status)) return undefined;
  return {
    status: input.status,
    title: stringOr(input.title, input.status, maxLength),
    summary: stringOr(input.summary, "", maxLength),
    caveats: stringArray(input.caveats, maxLength).slice(0, 8),
    blockerCount: nonNegativeInteger(input.blockerCount),
    reviewCount: nonNegativeInteger(input.reviewCount),
    requiredEvidenceCovered: stringArray(input.requiredEvidenceCovered, maxLength)
      .slice(0, 8),
    requiredEvidenceMissing: stringArray(input.requiredEvidenceMissing, maxLength)
      .slice(0, 8),
  };
}

function parseEvidenceCoverage(
  input: unknown,
  maxLength: number,
): EvidenceCoverageSummary | undefined {
  if (!isRecord(input) || !Array.isArray(input.items)) return undefined;
  const items = input.items
    .filter(isRecord)
    .map((item) => ({
      evidenceNeed: stringOr(item.evidenceNeed, "Evidence", maxLength),
      status: isEvidenceCoverageStatus(item.status) ? item.status : "missing",
      candidates: [],
      caveat: stringOr(item.caveat, "", maxLength),
      nextAction: stringOr(item.nextAction, "Review this evidence need.", maxLength),
    }))
    .slice(0, 8);
  return {
    coveredCount: nonNegativeInteger(input.coveredCount),
    ambiguousCount: nonNegativeInteger(input.ambiguousCount),
    missingCount: nonNegativeInteger(input.missingCount),
    items,
  };
}

function parseDashboardFact(
  input: unknown,
  maxLength: number,
): DashboardInsightFact | null {
  if (!isRecord(input)) return null;
  const title = stringOr(input.title, "", maxLength);
  const description = stringOr(input.description, "", maxLength);
  const evidence = stringArray(input.evidence, maxLength).slice(0, 5);
  if (!title || !description || evidence.length === 0) return null;
  return {
    id: stringOr(input.id, `fact-${slugify(title)}`, maxLength),
    insightType: isInsightType(input.insightType)
      ? input.insightType
      : "coverage",
    title,
    description,
    severity: isSeverity(input.severity) ? input.severity : "info",
    evidence,
    recommendedAction: optionalString(input.recommendedAction, maxLength),
    metricField: optionalString(input.metricField, maxLength),
    groupField: optionalString(input.groupField, maxLength),
    categoryField: optionalString(input.categoryField, maxLength),
    linkedChartId: optionalString(input.linkedChartId, maxLength),
    confidence:
      typeof input.confidence === "number" && Number.isFinite(input.confidence)
        ? Math.min(1, Math.max(0, input.confidence))
        : 0.5,
  };
}

function parseRepairAction(input: unknown): HandoffRepairAction | null {
  if (!isRecord(input)) return null;
  const title = stringOr(input.title, "");
  const rationale = stringOr(input.rationale, "");
  if (!title || !rationale) return null;
  return {
    title,
    rationale,
    priority: isRepairPriority(input.priority) ? input.priority : "medium",
    ownerHint: stringOr(input.ownerHint, "Decision owner"),
  };
}

function mergeRepairActions(
  primary: HandoffRepairAction[],
  fallback: HandoffRepairAction[],
) {
  const seen = new Set<string>();
  return [...primary, ...fallback]
    .filter((action) => {
      const key = `${action.title.toLowerCase()}-${action.rationale.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_REPAIR_ACTIONS);
}

function parseAiMode(input: unknown): DecisionHandoffAiMode {
  return input === "llm" ||
    input === "deterministic" ||
    input === "disabled" ||
    input === "fallback"
    ? input
    : "deterministic";
}

function containsRawRowPayload(value: unknown, depth = 0): boolean {
  if (depth > 6) return false;
  if (Array.isArray(value)) {
    return value.some((item) => containsRawRowPayload(item, depth + 1));
  }
  if (!isRecord(value)) return false;
  for (const [key, child] of Object.entries(value)) {
    if (
      (key === "rows" || key === "data" || key === "sampleRows") &&
      Array.isArray(child)
    ) {
      return true;
    }
    if (containsRawRowPayload(child, depth + 1)) return true;
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOr(
  value: unknown,
  fallback: string,
  maxLength = DEFAULT_STRING_LIMIT,
) {
  return typeof value === "string" && value.trim()
    ? truncateString(stripHtml(value.trim()), maxLength)
    : fallback;
}

function optionalString(value: unknown, maxLength = DEFAULT_STRING_LIMIT) {
  return typeof value === "string" && value.trim()
    ? truncateString(stripHtml(value.trim()), maxLength)
    : undefined;
}

function stringArray(value: unknown, maxLength = DEFAULT_STRING_LIMIT) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return truncateString(stripHtml(item), maxLength);
    if (isRecord(item)) {
      return truncateString(
        stripHtml(
          [
            item.severity,
            item.status,
            item.checkType,
            item.description,
            item.caveat,
            item.suggestedAction,
          ]
            .filter(Boolean)
            .join(": "),
        ),
        maxLength,
      );
    }
    return truncateString(stripHtml(String(item)), maxLength);
  });
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function nonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
}

function truncateString(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "summary";
}

function isReadinessStatus(value: unknown): value is DecisionReadinessStatus {
  return value === "ready" || value === "review_needed" || value === "decision_unsafe";
}

function isEvidenceCoverageStatus(value: unknown): value is EvidenceCoverageStatus {
  return value === "covered" || value === "ambiguous" || value === "missing";
}

function isSeverity(value: unknown): value is "info" | "low" | "medium" | "high" {
  return value === "info" || value === "low" || value === "medium" || value === "high";
}

function isInsightType(value: unknown): value is DashboardInsightFact["insightType"] {
  return (
    value === "trend" ||
    value === "outlier" ||
    value === "quality" ||
    value === "coverage" ||
    value === "comparison" ||
    value === "concentration" ||
    value === "distribution"
  );
}

function isRepairPriority(value: unknown): value is HandoffRepairAction["priority"] {
  return value === "high" || value === "medium" || value === "low";
}
