import { describe, expect, it } from "vitest";

import {
  entitlementIdentity,
  InMemoryEntitlementStore,
  isAiBetaEntitled,
  readDailyAiQuota,
  usageLocalDate,
} from "@/lib/entitlement";

describe("AI entitlement and quota accounting", () => {
  it("buckets usage dates in Asia/Bangkok", () => {
    expect(usageLocalDate(new Date("2026-06-13T16:59:59.000Z"))).toBe("2026-06-13");
    expect(usageLocalDate(new Date("2026-06-13T17:00:00.000Z"))).toBe("2026-06-14");
  });

  it("reserves provider attempts up to the daily limit", async () => {
    const store = new InMemoryEntitlementStore({ dailyLimit: () => 2 });
    const localDate = "2026-06-14";

    await expect(
      store.getDailyUsage("user-1", localDate),
    ).resolves.toMatchObject({ limit: 2, remaining: 2, used: 0 });

    await expect(
      store.reserveAiUsage("user-1", localDate, "dashboard_synthesis"),
    ).resolves.toMatchObject({ reserved: true, used: 1 });

    await expect(
      store.reserveAiUsage("user-1", localDate, "dashboard_synthesis"),
    ).resolves.toMatchObject({ reserved: true, used: 2 });

    await expect(
      store.reserveAiUsage("user-1", localDate, "dashboard_synthesis"),
    ).resolves.toMatchObject({
      reason: "quota_exceeded",
      reserved: false,
      used: 2,
    });
  });

  it("keeps usage separate across users and dates", async () => {
    const store = new InMemoryEntitlementStore({ dailyLimit: () => 1 });

    await store.reserveAiUsage("user-1", "2026-06-14", "workflow_harmonization");
    await store.reserveAiUsage("user-2", "2026-06-14", "workflow_harmonization");
    await store.reserveAiUsage("user-1", "2026-06-15", "workflow_harmonization");

    await expect(store.getDailyUsage("user-1", "2026-06-14")).resolves.toMatchObject({ used: 1 });
    await expect(store.getDailyUsage("user-2", "2026-06-14")).resolves.toMatchObject({ used: 1 });
    await expect(store.getDailyUsage("user-1", "2026-06-15")).resolves.toMatchObject({ used: 1 });
  });

  it("falls back to the approved default quota when env values are absent or invalid", () => {
    expect(readDailyAiQuota({ NODE_ENV: "test" } as NodeJS.ProcessEnv)).toBe(20);
    expect(readDailyAiQuota({ AI_DAILY_QUOTA: "0", NODE_ENV: "test" } as NodeJS.ProcessEnv)).toBe(20);
    expect(readDailyAiQuota({ AI_DAILY_QUOTA: "3", NODE_ENV: "test" } as NodeJS.ProcessEnv)).toBe(3);
  });

  it("requires explicit beta entitlement for real Supabase users", async () => {
    const store = new InMemoryEntitlementStore({ dailyLimit: () => 2 });

    await expect(
      store.checkAiEntitlement(
        {
          email: "unlisted@example.org",
          source: "supabase",
          userId: "supabase-user-1",
        },
        "dashboard_synthesis",
      ),
    ).resolves.toMatchObject({
      allowed: false,
      reason: "not_entitled",
    });
  });

  it("allows configured beta users and test identities", () => {
    expect(
      isAiBetaEntitled(
        entitlementIdentity({
          email: "Analyst@Example.org",
          source: "supabase",
          userId: "supabase-user-1",
        }),
        {
          AI_BETA_ALLOWED_EMAILS: "analyst@example.org",
          NODE_ENV: "production",
        } as NodeJS.ProcessEnv,
      ),
    ).toBe(true);

    expect(
      isAiBetaEntitled(
        entitlementIdentity({
          source: "test",
          userId: "analyst-1",
        }),
        {} as NodeJS.ProcessEnv,
      ),
    ).toBe(true);
  });
});
