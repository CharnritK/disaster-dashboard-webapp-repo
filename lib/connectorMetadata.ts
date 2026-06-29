import type {
  ConnectorBuckets,
  ConnectorCountKey,
  ConnectorCounts,
  ConnectorErrorRateBucket,
  ConnectorFreshnessBucket,
  ConnectorProvider,
  ConnectorSchemaMetadata,
  ConnectorSourceMetadata,
  ConnectorStatusClassification,
  ConnectorStatusRepairSummary,
  ConnectorSyncStatus,
  ConnectorTimestampKey,
  ConnectorTimestamps,
  ConnectorVolumeBucket,
} from "@/types/connectorMetadata";

const MAX_REFERENCE_LENGTH = 160;
const MAX_CAVEATS = 8;
const MAX_CAVEAT_LENGTH = 240;

const ALLOWED_TOP_LEVEL_KEYS = new Set([
  "provider",
  "connectorRef",
  "connectorHash",
  "status",
  "counts",
  "buckets",
  "timestamps",
  "caveats",
  "schema",
]);

const CONNECTOR_PROVIDERS = new Set<ConnectorProvider>([
  "kobo",
  "odk",
  "google_forms",
]);

const SYNC_STATUSES = new Set<ConnectorSyncStatus>([
  "synced",
  "syncing",
  "stale",
  "error",
  "review_required",
  "not_connected",
]);

const COUNT_KEYS = new Set<ConnectorCountKey>([
  "submissionCount",
  "acceptedCount",
  "rejectedCount",
  "errorCount",
  "warningCount",
  "updatedSinceLastSyncCount",
]);

const FRESHNESS_BUCKETS = new Set<ConnectorFreshnessBucket>([
  "under_1h",
  "under_24h",
  "1d_7d",
  "over_7d",
  "unknown",
]);

const VOLUME_BUCKETS = new Set<ConnectorVolumeBucket>([
  "none",
  "low",
  "medium",
  "high",
  "unknown",
]);

const ERROR_RATE_BUCKETS = new Set<ConnectorErrorRateBucket>([
  "none",
  "low",
  "elevated",
  "high",
  "unknown",
]);

const TIMESTAMP_KEYS = new Set<ConnectorTimestampKey>([
  "connectedAt",
  "lastSyncAt",
  "lastSuccessfulSyncAt",
  "statusUpdatedAt",
]);

const SECRET_KEY_PATTERN =
  /(api[_-]?key|authorization|bearer|client[_-]?secret|cookie|credential|oauth|password|refresh[_-]?token|secret|session|token)/i;
const RAW_DATA_KEY_PATTERN =
  /(example|fieldvalues?|rawvalues?|records?|response(rows?)?|rows?|sample(values?)?|submissions?)/i;
const BACKGROUND_KEY_PATTERN =
  /(background|cron|interval|job|polling|queue|schedule|webhook|worker)/i;
const PROMPT_KEY_PATTERN = /(completion|llm|modelresponse|model[_-]?response|prompt)/i;
const FILE_KEY_PATTERN = /(attachment|blob|file|files|filename|path)/i;
const QUERY_SECRET_PATTERN =
  /(access[_-]?token|api[_-]?key|auth|code|credential|key|password|refresh[_-]?token|secret|sig|signature|token)/i;

export function buildConnectorSourceMetadata(input: unknown): ConnectorSourceMetadata {
  if (!isRecord(input)) throw new Error("Connector metadata must be a JSON object.");

  assertNoUnsafeConnectorContent(input);
  assertAllowedKeys(input, ALLOWED_TOP_LEVEL_KEYS, "connector metadata");

  const provider = parseProvider(input.provider);
  const connectorRef = parseOpaqueReference(input.connectorRef, "connectorRef");
  const connectorHash = parseOpaqueReference(input.connectorHash, "connectorHash");
  const status = parseStatus(input.status);
  const counts = parseCounts(input.counts);
  const buckets = parseBuckets(input.buckets);
  const timestamps = parseTimestamps(input.timestamps);
  const caveats = parseCaveats(input.caveats);
  const schema = parseSchema(input.schema);

  return stripUndefined({
    provider,
    connectorRef,
    connectorHash,
    status,
    counts,
    buckets,
    timestamps,
    caveats,
    schema,
  });
}

export function classifyConnectorSyncStatus(
  status: ConnectorSyncStatus,
): ConnectorStatusClassification {
  if (status === "synced") return "ready";
  if (status === "error" || status === "not_connected") return "blocker";
  return "review";
}

