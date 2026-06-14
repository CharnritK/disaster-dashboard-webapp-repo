import { NextResponse } from "next/server";

import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import { deterministicCoachHints } from "@/lib/coach";
import { requestAiCoachHints } from "@/lib/coach/ai";
import { getEntitlementService } from "@/lib/entitlement";
import { getLlmServerConfig } from "@/lib/serverConfig";

export async function POST(request: Request) {
  const body = await readBoundedJson(request);
  const step = typeof body.step === "string" ? body.step : "brief";
  const fallback = {
    hints: deterministicCoachHints(step as never),
    source: "deterministic",
  };

  const auth = await getRequestAuthContext(request);
  if (!auth) {
    return jsonNoStore({
      ...fallback,
      fallbackReason: "unauthenticated",
    });
  }

  const entitlement = getEntitlementService();
  const decision = await entitlement.checkAiEntitlement(
    auth,
    "quality_repair_guidance",
  );
  if (!decision.allowed) {
    return jsonNoStore({
      ...fallback,
      fallbackReason: decision.reason ?? "not_entitled",
    });
  }

  const config = getLlmServerConfig();
  if (!config.enabled || !config.apiKey) {
    await entitlement.recordAiEvent({
      attemptedProviderCall: false,
      fallbackReason: config.enabled ? "missing_api_key" : "ai_disabled",
      route: "/api/coach",
      succeeded: false,
      taskType: "quality_repair_guidance",
      userId: auth.userId,
    });

    return jsonNoStore({
      ...fallback,
      fallbackReason: config.enabled ? "missing_api_key" : "ai_disabled",
    });
  }

  const reservation = await entitlement.reserveAiUsage(
    auth.userId,
    decision.usageDate,
    "quality_repair_guidance",
  );
  if (!reservation.reserved) {
    return jsonNoStore({
      ...fallback,
      fallbackReason: reservation.reason,
    });
  }

  const event = await entitlement.recordAiEvent({
    attemptedProviderCall: true,
    model: config.model,
    provider: config.provider,
    route: "/api/coach",
    taskType: "quality_repair_guidance",
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
      apiKey: config.apiKey,
      model: config.model,
      provider: config.provider,
      timeoutMs: config.workflowTimeoutMs,
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

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function readBoundedJson(request: Request) {
  const text = await request.text();
  if (text.length > 4_096) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}
