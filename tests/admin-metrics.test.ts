import { afterEach, describe, expect, it } from "vitest";

import { aggregateUsageSummary, isAdminUser } from "@/lib/adminMetrics";
import { getMetadataDbAdapter, resetMetadataDbAdapterForTests } from "@/lib/db/metadataRuntime";

afterEach(() => {
  resetMetadataDbAdapterForTests();
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
});
