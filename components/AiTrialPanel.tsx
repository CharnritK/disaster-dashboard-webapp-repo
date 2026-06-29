"use client";

import { useEffect, useMemo, useState } from "react";

import { computeDashboardInsightFacts } from "@/lib/dashboardInsights";
import {
  generateDeterministicDashboardRecommendation,
  reconcileDashboardRecommendation,
} from "@/lib/dashboardRecommendations";
import { createDecisionBriefFromTemplate } from "@/lib/decisionContext";
import { loadSampleDatasets } from "@/lib/fileParsers";
import { profileDataset } from "@/lib/profiling";
import {
  AIRecommendationRequestError,
  generateFallbackRecommendations,
  requestAIRecommendations,
} from "@/lib/recommendations";
import { runQualityChecks } from "@/lib/validation";
import type { Dataset } from "@/types/dataset";
import type {
  AIRecommendationResponse,
  ChartRecommendation,
  DashboardInsight,
  WorkflowContext,
} from "@/types/recommendations";

type UsageSnapshot = {
  limit: number;
  remaining: number;
  used: number;
};

type RecommendationStatus = {
  ai: {
    fallbackReason?: string;
    mode: "available" | "deterministic_fallback";
  };
  ok: boolean;
};

type TrialSample = {
  baseline: AIRecommendationResponse;
  context: WorkflowContext;
  dashboardFactsCount: number;
  dataset: Dataset;
  qualitySummary: string[];
};

type TrialResult = {
  afterUsage?: UsageSnapshot;
  beforeUsage?: UsageSnapshot;
  response: AIRecommendationResponse;
};

