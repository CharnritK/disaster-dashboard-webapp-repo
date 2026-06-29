import type { AiFallbackReason } from "@/lib/entitlement";
import { resolveLlmTaskConfig } from "@/lib/serverConfig";
import type { MappingConfidenceBucket } from "@/types/formRegistry";

export type SchemaFieldInterpretationInput = {
  fieldName: string;
  fieldType?: string;
  label?: string;
  required?: boolean;
};

export type SchemaInterpretationRequest = {
  fields: SchemaFieldInterpretationInput[];
  formFamily?: string;
  sourceKind?: string;
};

export type SchemaInterpretationMapping = {
  evidenceNeed: string;
  fieldName: string;
  confidenceBucket: MappingConfidenceBucket;
  rationale: string;
};

export type SchemaInterpretationResult = {
  fallbackReason?: AiFallbackReason;
  mappings: SchemaInterpretationMapping[];
  source: "deterministic" | "llm";
  summary: string;
};

type SchemaAiConfig = {
  apiKey?: string;
  model?: string;
  provider: string;
  timeoutMs?: number;
};

const UNSAFE_KEY_PATTERN =
  /row|rows|record|records|sample|value|values|file|files|upload|prompt|response|secret|token|credential|password|address|coordinate|latitude|longitude|lat|lon|lng|ocr|text/i;
const EVIDENCE_NEEDS = [
  "Geography",
  "Needs",
  "Population",
  "Capacity",
  "Priority",
  "Time",
] as const;
const EVIDENCE_PATTERNS: Array<[typeof EVIDENCE_NEEDS[number], RegExp]> = [
  ["Geography", /district|admin|location|geo|area|site|settlement/],
  ["Needs", /need|gap|priority_need|assistance|sector|damage/],
  ["Population", /population|people|household|hh|affected/],
  ["Capacity", /capacity|stock|staff|clinic|shelter|resource|service/],
  ["Priority", /priority|severity|score|rank|urgent/],
  ["Time", /date|time|reported|updated|period/],
];

export class SchemaInterpretationValidationError extends Error {}

export function parseSchemaInterpretationRequest(
  body: unknown,
): SchemaInterpretationRequest {
  if (!isRecord(body)) {
    throw new SchemaInterpretationValidationError("Schema body must be an object.");
  }
  rejectUnsafeKeys(body, "schema body");
  rejectUnsupportedKeys(
    body,
    new Set(["fields", "formFamily", "sourceKind", "useLlm"]),
    "schema body",
  );
  if (!Array.isArray(body.fields) || body.fields.length === 0 || body.fields.length > 80) {
    throw new SchemaInterpretationValidationError("fields must be a short array.");
  }

  return {
    fields: body.fields.map(parseField),
    formFamily: optionalText(body.formFamily, 80) ?? undefined,
    sourceKind: optionalText(body.sourceKind, 80) ?? undefined,
  };
}

export function deterministicSchemaInterpretation(
  input: SchemaInterpretationRequest,
): SchemaInterpretationResult {
  const mappings = input.fields
    .map((field) => inferMapping(field))
    .filter((mapping): mapping is SchemaInterpretationMapping => Boolean(mapping))
    .slice(0, 12);
  return {
    mappings,
    source: "deterministic",
    summary:
      mappings.length > 0
        ? "Deterministic schema interpretation found reviewable evidence mappings."
        : "Deterministic schema interpretation found no confident mapping.",
  };
}

export async function requestAiSchemaInterpretation(
  input: SchemaInterpretationRequest,
  fallback: SchemaInterpretationResult,
  config: SchemaAiConfig,
): Promise<SchemaInterpretationResult> {
  if (!config.apiKey) return withFallback(fallback, "missing_api_key");
  if (config.provider !== "openai") return withFallback(fallback, "unsupported_provider");

  const taskConfig = resolveLlmTaskConfig("form_schema_interpretation");
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    config.timeoutMs ?? taskConfig.timeoutMs,
  );

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      body: JSON.stringify(buildRequestBody(input, config.model ?? taskConfig.model)),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    return withFallback(
      fallback,
      error instanceof Error && error.name === "AbortError"
        ? "request_timeout"
        : "network_error",
    );
  }
  clearTimeout(timeout);

  if (!response.ok) {
    return withFallback(
      fallback,
      response.status === 429 ? "provider_rate_limit" : "provider_unavailable",
    );
  }

  const json = await response.json().catch(() => null) as unknown;
  if (!isRecord(json) || json.status === "incomplete") {
    return withFallback(
      fallback,
      json && isRecord(json) && json.status === "incomplete"
        ? "model_response_truncated"
        : "model_response_invalid",
    );
  }
  if (typeof json.status === "string" && json.status !== "completed") {
    return withFallback(fallback, "provider_unavailable");
  }

  const content = responseOutputText(json);
  if (!content.trim()) return withFallback(fallback, "model_response_invalid");

  try {
    return {
      ...sanitizeSchemaInterpretation(JSON.parse(content), input),
      source: "llm",
    };
  } catch {
    return withFallback(fallback, "model_response_invalid");
  }
}

function parseField(value: unknown): SchemaFieldInterpretationInput {
  if (!isRecord(value)) {
    throw new SchemaInterpretationValidationError("Schema field must be an object.");
  }
  rejectUnsafeKeys(value, "schema field");
  rejectUnsupportedKeys(
    value,
    new Set(["fieldName", "fieldType", "label", "required"]),
    "schema field",
  );
  return {
    fieldName: requiredText(value.fieldName, "fieldName", 120),
    fieldType: optionalText(value.fieldType, 80) ?? undefined,
    label: optionalText(value.label, 160) ?? undefined,
    required: value.required === true,
  };
}