export function summarizeConnectorStatusForRepair(
  metadata: ConnectorSourceMetadata,
): ConnectorStatusRepairSummary {
  const classification = classifyConnectorSyncStatus(metadata.status);
  const severity = classification === "ready" ? "info" : classification;
  const providerLabel = providerLabels[metadata.provider];

  return {
    id: `connector-${classification}-${metadata.provider}-${slugify(metadata.connectorRef)}`,
    issueType: "connector_metadata",
    severity,
    title: connectorStatusTitles[metadata.status],
    rationale:
      classification === "ready"
        ? `${providerLabel} source metadata is current enough for deterministic workflow checks.`
        : `${providerLabel} source metadata needs review before treating connector-backed evidence as current.`,
    action:
      classification === "blocker"
        ? "Resolve the connector status with the source owner, then refresh metadata before decision review."
        : classification === "review"
          ? "Review connector freshness, counts, and caveats before relying on this source in a handoff."
          : "Keep this metadata-only connector status available for later handoff review.",
    appCanHelpWith: [
      "Show connector freshness, status, aggregate counts, and caveats.",
      "Keep source content, credentials, files, prompts, and model outputs out of persisted metadata.",
    ],
    humanMustReview:
      classification === "ready"
        ? "Confirm the connector source is appropriate for the decision context."
        : "Confirm the connector source status with the source owner before treating it as decision-ready.",
    safeAutomationLevel: "suggest_only",
    provider: metadata.provider,
    connectorRef: metadata.connectorRef,
    status: metadata.status,
    classification,
    caveats: metadata.caveats ?? [],
  };
}

function parseProvider(value: unknown): ConnectorProvider {
  if (typeof value === "string" && CONNECTOR_PROVIDERS.has(value as ConnectorProvider)) {
    return value as ConnectorProvider;
  }
  throw new Error("provider must be kobo, odk, or google_forms.");
}

function parseStatus(value: unknown): ConnectorSyncStatus {
  if (typeof value === "string" && SYNC_STATUSES.has(value as ConnectorSyncStatus)) {
    return value as ConnectorSyncStatus;
  }
  throw new Error("status must be a supported connector sync status.");
}

