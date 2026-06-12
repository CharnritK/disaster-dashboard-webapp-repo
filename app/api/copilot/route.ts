import { NextResponse } from "next/server";
import {
  anonymousSafetyIdentifier,
  checkRateLimit,
  clientKeyForRequest,
  readJsonRequest,
} from "@/lib/apiSecurity";
import {
  buildDeterministicDecisionHandoffSummary,
  parseDecisionHandoffCopilotContext,
} from "@/lib/copilotHandoff";
import { requestDecisionHandoffSummary } from "@/lib/llmClient";
import {
  llmServerConfig,
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
    const useLlm = !isRecord(body) || body.useLlm !== false;
    if (!useLlm || !llmServerConfig.enabled) {
      return jsonNoStore(fallback);
    }

    const taskConfig = resolveLlmTaskConfig("decision_handoff_summary");
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
    return jsonNoStore(summary);
  } catch {
    return jsonNoStore({ error: "Copilot service failed gracefully." }, { status: 500 });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
