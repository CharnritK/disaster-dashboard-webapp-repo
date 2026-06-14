import { NextResponse } from "next/server";
import type {
  AIRecommendationResponse,
  QualityConcern,
  RecommendationScope,
  WorkflowContext
} from "@/types/recommendations";
import {
  anonymousSafetyIdentifier,
  checkRateLimit,
  clientKeyForRequest,
  readJsonRequest
} from "@/lib/apiSecurity";
import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import { cleaningRecommendationsForProfiles } from "@/lib/cleaningTransforms";
import { getEntitlementService, type AiFallbackReason } from "@/lib/entitlement";
import { requestStructuredRecommendations } from "@/lib/llmClient";
import { parseWorkflowContext } from "@/lib/recommendationSchema";
import {
  copilotTaskForRecommendationScope,
  getLlmServerConfig,
  recommendationApiConfig,
  resolveLlmTaskConfig,
} from "@/lib/serverConfig";

export async function POST(request: Request) {
  try {
    const clientKey = clientKeyForRequest(request);
    const rateLimit = checkRateLimit(clientKey, {
      maxRequests: recommendationApiConfig.rateLimitMaxRequests,
      windowMs: recommendationApiConfig.rateLimitWindowMs
    });
    if (rateLimit.limited) {
      return jsonNoStore(
        { error: "Too many recommendation requests. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds)
          }
        }
      );
    }

    const bodyResult = await readJsonRequest(
      request,
      recommendationApiConfig.requestMaxBytes
    );
    if (!bodyResult.ok) {
      return jsonNoStore({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const body = bodyResult.body;
    const parsed = parseWorkflowContext(body, recommendationApiConfig);
    if ("error" in parsed) {
      return jsonNoStore({ error: parsed.error }, { status: 400 });
    }

    const fallback = generateServerFallback(parsed);
    const useLlm = isRecord(body) && body.useLlm === true;
    const recommendationScope = parseRecommendationScope(body);
    const taskConfig = resolveLlmTaskConfig(
      copilotTaskForRecommendationScope(recommendationScope),
    );
    if (!useLlm) {
      return jsonNoStore(fallback);
    }

    const llmServerConfig = getLlmServerConfig();
    const entitlement = getEntitlementService();
    const auth = await getRequestAuthContext(request);
    if (!auth) {
      await entitlement.recordAiEvent({
        attemptedProviderCall: false,
        fallbackReason: "unauthenticated",
        route: "/api/recommend",
        succeeded: false,
        taskType: taskConfig.taskType,
      });
      return jsonNoStore(withFallbackReason(fallback, "unauthenticated"));
    }

    const entitlementDecision = await entitlement.checkAiEntitlement(
      auth,
      taskConfig.taskType,
    );
    if (!entitlementDecision.allowed) {
      await entitlement.recordAiEvent({
        attemptedProviderCall: false,
        fallbackReason: entitlementDecision.reason ?? "not_entitled",
        route: "/api/recommend",
        succeeded: false,
        taskType: taskConfig.taskType,
        userId: auth.userId,
      });
      return jsonNoStore(
        withFallbackReason(
          fallback,
          entitlementDecision.reason ?? "not_entitled",
        ),
      );
    }

    const preflightReason = preProviderFallbackReason(llmServerConfig);
    if (preflightReason) {
      await entitlement.recordAiEvent({
        attemptedProviderCall: false,
        fallbackReason: preflightReason,
        model: llmServerConfig.model,
        provider: llmServerConfig.provider,
        route: "/api/recommend",
        succeeded: false,
        taskType: taskConfig.taskType,
        userId: auth.userId,
      });
      return jsonNoStore(withFallbackReason(fallback, preflightReason));
    }

    const reservation = await entitlement.reserveAiUsage(
      auth.userId,
      entitlementDecision.usageDate,
      taskConfig.taskType,
    );
    if (!reservation.reserved) {
      await entitlement.recordAiEvent({
        attemptedProviderCall: false,
        fallbackReason: reservation.reason,
        route: "/api/recommend",
        succeeded: false,
        taskType: taskConfig.taskType,
        userId: auth.userId,
      });
      return jsonNoStore(withFallbackReason(fallback, reservation.reason));
    }

    const event = await entitlement.recordAiEvent({
      attemptedProviderCall: true,
      model: taskConfig.model,
      provider: llmServerConfig.provider,
      route: "/api/recommend",
      taskType: taskConfig.taskType,
      userId: auth.userId,
    });
    const recommendations = await requestStructuredRecommendations(parsed, fallback, {
      apiKey: llmServerConfig.apiKey,
      provider: llmServerConfig.provider,
      model: taskConfig.model,
      timeoutMs: taskConfig.timeoutMs,
      maxOutputTokens: taskConfig.maxOutputTokens,
      recommendationScope,
      reasoningEffort: taskConfig.reasoningEffort,
      verbosity: taskConfig.verbosity,
      taskType: taskConfig.taskType,
      safetyIdentifier: anonymousSafetyIdentifier(clientKey)
    });
    await entitlement.markAiEventComplete(event.id, {
      fallbackReason: recommendations.fallbackReason,
      succeeded: recommendations.source === "llm" && !recommendations.fallbackReason,
    });
    return jsonNoStore(recommendations);
  } catch {
    return jsonNoStore({ error: "Recommendation service failed gracefully." }, { status: 500 });
  }
}

function generateServerFallback(context: WorkflowContext): AIRecommendationResponse {
  const firstProfile = context.profiles[0];
  const hasMulti = context.profiles.length > 1;
  const joinField = firstProfile?.potentialJoinFields[0];
  return {
    source: "deterministic",
    summary: hasMulti && joinField
      ? `Recommended: Review the likely join using ${joinField}, then generate the dashboard.`
      : "Recommended: Generate a first dashboard from the profiled dataset.",
    recommendedPath: {
      title: hasMulti ? "Review harmonization recommendation" : "Proceed with dashboard generation",
      rationale: hasMulti
        ? "Multiple datasets were provided, so harmonization may improve the dashboard if fields overlap."
        : "A single prepared dataset can already support a useful first dashboard.",
      confidence: 0.68,
      actions: hasMulti ? ["Accept recommendation", "Adjust"] : ["Prepare dataset"]
    },
    cleaningRecommendations: cleaningRecommendationsForProfiles(context.profiles),
    qualityConcerns: buildServerQualityConcerns(context),
    assumptions: ["The server used minimized column summaries only.", "No full dataset rows were sent to the model."]
  };
}

function buildServerQualityConcerns(context: WorkflowContext): QualityConcern[] {
  const missingColumns = context.profiles
    .flatMap((profile) =>
      profile.columns
        .filter((column) => column.missingPercentage > 0)
        .map((column) => ({
          column: column.columnName,
          missingPercentage: column.missingPercentage
        }))
    )
    .sort((a, b) => b.missingPercentage - a.missingPercentage)
    .slice(0, 5);
  const duplicateRows = context.profiles.reduce(
    (sum, profile) => sum + (profile.duplicateRowCount ?? 0),
    0
  );
  const concerns: QualityConcern[] = [];

  if (missingColumns.length > 0) {
    concerns.push({
      title: "Review missing values",
      severity: missingColumns.some((item) => item.missingPercentage > 25) ? "medium" : "low",
      rationale: `Missing values appear in ${missingColumns.map((item) => item.column).join(", ")} and can distort comparisons or summary metrics.`
    });
  }

  if (duplicateRows > 0) {
    concerns.push({
      title: "Review duplicates",
      rationale: `${duplicateRows} duplicate row${duplicateRows === 1 ? "" : "s"} were detected during profiling.`,
      severity: "low"
    });
  }

  return concerns.slice(0, 5);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRecommendationScope(body: unknown): RecommendationScope {
  return isRecord(body) && body.recommendationScope === "workflow"
    ? "workflow"
    : "dashboard";
}

function preProviderFallbackReason(
  config: ReturnType<typeof getLlmServerConfig>,
): AiFallbackReason | undefined {
  if (!config.enabled) return "ai_disabled";
  if (!config.apiKey) return "missing_api_key";
  if (config.provider !== "openai") return "unsupported_provider";
  return undefined;
}

function withFallbackReason(
  fallback: AIRecommendationResponse,
  fallbackReason: AiFallbackReason,
): AIRecommendationResponse {
  return { ...fallback, fallbackReason };
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
