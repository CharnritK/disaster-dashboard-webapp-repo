import { describe, expect, it } from "vitest";

import {
  buildConnectorSourceMetadata,
  classifyConnectorSyncStatus,
  summarizeConnectorStatusForRepair,
} from "@/lib/connectorMetadata";
import type { ConnectorSourceMetadataInput } from "@/types/connectorMetadata";

describe("connector metadata", () => {
  it("accepts safe metadata-only connector source records", () => {
    const metadata = buildConnectorSourceMetadata({
      buckets: {
        freshness: "under_24h",
        volume: "medium",
      },
      caveats: ["Field mapping requires reviewer confirmation."],
      connectorHash: "sha256:connector-profile",
      connectorRef: "conn_kobo_7f43d",
      counts: {
        errorCount: 0,
        submissionCount: 42,
        updatedSinceLastSyncCount: 3,
      },
      provider: "kobo",
      schema: {
        fieldCount: 12,
      },
      status: "synced",
      timestamps: {
        connectedAt: "2026-06-01T00:00:00.000Z",
        lastSuccessfulSyncAt: "2026-06-27T11:00:00.000Z",
        lastSyncAt: "2026-06-27T11:00:00.000Z",
      },
    });

    expect(metadata).toMatchObject({
      connectorHash: "sha256:connector-profile",
      connectorRef: "conn_kobo_7f43d",
      provider: "kobo",
      schema: {
        fieldCount: 12,
      },
      status: "synced",
    });
    expect(JSON.stringify(metadata)).not.toMatch(/token|secret|credential|district_code|D01/i);
  });

  it("classifies stale, error, and review statuses for later repair actions", () => {
    expect(classifyConnectorSyncStatus("synced")).toBe("ready");
    expect(classifyConnectorSyncStatus("stale")).toBe("review");
    expect(classifyConnectorSyncStatus("review_required")).toBe("review");
    expect(classifyConnectorSyncStatus("error")).toBe("blocker");

    const summary = summarizeConnectorStatusForRepair(
      buildConnectorSourceMetadata({
        ...safeConnectorInput(),
        caveats: ["Source owner needs to confirm the latest form version."],
        status: "review_required",
      }),
    );

    expect(summary).toMatchObject({
      connectorRef: "conn_odk_review",
      issueType: "connector_metadata",
      safeAutomationLevel: "suggest_only",
      severity: "review",
      status: "review_required",
    });
    expect(summary.action).toMatch(/review/i);
  });

  it("rejects credentials, tokens, secrets, and URLs with query secrets", () => {
    for (const unsafe of [
      { apiToken: "kobo-token-123" },
      { credentials: { password: "pass", username: "analyst" } },
      { oauthRefreshToken: "refresh-token" },
      { secret: "client-secret" },
      { sourceUrl: "https://example.test/form?id=1&token=secret-value" },
    ]) {
      expect(() =>
        buildConnectorSourceMetadata({
          ...safeConnectorInput(),
          ...unsafe,
        }),
      ).toThrow(/credential|secret|token|query/i);
    }
  });

  it("rejects rows, submissions, files, prompts, model responses, and background sync config", () => {
    for (const unsafe of [
      { backgroundJob: { id: "job-1" } },
      { files: [{ name: "submissions.csv" }] },
      { modelResponse: "Use the latest submissions." },
      { prompt: "Summarize these responses." },
      { responseRows: [{ district_code: "D01", need: "water" }] },
      { submissions: [{ _id: "uuid", district_code: "D01" }] },
      { syncSchedule: { cron: "*/10 * * * *" } },
    ]) {
      expect(() =>
        buildConnectorSourceMetadata({
          ...safeConnectorInput(),
          ...unsafe,
        }),
      ).toThrow(/unsupported|raw|background|prompt|model response/i);
    }
  });

  it("keeps schema to field count only and excludes raw source values", () => {
    expect(() =>
      buildConnectorSourceMetadata({
        ...safeConnectorInput(),
        rawValues: ["D01", "water"],
      }),
    ).toThrow(/raw/i);

    expect(() =>
      buildConnectorSourceMetadata({
        ...safeConnectorInput(),
        schema: {
          fieldCount: 8,
          fields: [{ name: "district_code", sampleValues: ["D01"] }],
        },
      }),
    ).toThrow(/schema/i);

    const metadata = buildConnectorSourceMetadata({
      ...safeConnectorInput(),
      schema: {
        fieldCount: 8,
      },
    });

    expect(Object.keys(metadata.schema)).toEqual(["fieldCount"]);
    expect(JSON.stringify(metadata)).not.toMatch(/district_code|D01|water/i);
  });
});

function safeConnectorInput(
  overrides: Partial<ConnectorSourceMetadataInput> = {},
): ConnectorSourceMetadataInput {
  return {
    buckets: {
      freshness: "under_24h",
      volume: "low",
    },
    caveats: ["Metadata reflects source health only."],
    connectorHash: "sha256:odk-review",
    connectorRef: "conn_odk_review",
    counts: {
      errorCount: 1,
      submissionCount: 15,
    },
    provider: "odk",
    schema: {
      fieldCount: 8,
    },
    status: "synced",
    timestamps: {
      connectedAt: "2026-06-01T00:00:00.000Z",
      lastSyncAt: "2026-06-27T11:00:00.000Z",
    },
    ...overrides,
  };
}
