import type { AiFallbackReason } from "@/lib/entitlement";
import { resolveLlmTaskConfig } from "@/lib/serverConfig";
import type { CoachHint } from "@/lib/coach";

type CoachAiConfig = {
  apiKey?: string;
  model?: string;
  provider: string;
  timeoutMs?: number;
};

type CoachAiInput = {
  readinessStatus?: string;
  step: string;
};

export type CoachAiResult =
  | {
      hints: CoachHint[];
      source: "llm";
    }
  | {
      fallbackReason: AiFallbackReason;
      source: "deterministic";
    };

export async function requestAiCoachHints(
  input: CoachAiInput,
  config: CoachAiConfig,
): Promise<CoachAiResult> {
  if (!config.apiKey) {
    return {
      fallbackReason: "missing_api_key",
      source: "deterministic",
    };
  }
  if (config.provider !== "openai") {
    return {
      fallbackReason: "unsupported_provider",
      source: "deterministic",
    };
  }

  const taskConfig = resolveLlmTaskConfig("quality_repair_guidance");
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.timeoutMs ?? taskConfig.timeoutMs,
  );

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      body: JSON.stringify(buildCoachRequestBody(input, config.model ?? taskConfig.model)),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    return {
      fallbackReason: error instanceof Error && error.name === "AbortError"
        ? "request_timeout"
        : "network_error",
      source: "deterministic",
    };
  }
  clearTimeout(timeout);

  if (!response.ok) {
    return {
      fallbackReason: response.status === 429 ? "provider_rate_limit" : "provider_unavailable",
      source: "deterministic",
    };
  }

  const json = await response.json().catch(() => null) as unknown;
  if (!isRecord(json) || json.status === "incomplete") {
    return {
      fallbackReason: json && isRecord(json) && json.status === "incomplete"
        ? "model_response_truncated"
        : "model_response_invalid",
      source: "deterministic",
    };
  }
  if (typeof json.status === "string" && json.status !== "completed") {
    return {
      fallbackReason: "provider_unavailable",
      source: "deterministic",
    };
  }

  const content = responseOutputText(json);
  if (!content.trim()) {
    return {
      fallbackReason: "model_response_invalid",
      source: "deterministic",
    };
  }

  try {
    return {
      hints: sanitizeCoachHints(JSON.parse(content)),
      source: "llm",
    };
  } catch {
    return {
      fallbackReason: "model_response_invalid",
      source: "deterministic",
    };
  }
}

function buildCoachRequestBody(input: CoachAiInput, model: string) {
  return {
    input: [
      {
        content: [
          "Return JSON with 1-3 concise coach hints for the current dashboard workflow step.",
          "Do not ask for raw rows, files, persistence, geocoding, external systems, or hidden data.",
          "Deterministic readiness remains authoritative; do not override it.",
          "Use only the supplied step and readinessStatus fields.",
        ].join(" "),
        role: "developer",
      },
      {
        content: JSON.stringify({
          readinessStatus: safeText(input.readinessStatus, 40),
          step: safeText(input.step, 40),
        }),
        role: "user",
      },
    ],
    max_output_tokens: 600,
    model,
    reasoning: {
      effort: "low",
    },
    store: false,
    text: {
      format: {
        name: "coach_hints",
        schema: {
          additionalProperties: false,
          properties: {
            hints: {
              items: {
                additionalProperties: false,
                properties: {
                  body: { maxLength: 220, type: "string" },
                  title: { maxLength: 80, type: "string" },
                  tone: { enum: ["neutral", "warn"], type: "string" },
                },
                required: ["title", "body", "tone"],
                type: "object",
              },
              maxItems: 3,
              minItems: 1,
              type: "array",
            },
          },
          required: ["hints"],
          type: "object",
        },
        strict: true,
        type: "json_schema",
      },
      verbosity: "low",
    },
  };
}

function sanitizeCoachHints(value: unknown): CoachHint[] {
  if (!isRecord(value) || !Array.isArray(value.hints)) {
    throw new Error("Invalid coach response.");
  }
  const hints = value.hints.slice(0, 3).map((hint) => {
    if (!isRecord(hint)) throw new Error("Invalid coach hint.");
    const title = safeText(hint.title, 80);
    const body = safeText(hint.body, 220);
    const tone: CoachHint["tone"] = hint.tone === "warn" ? "warn" : "neutral";
    if (!title || !body) throw new Error("Invalid coach hint.");
    return {
      body,
      title,
      tone,
    };
  });
  if (hints.length === 0) throw new Error("No coach hints.");
  return hints;
}

function responseOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return "";
  const textParts: string[] = [];
  for (const item of response.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content)) continue;
      if (
        (content.type === "output_text" || content.type === "text") &&
        typeof content.text === "string"
      ) {
        textParts.push(content.text);
      }
    }
  }
  return textParts.join("");
}

function safeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\r\n\t]/g, " ").trim().slice(0, maxLength);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
