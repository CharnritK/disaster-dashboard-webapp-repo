import { NextResponse } from "next/server";

import { readJsonRequest } from "@/lib/apiSecurity";
import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import { getEntitlementService } from "@/lib/entitlement";
import {
  deterministicSchemaInterpretation,
  parseSchemaInterpretationRequest,
  requestAiSchemaInterpretation,
  SchemaInterpretationValidationError,
} from "@/lib/formSchemaInterpretation";
import {
  getLlmServerConfig,
  resolveLlmTaskConfig,
} from "@/lib/serverConfig";

const SCHEMA_INTERPRET_REQUEST_MAX_BYTES = 32_000;

export async function POST(request: Request) {
  const bodyResult = await readJsonRequest(request, SCHEMA_INTERPRET_REQUEST_MAX_BYTES);
  if (!bodyResult.ok) {
    return jsonNoStore({ error: bodyResult.error }, { status: bodyResult.status });
  }

  let parsed: ReturnType<typeof parseSchemaInterpretationRequest>;
  try {
    parsed = parseSchemaInterpretationRequest(bodyResult.body);
  } catch (error) {
    if (error instanceof SchemaInterpretationValidationError) {
      return jsonNoStore({ error: error.message }, { status: 400 });
    }
    return jsonNoStore({ error: "Schema interpretation request is invalid." }, { status: 400 });
  }

  const fallback = deterministicSchemaInterpretation(parsed);
  const useLlm =
    isRecord(bodyResult.body) && bodyResult.body.useLlm === true;
  if (!useLlm) return jsonNoStore(fallback);

  const taskConfig = resolveLlmTaskConfig("form_schema_interpretation");
  const entitlement = getEntitlementService();
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    await entitlement.recordAiEvent({
      attemptedProviderCall: false,
      fallbackReason: "unauthenticated",
      route: "/api/form-schema/interpret",
      succeeded: false,
      taskType: taskConfig.taskType,
    });
    return jsonNoStore({
      ...fallback,
      fallbackReason: "unauthenticated",
    });
  }

  const decision = await entitlement.checkAiEntitlement(auth, taskConfig.taskType);
  if (!decision.allowed) {
    await entitlement.recordAiEvent({
      attemptedProviderCall: false,
      fallbackReason: decision.reason ?? "not_entitled",
      route: "/api/form-schema/interpret",
      succeeded: false,
      taskType: taskConfig.taskType,
      userId: auth.userId,
    });
    return jsonNoStore({
      ...fallback,
      fallbackReason: decision.reason ?? "not_entitled",
    });
  }

  const llmConfig = getLlmServerConfig();
  const preflightReason = preProviderFallbackReason(llmConfig);
  if (preflightReason) {
    await entitlement.recordAiEvent({
      attemptedProviderCall: false,
      fallbackReason: preflightReason,
      metadata: {
        field_count: parsed.fields.length,
        source: "form_schema_interpretation",
      },
      model: taskConfig.model,
      provider: llmConfig.provider,
      route: "/api/form-schema/interpret",
      succeeded: false,
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
    await entitlement.recordAiEvent({
      attemptedProviderCall: false,
      fallbackReason: reservation.reason,
      route: "/api/form-schema/interpret",
      succeeded: false,
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
    metadata: {
      field_count: parsed.fields.length,
      source: "form_schema_interpretation",
    },
    model: taskConfig.model,
    provider: llmConfig.provider,
    route: "/api/form-schema/interpret",
    taskType: taskConfig.taskType,
    userId: auth.userId,
  });

  const ai = await requestAiSchemaInterpretation(parsed, fallback, {
    apiKey: llmConfig.apiKey,
    model: taskConfig.model,
    provider: llmConfig.provider,
    timeoutMs: taskConfig.timeoutMs,
  });

  await entitlement.markAiEventComplete(event.id, {
    fallbackReason: ai.fallbackReason,
    succeeded: ai.source === "llm" && !ai.fallbackReason,
  });
  return jsonNoStore(ai);
}

function preProviderFallbackReason(
  config: ReturnType<typeof getLlmServerConfig>,
) {
  if (!config.enabled) return "ai_disabled";
  if (!config.apiKey) return "missing_api_key";
  if (config.provider !== "openai") return "unsupported_provider";
  return undefined;
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