export function AiTrialPanel() {
  const [sample, setSample] = useState<TrialSample>();
  const [status, setStatus] = useState<RecommendationStatus>();
  const [trialResult, setTrialResult] = useState<TrialResult>();
  const [loadingSample, setLoadingSample] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    Promise.all([buildTrialSample(), fetchRecommendationStatus()])
      .then(([nextSample, nextStatus]) => {
        if (cancelled) return;
        setSample(nextSample);
        setStatus(nextStatus);
      })
      .catch(() => {
        if (!cancelled) {
          setError("AI trial sample could not be prepared.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSample(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayedResponse = useMemo(() => {
    if (!sample || !trialResult) return undefined;
    return reconcileTrialResponse(trialResult.response, sample.dataset);
  }, [sample, trialResult]);

  async function runTrial() {
    if (!sample || running) return;
    setRunning(true);
    setError(undefined);

    try {
      const beforeUsage = await fetchUsageSnapshot();
      const response = await requestAIRecommendations(
        sample.context,
        true,
        "dashboard",
      );
      const afterUsage = await fetchUsageSnapshot();
      setTrialResult({ afterUsage, beforeUsage, response });
    } catch (trialError) {
      const fallback = {
        ...sample.baseline,
        fallbackReason:
          trialError instanceof AIRecommendationRequestError
            ? trialError.fallbackReason
            : "network_error",
        fallbackMessage:
          trialError instanceof Error
            ? trialError.message
            : "AI trial request failed.",
      } satisfies AIRecommendationResponse;
      const afterUsage = await fetchUsageSnapshot();
      setTrialResult({ afterUsage, response: fallback });
    } finally {
      setRunning(false);
    }
  }

  const response = displayedResponse ?? sample?.baseline;
  const responseState = responseStateCopy(displayedResponse);

  return (
    <div className="ai-trial-panel">
      <section className="ai-trial-status-grid" aria-label="AI trial checks">
        <StatusBlock
          label="Server AI mode"
          tone={status?.ai.mode === "available" ? "success" : "warning"}
          value={
            status?.ai.mode === "available"
              ? "Provider path enabled"
              : fallbackLabel(status?.ai.fallbackReason)
          }
        />
        <StatusBlock
          label="Sample payload"
          tone="success"
          value={sample ? `${sample.dataset.rowCount ?? 0} synthetic rows` : "Preparing"}
        />
        <StatusBlock
          label="Provider attempt"
          tone={displayedResponse?.source === "llm" ? "success" : "warning"}
          value={displayedResponse ? responseState.label : "Not run"}
        />
      </section>

      {error ? <p className="ai-trial-alert">{error}</p> : null}

      <section className="ai-trial-runner" aria-labelledby="ai-trial-runner-title">
        <div>
          <h2 id="ai-trial-runner-title">Run the AI-assisted sample</h2>
          <p>
            This uses the bundled service-gap sample and the existing server
            AI route. Quota is reserved only if the server attempts a provider
            call.
          </p>
        </div>
        <button
          className="primary-button"
          disabled={loadingSample || running || !sample}
          onClick={runTrial}
          type="button"
        >
          {running ? "Running AI trial" : "Run AI trial"}
        </button>
      </section>

      <section
        className={`ai-trial-outcome ai-trial-outcome-${responseState.tone}`}
        aria-live="polite"
      >
        <div>
          <span>{responseState.label}</span>
          <strong>{responseState.title}</strong>
        </div>
        <p>{responseState.detail}</p>
        <UsageDelta result={trialResult} />
      </section>

      {sample && response ? (
        <section className="ai-trial-comparison" aria-label="AI trial comparison">
          <ComparisonColumn
            recommendation={sample.baseline}
            title="Deterministic baseline"
          />
          <ComparisonColumn
            recommendation={response}
            title={
              displayedResponse?.source === "llm"
                ? "AI-assisted result"
                : "Current result"
            }
          />
        </section>
      ) : null}

      {sample ? (
        <section className="ai-trial-evidence" aria-label="Trial evidence">
          <div>
            <span>Decision context</span>
            <strong>Service gap monitoring</strong>
            <p>
              {sample.dashboardFactsCount} deterministic dashboard facts and{" "}
              {sample.qualitySummary.length} quality signals are sent as
              minimized metadata.
            </p>
          </div>
          <div>
            <span>Privacy boundary</span>
            <strong>Sample metadata only</strong>
            <p>
              The trial does not add user API keys, browser provider calls, raw
              uploaded files, or persisted prompts.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatusBlock({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "success" | "warning";
  value: string;
}) {
  return (
    <div className={`ai-trial-status ai-trial-status-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ComparisonColumn({
  recommendation,
  title,
}: {
  recommendation: AIRecommendationResponse;
  title: string;
}) {
  const dashboard = recommendation.dashboardRecommendations;
  const charts = dashboard?.charts.slice(0, 4) ?? [];
  const insights = dashboard?.insights?.slice(0, 3) ?? [];

  return (
    <article className="ai-trial-column">
      <div className="ai-trial-column-header">
        <span>{title}</span>
        <h3>{recommendation.recommendedPath.title}</h3>
        <p>{recommendation.recommendedPath.rationale}</p>
      </div>
      <RecommendationList
        empty="No dashboard charts were returned."
        items={charts}
        title="Dashboard framing"
      />
      <InsightList insights={insights} />
      <RecommendationList
        empty="No assumptions were returned."
        items={recommendation.assumptions.slice(0, 3)}
        title="Assumptions"
      />
    </article>
  );
}

function RecommendationList<T extends ChartRecommendation | string>({
  empty,
  items,
  title,
}: {
  empty: string;
  items: T[];
  title: string;
}) {
  return (
    <div className="ai-trial-list">
      <h4>{title}</h4>
      {items.length ? (
        <ul>
          {items.map((item, index) => (
            <li key={itemKey(item, index)}>{itemLabel(item)}</li>
          ))}
        </ul>
      ) : (
        <p>{empty}</p>
      )}
    </div>
  );
}

function InsightList({ insights }: { insights: DashboardInsight[] }) {
  return (
    <div className="ai-trial-list">
      <h4>Review signals</h4>
      {insights.length ? (
        <ul>
          {insights.map((insight) => (
            <li key={insight.id}>
              {insight.title}: {insight.description}
            </li>
          ))}
        </ul>
      ) : (
        <p>No review signals were returned.</p>
      )}
    </div>
  );
}

function UsageDelta({ result }: { result?: TrialResult }) {
  if (!result?.beforeUsage || !result.afterUsage) return null;
  const delta = result.afterUsage.used - result.beforeUsage.used;
  return (
    <p className="ai-trial-usage-delta">
      Usage: {result.beforeUsage.used} / {result.beforeUsage.limit} before,{" "}
      {result.afterUsage.used} / {result.afterUsage.limit} after
      {delta > 0 ? ` (+${delta})` : " (+0)"}.
    </p>
  );
}

async function buildTrialSample(): Promise<TrialSample> {
  const [dataset] = await loadSampleDatasets("service-gap");
  if (!dataset) throw new Error("Missing AI trial sample.");

  const profiledDataset = { ...dataset, profile: profileDataset(dataset) };
  const decisionBrief = createDecisionBriefFromTemplate("service_gap_monitoring");
  const qualityResults = runQualityChecks(profiledDataset, decisionBrief);
  const dashboardFacts = computeDashboardInsightFacts(
    profiledDataset,
    qualityResults,
    [],
  );
  const baselineDashboard = generateDeterministicDashboardRecommendation(
    profiledDataset,
    {
      dashboardFacts,
      qualityResults,
      transformationLog: [],
    },
  );
  const baseline = {
    ...generateFallbackRecommendations([profiledDataset]),
    dashboardRecommendations: baselineDashboard,
  };

  return {
    baseline,
    context: {
      dashboardFacts,
      decisionContext: decisionBrief,
      mode: "single",
      profiles: [profiledDataset.profile],
      qualitySummary: qualityResults.map(
        (issue) => `${issue.severity}: ${issue.description}`,
      ),
      transformationSummary: [],
    },
    dashboardFactsCount: dashboardFacts.length,
    dataset: profiledDataset,
    qualitySummary: qualityResults.map(
      (issue) => `${issue.severity}: ${issue.description}`,
    ),
  };
}

function reconcileTrialResponse(
  response: AIRecommendationResponse,
  dataset: Dataset,
): AIRecommendationResponse {
  if (response.source !== "llm" || !response.dashboardRecommendations) {
    return response;
  }

  return {
    ...response,
    dashboardRecommendations: reconcileDashboardRecommendation(
      dataset,
      response.dashboardRecommendations,
    ),
  };
}

async function fetchRecommendationStatus(): Promise<RecommendationStatus> {
  const response = await fetch("/api/recommend/status", { cache: "no-store" });
  if (!response.ok) {
    return {
      ai: { fallbackReason: "provider_unavailable", mode: "deterministic_fallback" },
      ok: false,
    };
  }
  return response.json();
}

async function fetchUsageSnapshot(): Promise<UsageSnapshot | undefined> {
  const response = await fetch("/api/usage", { cache: "no-store" });
  if (!response.ok) return undefined;
  const body: unknown = await response.json();
  if (!isUsageSnapshot(body)) return undefined;
  return body;
}

function isUsageSnapshot(value: unknown): value is UsageSnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    "limit" in value &&
    "remaining" in value &&
    "used" in value &&
    typeof value.limit === "number" &&
    typeof value.remaining === "number" &&
    typeof value.used === "number"
  );
}

function responseStateCopy(response?: AIRecommendationResponse) {
  if (!response) {
    return {
      detail: "Run the sample to compare deterministic output with AI-assisted dashboard synthesis.",
      label: "Ready",
      title: "AI trial has not run yet",
      tone: "neutral" as const,
    };
  }

  if (response.source === "llm" && !response.fallbackReason) {
    return {
      detail:
        "The server returned sanitized AI output and reconciled it against deterministic dashboard policy.",
      label: "Provider returned",
      title: "Sanitized AI output was reconciled for review",
      tone: "success" as const,
    };
  }

  return {
    detail: fallbackDetail(response.fallbackReason),
    label: "Fallback",
    title: fallbackLabel(response.fallbackReason),
    tone: "warning" as const,
  };
}

function fallbackLabel(reason?: string) {
  if (!reason) return "Deterministic fallback";
  return reason
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function fallbackDetail(reason?: string) {
  if (reason === "ai_disabled") {
    return "AI is disabled for this environment. Deterministic output remains available.";
  }
  if (reason === "missing_api_key" || reason === "missing_server_configuration") {
    return "The server has no approved OpenAI API key configured for app-managed AI.";
  }
  if (reason === "not_entitled") {
    return "This signed-in user is not on the beta AI allowlist.";
  }
  if (reason === "quota_exceeded") {
    return "Daily AI quota is exhausted. The sample still returns deterministic guidance.";
  }
  if (reason === "provider_rate_limit") {
    return "The provider rate limit was reached. Try again later.";
  }
  if (reason === "unauthenticated") {
    return "Sign in is required before an AI provider call can be attempted.";
  }
  if (reason) {
    return `The AI path returned ${fallbackLabel(reason)}. Deterministic guidance remains available.`;
  }
  return "The request did not return AI output. Deterministic guidance remains available.";
}

function itemKey(item: ChartRecommendation | string, index: number) {
  return typeof item === "string" ? `${item}-${index}` : item.id;
}

function itemLabel(item: ChartRecommendation | string) {
  if (typeof item === "string") return item;
  return `${item.title} (${item.chartType})`;
}
