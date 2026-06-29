import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/db/serverClient", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import { aggregateUsageSummary, isAdminUser } from "@/lib/adminMetrics";
import { getMetadataDbAdapter, resetMetadataDbAdapterForTests } from "@/lib/db/metadataRuntime";

afterEach(() => {
  resetMetadataDbAdapterForTests();
  delete process.env.METADATA_STORE;
  vi.clearAllMocks();
});

describe("admin metrics", () => {
  it("denies admin access by default", () => {
    expect(isAdminUser("user-1", "user@example.org", {} as NodeJS.ProcessEnv)).toBe(false);
  });

  it("allows explicit admin users only", () => {
    expect(
      isAdminUser("user-1", "admin@example.org", {
        ADMIN_EMAILS: "admin@example.org",
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it("returns aggregate metadata shape only", async () => {
    await expect(aggregateUsageSummary()).resolves.toEqual({
      fallbackReasons: [],
      feedbackCount: 0,
      feedbackTags: [],
      templateCount: 0,
      usageEvents: 0,
    });
  });

  it("aggregates in-memory usage, fallback, feedback, and template metadata", async () => {
    const adapter = getMetadataDbAdapter();
    await adapter.createAiEvent({
      attemptedProviderCall: false,
      fallbackReason: "ai_disabled",
      promptVersion: "quality_repair_guidance.v1",
      route: "/api/coach",
      succeeded: false,
      taskType: "quality_repair_guidance",
      userId: "user-1",
    });
    await adapter.createFeedback({
      tags: ["useful", "missing-caveat"],
      thumb: "up",
      userId: "user-1",
    });
    await adapter.createCustomTemplate({
      ownerUserId: "user-1",
      title: "Draft response template",
    });

    await expect(aggregateUsageSummary()).resolves.toMatchObject({
      fallbackReasons: [{ count: 1, value: "ai_disabled" }],
      feedbackCount: 1,
      feedbackTags: [
        { count: 1, value: "missing-caveat" },
        { count: 1, value: "useful" },
      ],
      templateCount: 1,
      usageEvents: 1,
    });
  });

  it("queries Supabase admin aggregates with metadata-only column selections", async () => {
    const queries: Array<{
      columns: string;
      limit?: number;
      options?: unknown;
      table: string;
    }> = [];
    mocks.createServerSupabaseClient.mockReturnValue({
      from(table: string) {
        return {
          select(columns: string, options?: unknown) {
            const query: {
              columns: string;
              limit?: number;
              options?: unknown;
              table: string;
            } = { columns, options, table };
            queries.push(query);
            const result = supabaseResult(table);
            return {
              ...result,
              limit(limit: number) {
                query.limit = limit;
                return result;
              },
            };
          },
        };
      },
    });
    process.env.METADATA_STORE = "supabase";

    await expect(aggregateUsageSummary()).resolves.toEqual({
      fallbackReasons: [{ count: 2, value: "ai_disabled" }],
      feedbackCount: 3,
      feedbackTags: [{ count: 1, value: "useful" }],
      templateCount: 4,
      usageEvents: 2,
    });

    expect(queries).toEqual([
      {
        columns: "fallback_reason",
        limit: 500,
        options: { count: "exact" },
        table: "ai_events",
      },
      {
        columns: "tags",
        limit: 500,
        options: { count: "exact" },
        table: "feedback",
      },
      {
        columns: "id",
        options: { count: "exact", head: true },
        table: "custom_templates",
      },
    ]);
    expect(queries.map((query) => query.columns).join(" ")).not.toMatch(
      /\*|row|prompt|response|report|export|file/i,
    );
  });

  it("falls back to empty Supabase admin aggregates when metadata reads fail", async () => {
    mocks.createServerSupabaseClient.mockImplementation(() => {
      throw new Error("missing server config");
    });
    process.env.METADATA_STORE = "supabase";

    await expect(aggregateUsageSummary()).resolves.toEqual({
      fallbackReasons: [],
      feedbackCount: 0,
      feedbackTags: [],
      templateCount: 0,
      usageEvents: 0,
    });
  });
});

function supabaseResult(table: string) {
  if (table === "ai_events") {
    return {
      count: 2,
      data: [
        { fallback_reason: "ai_disabled" },
        { fallback_reason: "ai_disabled" },
      ],
      error: null,
    };
  }
  if (table === "feedback") {
    return {
      count: 3,
      data: [{ tags: ["useful"] }],
      error: null,
    };
  }
  return {
    count: 4,
    data: null,
    error: null,
  };
}
