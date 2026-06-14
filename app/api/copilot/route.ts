import { NextResponse } from "next/server";
import {
  anonymousSafetyIdentifier,
  checkRateLimit,
  clientKeyForRequest,
  readJsonRequest,
} from "@/lib/apiSecurity";
import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import {
  buildDeterministicDecisionHandoffSummary,
  parseDecisionHandoffCopilotContext,
} from "@/lib/copilotHandoff";
import { getEntitlementService, type AiFallbackReason } from "@/lib/entitlement";
import { requestDecisionHandoffSummary } from "@/lib/llmClient";
import {
  getLlmServerConfig,
  recommendationApiConfig,
  resolveLlmTaskConfig,
} from "@/lib/serverConfig";

export async function POST(request: Request) {
  try {
    const clientKey = clientKeyForRequest(request);
    const rateLimit = checkRateLimit(clientKey, {
      maxRequests: recommendationApiConfig.rateLimitMaxRequests,
      windowMs: recommendationApiConfig.rateLimitWindowMs,
    });
    if (rateLimit.limited) {
      return jsonNoStore(
        { error: "Too many copilot requests. Try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const bodyResult = await readJsonRequest(
      request,
      recommendationApiConfig.requestMaxBytes,
    );
    if (!bodyResult.ok) {
      return jsonNoStore({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const body = bodyResult.body;
    const parsed = parseDecisionHandoffCopilotContext(
      body,
      recommendationApiConfig,
    );
    if ("error" in parsed) {
      return jsonNoStore({ error: parsed.error }, { status: 400 });
    }

    const fallback = buildDeterministicDecisionHandoffSummary(parsed);
    const useLlm = isRecord(body) && body.useLlm === true;
    if (!useLlm) {
      return jsonNoStore(fallback);
    }

    const llmServerConfig = getLlmServerConfig();
    const taskConfig = resolveLlmTaskConfig("decision_handoff_summary");
    const entitlement = getEntitlementService();
    const auth = await getRequestAuthContext(request);
    if (!auth) {
      await entitlement.recordAiEvent({
        attemptedProviderCall: false,
        fallbackReason: "unauthenticated",
        route: "/api/copilot",
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
        route: "/api/copilot",
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
        model: taskConfig.model,
        provider: llmServerConfig.provider,
        route: "/api/copilot",
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
        route: "/api/copilot",
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
      route: "/api/copilot",
      taskType: taskConfig.taskType,
      userId: auth.userId,
    });
    const summary = await requestDecisionHandoffSummary(parsed, fallback, {
      apiKey: llmServerConfig.apiKey,
      provider: llmServerConfig.provider,
      model: taskConfig.model,
      timeoutMs: taskConfig.timeoutMs,
      maxOutputTokens: taskConfig.maxOutputTokens,
      reasoningEffort: taskConfig.reasoningEffort,
      verbosity: taskConfig.verbosity,
      taskType: taskConfig.taskType,
      safetyIdentifier: anonymousSafetyIdentifier(clientKey),
    });
    await entitlement.markAiEventComplete(event.id, {
      fallbackReason: summary.fallbackReason,
      succeeded: summary.source === "llm" && !summary.fallbackReason,
    });
    return jsonNoStore(summary);
  } catch {
    return jsonNoStore({ error: "Copilot service failed gracefully." }, { status: 500 });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function preProviderFallbackReason(
  config: ReturnType<typeof getLlmServerConfig>,
): AiFallbackReason | undefined {
  if (!config.enabled) return "ai_disabled";
  if (!config.apiKey) return "missing_api_key";
  if (config.provider !== "openai") return "unsupported_provider";
  return undefined;
}

function withFallbackReason<T extends { fallbackReason?: AiFallbackReason }>(
  fallback: T,
  fallbackReason: AiFallbackReason,
): T {
  return { ...fallback, fallbackReason };
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
