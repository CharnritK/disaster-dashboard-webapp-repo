import type { Dataset } from "@/types/dataset";
import type {
  DecisionHandoffCopilotContext,
  DecisionHandoffSummary,
} from "@/types/copilot";
import type {
  AIRecommendationResponse,
  QualityConcern,
  RecommendationScope,
  WorkflowContext,
} from "@/types/recommendations";
import { cleaningRecommendationsForProfiles } from "./cleaningTransforms";
import { generateDeterministicJoinRecommendations } from "./deterministicJoinRecommendations";
import { generateDeterministicDashboardRecommendation } from "./dashboardRecommendations";

export function generateFallbackRecommendations(
  datasets: Dataset[],
): AIRecommendationResponse {
  const workingDataset =
    datasets.find((dataset) => dataset.data?.length) ?? datasets[0];
  const joins = generateDeterministicJoinRecommendations(datasets);
  const dashboard = workingDataset
    ? generateDeterministicDashboardRecommendation(workingDataset)
    : undefined;
  const bestJoin = joins[0];

  return {
    source: "deterministic",
    summary: bestJoin
      ? `Review a candidate join between ${nameFor(datasets, bestJoin.sourceDatasetId)} and ${nameFor(datasets, bestJoin.targetDatasetId)} using ${bestJoin.sourceColumns[0]}.`
      : "Prepare a review dashboard from the selected dataset.",
    recommendedPath: {
      title: bestJoin
        ? "Review candidate join"
        : "Prepare single-dataset review dashboard",
      rationale:
        bestJoin?.rationale ??
        "The profiled data can support a first review dashboard, but reviewers still need to check caveats before use.",
      confidence: bestJoin?.confidenceScore ?? 0.72,
      actions: bestJoin
        ? ["Use candidate join", "Adjust"]
        : ["Prepare dataset"],
    },
    joinRecommendations: joins,
    cleaningRecommendations: cleaningRecommendationsForProfiles(
      datasets
        .map((dataset) => dataset.profile)
        .filter((profile): profile is NonNullable<typeof profile> =>
          Boolean(profile),
        ),
    ),
    dashboardRecommendations: dashboard,
    qualityConcerns: buildQualityConcerns(datasets),
    assumptions: [
      "Recommendations are based on deterministic profiling and minimized column summaries.",
    ],
  };
}

export class AIRecommendationRequestError extends Error {
  fallbackReason: NonNullable<AIRecommendationResponse["fallbackReason"]>;
  retryAfterSeconds?: number;

  constructor(
    message: string,
    fallbackReason: NonNullable<AIRecommendationResponse["fallbackReason"]>,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "AIRecommendationRequestError";
    this.fallbackReason = fallbackReason;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export async function requestAIRecommendations(
  context: WorkflowContext,
  useLlm = true,
  recommendationScope: RecommendationScope = "dashboard",
): Promise<AIRecommendationResponse> {
  const response = await fetch("/api/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...context, useLlm, recommendationScope }),
  });
  if (!response.ok) {
    const message = await responseErrorMessage(response);
    throw new AIRecommendationRequestError(
      message,
      fallbackReasonForStatus(response.status),
      retryAfterSeconds(response.headers.get("retry-after")),
    );
  }
  return response.json();
}

export async function requestDecisionHandoffCopilotSummary(
  context: DecisionHandoffCopilotContext,
  useLlm = true,
): Promise<DecisionHandoffSummary> {
  const response = await fetch("/api/copilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...context, useLlm }),
  });
  if (!response.ok) {
    const message = await responseErrorMessage(response);
    throw new AIRecommendationRequestError(
      message,
      fallbackReasonForStatus(response.status),
      retryAfterSeconds(response.headers.get("retry-after")),
    );
  }
  return response.json();
}

function fallbackReasonForStatus(
  status: number,
): NonNullable<AIRecommendationResponse["fallbackReason"]> {
  if (status === 429) return "app_rate_limit";
  if (status === 413) return "request_too_large";
  if (status === 400 || status === 415) return "invalid_request";
  if (status >= 500) return "provider_unavailable";
  return "network_error";
}

function nameFor(datasets: Dataset[], id: string) {
  return datasets.find((dataset) => dataset.id === id)?.name ?? "dataset";
}

function buildQualityConcerns(datasets: Dataset[]): QualityConcern[] {
  const missingColumns = datasets
    .flatMap((dataset) =>
      (dataset.profile?.columns ?? [])
        .filter((column) => column.missingPercentage > 0)
        .map((column) => ({
          column: column.columnName,
          missingPercentage: column.missingPercentage,
        })),
    )
    .sort((a, b) => b.missingPercentage - a.missingPercentage)
    .slice(0, 5);
  const duplicateRows = datasets.reduce(
    (sum, dataset) => sum + (dataset.profile?.duplicateRowCount ?? 0),
    0,
  );
  const concerns: QualityConcern[] = [];

  if (missingColumns.length > 0) {
    concerns.push({
      title: "Review missing values",
      rationale: `Missing values appear in ${missingColumns.map((item) => item.column).join(", ")} and can distort comparisons or summary metrics.`,
      severity: missingColumns.some((item) => item.missingPercentage > 25)
        ? "medium"
        : "low",
    });
  }

  if (duplicateRows > 0) {
    concerns.push({
      title: "Review duplicates",
      rationale: `${duplicateRows} duplicate row${duplicateRows === 1 ? "" : "s"} were detected during profiling.`,
      severity: "low",
    });
  }

  return concerns.slice(0, 5);
}

async function responseErrorMessage(response: Response) {
  try {
    const body = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // Fall through to the status-based message.
  }
  return "AI recommendation request failed.";
}

function retryAfterSeconds(value: string | null) {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) return undefined;
  return Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
}