function parseOpaqueReference(value: unknown, label: "connectorRef" | "connectorHash") {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be an opaque connector reference.`);
  }
  const normalized = value.trim();
  if (normalized.length > MAX_REFERENCE_LENGTH) {
    throw new Error(`${label} is too long for metadata storage.`);
  }
  if (/^https?:\/\//i.test(normalized) || normalized.includes("?") || normalized.includes("&")) {
    throw new Error(`${label} must be opaque and cannot include URLs or query strings.`);
  }
  if (!/^[a-z0-9:_-]+$/i.test(normalized)) {
    throw new Error(`${label} must use only opaque reference characters.`);
  }
  return normalized;
}

function parseCounts(input: unknown): ConnectorCounts | undefined {
  if (input === undefined) return undefined;
  if (!isRecord(input)) throw new Error("counts must be a metadata object.");
  assertAllowedKeys(input, COUNT_KEYS, "counts");

  const counts: ConnectorCounts = {};
  for (const [key, value] of Object.entries(input)) {
    if (!COUNT_KEYS.has(key as ConnectorCountKey)) continue;
    counts[key as ConnectorCountKey] = parseNonNegativeInteger(value, `counts.${key}`);
  }
  return Object.keys(counts).length > 0 ? counts : undefined;
}

function parseBuckets(input: unknown): ConnectorBuckets | undefined {
  if (input === undefined) return undefined;
  if (!isRecord(input)) throw new Error("buckets must be a metadata object.");
  assertAllowedKeys(input, new Set(["freshness", "volume", "errorRate"]), "buckets");

  const buckets: ConnectorBuckets = {};
  if (input.freshness !== undefined) {
    if (typeof input.freshness !== "string" || !FRESHNESS_BUCKETS.has(input.freshness as ConnectorFreshnessBucket)) {
      throw new Error("buckets.freshness must be an approved freshness bucket.");
    }
    buckets.freshness = input.freshness as ConnectorFreshnessBucket;
  }
  if (input.volume !== undefined) {
    if (typeof input.volume !== "string" || !VOLUME_BUCKETS.has(input.volume as ConnectorVolumeBucket)) {
      throw new Error("buckets.volume must be an approved volume bucket.");
    }
    buckets.volume = input.volume as ConnectorVolumeBucket;
  }
  if (input.errorRate !== undefined) {
    if (typeof input.errorRate !== "string" || !ERROR_RATE_BUCKETS.has(input.errorRate as ConnectorErrorRateBucket)) {
      throw new Error("buckets.errorRate must be an approved error-rate bucket.");
    }
    buckets.errorRate = input.errorRate as ConnectorErrorRateBucket;
  }
  return Object.keys(buckets).length > 0 ? buckets : undefined;
}

function parseTimestamps(input: unknown): ConnectorTimestamps | undefined {
  if (input === undefined) return undefined;
  if (!isRecord(input)) throw new Error("timestamps must be a metadata object.");
  assertAllowedKeys(input, TIMESTAMP_KEYS, "timestamps");

  const timestamps: ConnectorTimestamps = {};
  for (const [key, value] of Object.entries(input)) {
    if (!TIMESTAMP_KEYS.has(key as ConnectorTimestampKey)) continue;
    if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
      throw new Error(`timestamps.${key} must be an ISO timestamp string.`);
    }
    timestamps[key as ConnectorTimestampKey] = value.trim();
  }
  return Object.keys(timestamps).length > 0 ? timestamps : undefined;
}

function parseCaveats(input: unknown): string[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) throw new Error("caveats must be an array of metadata strings.");
  const caveats = input
    .map((value) => {
      if (typeof value !== "string") throw new Error("caveats must contain only strings.");
      return stripHtml(value).trim();
    })
    .filter(Boolean)
    .slice(0, MAX_CAVEATS)
    .map((value) => truncate(value, MAX_CAVEAT_LENGTH));
  return caveats.length > 0 ? caveats : undefined;
}

function parseSchema(input: unknown): ConnectorSchemaMetadata {
  if (!isRecord(input)) throw new Error("schema must include fieldCount metadata only.");
  assertAllowedKeys(input, new Set(["fieldCount"]), "schema");
  return {
    fieldCount: parseNonNegativeInteger(input.fieldCount, "schema.fieldCount"),
  };
}

function parseNonNegativeInteger(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return value;
}

function assertNoUnsafeConnectorContent(value: unknown, path = "connector metadata") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUnsafeConnectorContent(item, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) {
    if (typeof value === "string") assertNoUrlWithQuerySecret(value, path);
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    const lowerKey = key.toLowerCase();
    const childPath = `${path}.${key}`;
    if (path.endsWith(".schema") && key !== "fieldCount") {
      throw new Error("schema must include fieldCount metadata only.");
    }
    if (SECRET_KEY_PATTERN.test(key)) {
      throw new Error("Connector metadata cannot include credentials, tokens, or secrets.");
    }
    if (PROMPT_KEY_PATTERN.test(lowerKey)) {
      throw new Error("Connector metadata cannot include prompts or model responses.");
    }
    if (BACKGROUND_KEY_PATTERN.test(lowerKey)) {
      throw new Error("Connector metadata cannot include background job or schedule configuration.");
    }
    if (FILE_KEY_PATTERN.test(lowerKey)) {
      throw new Error("Connector metadata cannot include unsupported raw files or file references.");
    }
    if (isRawDataKey(key, path)) {
      throw new Error("Connector metadata cannot include raw response rows, submissions, or source values.");
    }
    if (typeof child === "string") assertNoUrlWithQuerySecret(child, childPath);
    assertNoUnsafeConnectorContent(child, childPath);
  }
}

function isRawDataKey(key: string, path: string) {
  if (path.endsWith(".counts") && COUNT_KEYS.has(key as ConnectorCountKey)) return false;
  if (path.endsWith(".schema") && key === "fieldCount") return false;
  return RAW_DATA_KEY_PATTERN.test(key);
}

function assertNoUrlWithQuerySecret(value: string, path: string) {
  if (!/^https?:\/\//i.test(value)) return;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${path} cannot include a URL in connector metadata.`);
  }
  for (const key of parsed.searchParams.keys()) {
    if (QUERY_SECRET_PATTERN.test(key)) {
      throw new Error("Connector metadata cannot include URLs with query secrets.");
    }
  }
}

function assertAllowedKeys(
  record: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
  label: string,
) {
  const unsupported = Object.keys(record).filter((key) => !allowedKeys.has(key));
  if (unsupported.length > 0) {
    throw new Error(`${label} includes unsupported metadata keys: ${unsupported.join(", ")}.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function stripUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "connector";
}

const providerLabels: Record<ConnectorProvider, string> = {
  google_forms: "Google Forms",
  kobo: "KoBo",
  odk: "ODK",
};

const connectorStatusTitles: Record<ConnectorSyncStatus, string> = {
  error: "Connector sync error",
  not_connected: "Connector is not connected",
  review_required: "Connector status needs review",
  stale: "Connector metadata is stale",
  synced: "Connector metadata is current",
  syncing: "Connector sync is in progress",
};
