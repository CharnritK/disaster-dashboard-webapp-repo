import type { CopilotTaskType, RecommendationScope } from "@/types/recommendations";

export type LlmReasoningEffort =
  | "none"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export type LlmTextVerbosity = "low" | "medium" | "high";

export type LlmTaskConfig = {
  taskType: CopilotTaskType;
  model: string;
  reasoningEffort: LlmReasoningEffort;
  verbosity: LlmTextVerbosity;
  timeoutMs: number;
  maxOutputTokens: number;
};

function numberFromEnv(name: string, fallback: number, min = 0) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(min, value) : fallback;
}

function stringFromEnv(
  env: NodeJS.ProcessEnv,
  name: string,
): string | undefined {
  const raw = env[name];
  return raw?.trim() ? raw : undefined;
}

export function booleanFromEnv(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return !["0", "false", "off", "no"].includes(raw.trim().toLowerCase());
}

function modelFromEnv(
  env: NodeJS.ProcessEnv,
  taskModelName: string,
  taskDefault: string,
) {
  return env[taskModelName] ?? env.LLM_MODEL ?? taskDefault;
}

function numberFromRecord(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
  min = 0,
) {
  const raw = env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(min, value) : fallback;
}

export const recommendationApiConfig = {
  requestMaxBytes: numberFromEnv("RECOMMEND_REQUEST_MAX_BYTES", 200_000, 1_000),
  rateLimitMaxRequests: numberFromEnv("RECOMMEND_RATE_LIMIT_MAX_REQUESTS", 20, 0),
  rateLimitWindowMs: numberFromEnv("RECOMMEND_RATE_LIMIT_WINDOW_MS", 60_000, 1_000),
  maxProfiles: numberFromEnv("RECOMMEND_MAX_PROFILES", 4, 1),
  maxColumnsPerProfile: numberFromEnv("RECOMMEND_MAX_COLUMNS_PER_PROFILE", 80, 1),
  maxSampleValuesPerColumn: numberFromEnv("RECOMMEND_MAX_SAMPLE_VALUES_PER_COLUMN", 5, 0),
  maxStringLength: numberFromEnv("RECOMMEND_MAX_STRING_LENGTH", 240, 16),
  maxDashboardFacts: numberFromEnv("RECOMMEND_MAX_DASHBOARD_FACTS", 14, 0),
  maxSummaryItems: numberFromEnv("RECOMMEND_MAX_SUMMARY_ITEMS", 8, 0)
};

export function getLlmServerConfig(env: NodeJS.ProcessEnv = process.env) {
  const defaultLlmTimeoutMs = numberFromRecord(
    env,
    "LLM_REQUEST_TIMEOUT_MS",
    15_000,
    1_000,
  );
  const defaultMaxOutputTokens = numberFromRecord(
    env,
    "LLM_MAX_COMPLETION_TOKENS",
    3_200,
    100,
  );

  return {
    enabled: booleanFromEnvRecord(env, "LLM_ENABLED", false),
    apiKey: stringFromEnv(env, "LLM_API_KEY") ?? stringFromEnv(env, "OPENAI_API_KEY"),
    provider: env.LLM_PROVIDER ?? "openai",
    model: env.LLM_MODEL ?? "gpt-5.4-mini",
    workflowTimeoutMs: numberFromRecord(
      env,
      "LLM_WORKFLOW_REQUEST_TIMEOUT_MS",
      defaultLlmTimeoutMs,
      1_000,
    ),
    dashboardTimeoutMs: numberFromRecord(
      env,
      "LLM_DASHBOARD_REQUEST_TIMEOUT_MS",
      Math.max(defaultLlmTimeoutMs, 45_000),
      1_000,
    ),
    handoffTimeoutMs: numberFromRecord(
      env,
      "LLM_HANDOFF_REQUEST_TIMEOUT_MS",
      Math.max(defaultLlmTimeoutMs, 30_000),
      1_000,
    ),
    maxCompletionTokens: defaultMaxOutputTokens,
    maxOutputTokens: defaultMaxOutputTokens,
  };
}

export const llmServerConfig = getLlmServerConfig();

function booleanFromEnvRecord(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: boolean,
) {
  const raw = env[name];
  if (!raw) return fallback;
  return !["0", "false", "off", "no"].includes(raw.trim().toLowerCase());
}

export function copilotTaskForRecommendationScope(
  scope: RecommendationScope,
): CopilotTaskType {
  return scope === "workflow" ? "workflow_harmonization" : "dashboard_synthesis";
}

export function resolveLlmTaskConfig(
  taskType: CopilotTaskType,
  env: NodeJS.ProcessEnv = process.env,
): LlmTaskConfig {
  const sharedTokenBudget = numberFromRecord(
    env,
    "LLM_MAX_COMPLETION_TOKENS",
    3_200,
    100,
  );
  const baseTimeout = numberFromRecord(
    env,
    "LLM_REQUEST_TIMEOUT_MS",
    15_000,
    1_000,
  );

  if (taskType === "workflow_harmonization") {
    return {
      taskType,
      model: modelFromEnv(env, "LLM_WORKFLOW_MODEL", "gpt-5.4-mini"),
      reasoningEffort: "low",
      verbosity: "low",
      timeoutMs: numberFromRecord(env, "LLM_WORKFLOW_REQUEST_TIMEOUT_MS", baseTimeout, 1_000),
      maxOutputTokens: sharedTokenBudget,
    };
  }

  if (taskType === "quality_repair_guidance") {
    return {
      taskType,
      model: modelFromEnv(env, "LLM_QUALITY_GUIDANCE_MODEL", "gpt-5.4-mini"),
      reasoningEffort: "low",
      verbosity: "medium",
      timeoutMs: baseTimeout,
      maxOutputTokens: sharedTokenBudget,
    };
  }

  if (taskType === "decision_handoff_summary") {
    return {
      taskType,
      model: modelFromEnv(env, "LLM_HANDOFF_MODEL", "gpt-5.5"),
      reasoningEffort: "medium",
      verbosity: "medium",
      timeoutMs: numberFromRecord(
        env,
        "LLM_HANDOFF_REQUEST_TIMEOUT_MS",
        Math.max(baseTimeout, 30_000),
        1_000,
      ),
      maxOutputTokens: sharedTokenBudget,
    };
  }

  return {
    taskType,
    model: modelFromEnv(env, "LLM_DASHBOARD_MODEL", "gpt-5.5"),
    reasoningEffort: "medium",
    verbosity: "medium",
    timeoutMs: numberFromRecord(
      env,
      "LLM_DASHBOARD_REQUEST_TIMEOUT_MS",
      Math.max(baseTimeout, 45_000),
      1_000,
    ),
    maxOutputTokens: sharedTokenBudget,
  };
}
