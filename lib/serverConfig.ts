function numberFromEnv(name: string, fallback: number, min = 0) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(min, value) : fallback;
}

function booleanFromEnv(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return !["0", "false", "off", "no"].includes(raw.trim().toLowerCase());
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

const defaultLlmTimeoutMs = numberFromEnv("LLM_REQUEST_TIMEOUT_MS", 15_000, 1_000);

export const llmServerConfig = {
  enabled: booleanFromEnv("LLM_ENABLED", true),
  apiKey: process.env.LLM_API_KEY,
  provider: process.env.LLM_PROVIDER ?? "openai",
  model: process.env.LLM_MODEL ?? "gpt-5.4-mini",
  workflowTimeoutMs: numberFromEnv("LLM_WORKFLOW_REQUEST_TIMEOUT_MS", defaultLlmTimeoutMs, 1_000),
  dashboardTimeoutMs: numberFromEnv("LLM_DASHBOARD_REQUEST_TIMEOUT_MS", Math.max(defaultLlmTimeoutMs, 45_000), 1_000),
  maxCompletionTokens: numberFromEnv("LLM_MAX_COMPLETION_TOKENS", 3_200, 100)
};
