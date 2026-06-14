import { afterEach, describe, expect, it } from "vitest";

import { GET as getUsageRoute } from "@/app/api/usage/route";
import { TEST_USER_HEADER } from "@/lib/auth/requestAuth";
import {
  getEntitlementService,
  resetEntitlementServiceForTests,
  usageLocalDate,
} from "@/lib/entitlement";
import { usageCopy } from "@/lib/useAiUsage";

afterEach(() => {
  resetEntitlementServiceForTests();
});

describe("usage API and meter copy", () => {
  it("returns unauthenticated CTA-only state without usage details", async () => {
    const response = await getUsageRoute(new Request("http://localhost/api/usage"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      authenticated: false,
      fallbackReason: "unauthenticated",
      message: "Sign in to use AI-assisted workflow.",
    });
  });

  it("returns authenticated daily usage snapshots", async () => {
    const today = usageLocalDate();
    await getEntitlementService().reserveAiUsage(
      "analyst-1",
      today,
      "dashboard_synthesis",
    );

    const response = await getUsageRoute(usageRequest("analyst-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      authenticated: true,
      limit: 20,
      localDate: today,
      remaining: 19,
      used: 1,
    });
  });

  it("formats compact meter states", () => {
    expect(
      usageCopy({ limit: 20, localDate: "2026-06-14", remaining: 17, status: "ready", used: 3 }),
    ).toEqual({ label: "AI quota", value: "3 / 20" });
    expect(
      usageCopy({ limit: 20, localDate: "2026-06-14", remaining: 0, status: "ready", used: 20 }),
    ).toEqual({ label: "AI quota used", value: "20 / 20" });
    expect(usageCopy({ message: "Sign in.", status: "unauthenticated" })).toEqual({
      label: "AI quota",
      value: "Sign in required",
    });
  });
});

function usageRequest(userId: string) {
  return new Request("http://localhost/api/usage", {
    headers: {
      [TEST_USER_HEADER]: userId,
    },
  });
}
