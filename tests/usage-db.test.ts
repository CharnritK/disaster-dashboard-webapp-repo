import { describe, expect, it } from "vitest";

import { InMemoryMetadataDbAdapter } from "@/lib/db/metadataAdapter";
import { MetadataEntitlementStore } from "@/lib/entitlement";

describe("DB-backed usage and AI event accounting", () => {
  it("reserves usage through the metadata adapter", async () => {
    const adapter = new InMemoryMetadataDbAdapter();
    const store = new MetadataEntitlementStore(adapter, { dailyLimit: () => 1 });
    const usageDate = "2026-06-14";

    await expect(
      store.reserveAiUsage("user-1", usageDate, "dashboard_synthesis"),
    ).resolves.toMatchObject({
      reserved: true,
      used: 1,
    });

    await expect(
      store.reserveAiUsage("user-1", usageDate, "dashboard_synthesis"),
    ).resolves.toMatchObject({
      reason: "quota_exceeded",
      reserved: false,
      used: 1,
    });

    await expect(store.getDailyUsage("user-1", usageDate)).resolves.toMatchObject({
      limit: 1,
      remaining: 0,
      used: 1,
    });
  });

  it("persists safe event metadata and prompt versions through the adapter", async () => {
    const adapter = new InMemoryMetadataDbAdapter();
    const store = new MetadataEntitlementStore(adapter, { dailyLimit: () => 20 });

    const event = await store.recordAiEvent({
      attemptedProviderCall: true,
      metadata: {
        profile_count: 2,
      },
      model: "gpt-5.4-mini",
      provider: "openai",
      route: "/api/recommend",
      taskType: "workflow_harmonization",
      userId: "user-1",
    });

    expect(event).toMatchObject({
      attemptedProviderCall: true,
      promptVersion: "workflow_harmonization:v1",
      succeeded: false,
    });

    await expect(
      store.markAiEventComplete(event.id, {
        succeeded: true,
      }),
    ).resolves.toMatchObject({
      succeeded: true,
    });
  });

  it("does not increment denied entitlement checks", async () => {
    const adapter = new InMemoryMetadataDbAdapter();
    const store = new MetadataEntitlementStore(adapter, { dailyLimit: () => 20 });

    await expect(
      store.checkAiEntitlement(
        {
          source: "supabase",
          userId: "not-allowed",
        },
        "dashboard_synthesis",
      ),
    ).resolves.toMatchObject({
      allowed: false,
      reason: "not_entitled",
      used: 0,
    });

    await expect(store.getDailyUsage("not-allowed", "2026-06-14")).resolves.toMatchObject({
      used: 0,
    });
  });
});
