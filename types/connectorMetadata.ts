export type ConnectorProvider = "kobo" | "odk" | "google_forms";

export type ConnectorSyncStatus =
  | "synced"
  | "syncing"
  | "stale"
  | "error"
  | "review_required"
  | "not_connected";

export type ConnectorStatusClassification = "ready" | "review" | "blocker";

export type ConnectorCountKey =
  | "submissionCount"
  | "acceptedCount"
  | "rejectedCount"
  | "errorCount"
  | "warningCount"
  | "updatedSinceLastSyncCount";

export type ConnectorFreshnessBucket =
  | "under_1h"
  | "under_24h"
  | "1d_7d"
  | "over_7d"
  | "unknown";

export type ConnectorVolumeBucket = "none" | "low" | "medium" | "high" | "unknown";
export type ConnectorErrorRateBucket = "none" | "low" | "elevated" | "high" | "unknown";

export type ConnectorTimestampKey =
  | "connectedAt"
  | "lastSyncAt"
  | "lastSuccessfulSyncAt"
  | "statusUpdatedAt";

export type ConnectorCounts = Partial<Record<ConnectorCountKey, number>>;

export type ConnectorBuckets = {
  freshness?: ConnectorFreshnessBucket;
  volume?: ConnectorVolumeBucket;
  errorRate?: ConnectorErrorRateBucket;
};

export type ConnectorTimestamps = Partial<Record<ConnectorTimestampKey, string>>;

export type ConnectorSchemaMetadata = {
  fieldCount: number;
};

export type ConnectorSourceMetadata = {
  provider: ConnectorProvider;
  connectorRef: string;
  connectorHash: string;
  status: ConnectorSyncStatus;
  counts?: ConnectorCounts;
  buckets?: ConnectorBuckets;
  timestamps?: ConnectorTimestamps;
  caveats?: string[];
  schema: ConnectorSchemaMetadata;
};

export type ConnectorSourceMetadataInput = ConnectorSourceMetadata;

export type ConnectorStatusRepairSummary = {
  id: string;
  issueType: "connector_metadata";
  severity: "info" | "review" | "blocker";
  title: string;
  rationale: string;
  action: string;
  appCanHelpWith: string[];
  humanMustReview: string;
  safeAutomationLevel: "suggest_only";
  provider: ConnectorProvider;
  connectorRef: string;
  status: ConnectorSyncStatus;
  classification: ConnectorStatusClassification;
  caveats: string[];
};
