import { NextResponse } from "next/server";

import { readJsonRequest } from "@/lib/apiSecurity";
import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import { deterministicCoachHints } from "@/lib/coach";
import { requestAiCoachHints } from "@/lib/coach/ai";
import { getEntitlementService, type AiFallbackReason } from "@/lib/entitlement";
import { getLlmServerConfig, resolveLlmTaskConfig } from "@/lib/serverConfig";
import type { CopilotTaskType } from "@/types/recommendations";

const COACH_REQUEST_MAX_BYTES = 4_096;
const COACH_TASK_TYPE = "quality_repair_guidance";

export async function POST(request: Request) {
  const bodyResult = await readJsonRequest(request, COACH_REQUEST_MAX_BYTES);
  const body = bodyResult.ok && isRecord(bodyResult.body) ? bodyResult.body : {};
  const step = typeof body.step === "string" ? body.step : "brief";
  const fallback = {
    hints: deterministicCoachHints(step as never),
    source: "deterministic",
  };
  if (!bodyResult.ok || !isRecord(bodyResult.body)) {
    return jsonNoStore({
      ...fallback,
      fallbackReason:
        !bodyResult.ok && bodyResult.status === 413
          ? "request_too_large"
          : "invalid_request",
    });
  }

  const entitlement = getEntitlementService();
  const llmConfig = getLlmServerConfig();
  const taskConfig = resolveLlmTaskConfig(COACH_TASK_TYPE);
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    await entitlement.recordAiEvent({
      attemptedProviderCall: false,
      fallbackReason: "unauthenticated",
      route: "/api/coach",
      succeeded: false,
      taskType: taskConfig.taskType,
    });
    return jsonNoStore({
      ...fallback,
      fallbackReason: "unauthenticated",
    });
  }

  const decision = await entitlement.checkAiEntitlement(
    auth,
    taskConfig.taskType,
  );
  if (!decision.allowed) {
    const fallbackReason = decision.reason ?? "not_entitled";
    await recordCoachFallback(entitlement, {
      fallbackReason,
      taskType: taskConfig.taskType,
      userId: auth.userId,
    });
    return jsonNoStore({
      ...fallback,
      fallbackReason,
    });
  }

  const preflightReason = preProviderFallbackReason(llmConfig);
  if (preflightReason) {
    await recordCoachFallback(entitlement, {
      fallbackReason: preflightReason,
      model: taskConfig.model,
      provider: llmConfig.provider,
      taskType: taskConfig.taskType,
      userId: auth.userId,
    });

    return jsonNoStore({
      ...fallback,
      fallbackReason: preflightReason,
    });
  }

  const reservation = await entitlement.reserveAiUsage(
    auth.userId,
    decision.usageDate,
    taskConfig.taskType,
  );
  if (!reservation.reserved) {
    await recordCoachFallback(entitlement, {
      fallbackReason: reservation.reason,
      taskType: taskConfig.taskType,
      userId: auth.userId,
    });
    return jsonNoStore({
      ...fallback,
      fallbackReason: reservation.reason,
    });
  }

  const event = await entitlement.recordAiEvent({
    attemptedProviderCall: true,
    model: taskConfig.model,
    provider: llmConfig.provider,
    route: "/api/coach",
    taskType: taskConfig.taskType,
    userId: auth.userId,
  });

  const ai = await requestAiCoachHints(
    {
      readinessStatus: typeof body.readinessStatus === "string"
        ? body.readinessStatus
        : undefined,
      step,
    },
    {
      apiKey: llmConfig.apiKey,
      model: taskConfig.model,
      provider: llmConfig.provider,
      timeoutMs: taskConfig.timeoutMs,
    },
  );

  if (ai.source === "llm") {
    await entitlement.markAiEventComplete(event.id, { succeeded: true });
    return jsonNoStore({
      hints: ai.hints,
      source: "llm",
    });
  }

  await entitlement.markAiEventComplete(event.id, {
    fallbackReason: ai.fallbackReason,
    succeeded: false,
  });

  return jsonNoStore({
    ...fallback,
    fallbackReason: ai.fallbackReason,
  });
}

function preProviderFallbackReason(
  config: ReturnType<typeof getLlmServerConfig>,
): AiFallbackReason | undefined {
  if (!config.enabled) return "ai_disabled";
  if (!config.apiKey) return "missing_api_key";
  if (config.provider !== "openai") return "unsupported_provider";
  return undefined;
}

function recordCoachFallback(
  entitlement: ReturnType<typeof getEntitlementService>,
  input: {
    fallbackReason: AiFallbackReason;
    model?: string;
    provider?: string;
    taskType: CopilotTaskType;
    userId: string;
  },
) {
  return entitlement.recordAiEvent({
    attemptedProviderCall: false,
    fallbackReason: input.fallbackReason,
    model: input.model,
    provider: input.provider,
    route: "/api/coach",
    succeeded: false,
    taskType: input.taskType,
    userId: input.userId,
  });
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