function inferMapping(
  field: SchemaFieldInterpretationInput,
): SchemaInterpretationMapping | null {
  const haystack = normalize(`${field.fieldName} ${field.label ?? ""} ${field.fieldType ?? ""}`);
  const match = EVIDENCE_PATTERNS.find(([, pattern]) => pattern.test(haystack));
  if (!match) return null;

  return {
    confidenceBucket: field.required ? "high" : "medium",
    evidenceNeed: match[0],
    fieldName: field.fieldName,
    rationale: "Matched schema field name, type, or label to an evidence need.",
  };
}

function sanitizeSchemaInterpretation(
  value: unknown,
  input: SchemaInterpretationRequest,
): Omit<SchemaInterpretationResult, "source"> {
  if (!isRecord(value) || !Array.isArray(value.mappings)) {
    throw new Error("Invalid schema interpretation.");
  }
  rejectUnsafeKeys(value, "schema interpretation");
  rejectUnsupportedKeys(value, new Set(["mappings", "summary"]), "schema interpretation");
  const knownFields = new Set(input.fields.map((field) => field.fieldName));
  const mappings = value.mappings.slice(0, 12).map((mapping) => {
    if (!isRecord(mapping)) throw new Error("Invalid schema mapping.");
    rejectUnsafeKeys(mapping, "schema mapping");
    rejectUnsupportedKeys(
      mapping,
      new Set(["confidenceBucket", "evidenceNeed", "fieldName", "rationale"]),
      "schema mapping",
    );
    const fieldName = requiredText(mapping.fieldName, "fieldName", 120);
    const evidenceNeed = requiredText(mapping.evidenceNeed, "evidenceNeed", 120);
    if (!knownFields.has(fieldName) || !EVIDENCE_NEEDS.includes(evidenceNeed as never)) {
      throw new Error("Schema mapping references unsupported fields.");
    }
    return {
      confidenceBucket: enumValue(
        mapping.confidenceBucket,
        ["high", "medium", "low"],
        "confidenceBucket",
      ),
      evidenceNeed,
      fieldName,
      rationale: requiredText(mapping.rationale, "rationale", 220),
    };
  });

  return {
    mappings,
    summary: optionalText(value.summary, 220) ?? "Schema interpretation returned reviewable mappings.",
  };
}

function buildRequestBody(input: SchemaInterpretationRequest, model: string) {
  return {
    input: [
      {
        content: [
          "Return JSON schema-only evidence mappings for a disaster response form.",
          "Use only fieldName, fieldType, label, and required metadata.",
          "Do not ask for or infer raw rows, sample values, files, OCR text, addresses, coordinates, prompts, model responses, or operational approval.",
          "Deterministic validation remains authoritative; output is advisory and review-only.",
        ].join(" "),
        role: "developer",
      },
      {
        content: JSON.stringify({
          fields: input.fields.map((field) => ({
            fieldName: safeText(field.fieldName, 120),
            fieldType: safeText(field.fieldType, 80),
            label: safeText(field.label, 160),
            required: field.required === true,
          })),
          formFamily: safeText(input.formFamily, 80),
          sourceKind: safeText(input.sourceKind, 80),
        }),
        role: "user",
      },
    ],
    max_output_tokens: 1_200,
    model,
    reasoning: {
      effort: "low",
    },
    store: false,
    text: {
      format: {
        name: "form_schema_interpretation",
        schema: {
          additionalProperties: false,
          properties: {
            mappings: {
              items: {
                additionalProperties: false,
                properties: {
                  confidenceBucket: {
                    enum: ["high", "medium", "low"],
                    type: "string",
                  },
                  evidenceNeed: { maxLength: 120, type: "string" },
                  fieldName: { maxLength: 120, type: "string" },
                  rationale: { maxLength: 220, type: "string" },
                },
                required: [
                  "confidenceBucket",
                  "evidenceNeed",
                  "fieldName",
                  "rationale",
                ],
                type: "object",
              },
              maxItems: 12,
              type: "array",
            },
            summary: { maxLength: 220, type: "string" },
          },
          required: ["mappings", "summary"],
          type: "object",
        },
        strict: true,
        type: "json_schema",
      },
      verbosity: "low",
    },
  };
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

function withFallback(
  fallback: SchemaInterpretationResult,
  fallbackReason: AiFallbackReason,
): SchemaInterpretationResult {
  return {
    ...fallback,
    fallbackReason,
    source: "deterministic",
  };
}

function rejectUnsafeKeys(value: Record<string, unknown>, context: string) {
  for (const key of Object.keys(value)) {
    if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(key) || UNSAFE_KEY_PATTERN.test(key)) {
      throw new SchemaInterpretationValidationError(`${context} includes unsupported data.`);
    }
  }
}

function rejectUnsupportedKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
  context: string,
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new SchemaInterpretationValidationError(`${context} includes unsupported data.`);
    }
  }
}

function requiredText(value: unknown, name: string, maxLength: number) {
  const text = optionalText(value, maxLength);
  if (!text) throw new SchemaInterpretationValidationError(`${name} is required.`);
  return text;
}

function optionalText(value: unknown, maxLength: number) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new SchemaInterpretationValidationError("Schema text fields must be strings.");
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new SchemaInterpretationValidationError("Schema text field is invalid.");
  }
  if (/(\n|,).*(\n|,)|<script|=cmd|=hyperlink|\+cmd/i.test(trimmed)) {
    throw new SchemaInterpretationValidationError("Schema text looks like pasted data.");
  }
  return trimmed;
}

function enumValue<T extends string>(value: unknown, allowed: T[], name: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new SchemaInterpretationValidationError(`${name} is unsupported.`);
  }
  return value as T;
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/[\r\n\t]/g, " ").trim().slice(0, maxLength)
    : undefined;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
