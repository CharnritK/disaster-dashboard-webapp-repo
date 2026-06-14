import { afterEach, describe, expect, it, vi } from "vitest";

import { POST as postCoachRoute } from "@/app/api/coach/route";
import { TEST_USER_HEADER } from "@/lib/auth/requestAuth";
import {
  getEntitlementService,
  resetEntitlementServiceForTests,
} from "@/lib/entitlement";

afterEach(() => {
  resetEntitlementServiceForTests();
  vi.unstubAllEnvs();
});

describe("coach API", () => {
  it("falls back deterministically when unauthenticated", async () => {
    const response = await postCoachRoute(coachRequest({ step: "brief" }));
    await expect(response.json()).resolves.toMatchObject({
      fallbackReason: "unauthenticated",
      source: "deterministic",
    });
  });

  it("does not call provider when disabled", async () => {
    vi.stubEnv("LLM_ENABLED", "false");
    const response = await postCoachRoute(coachRequest({ step: "export" }, "analyst-1"));
    await expect(response.json()).resolves.toMatchObject({
      fallbackReason: "ai_disabled",
      source: "deterministic",
    });
  });

  it("reserves quota and returns sanitized AI hints under quota", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            hints: [
              {
                body: "Review readiness caveats before export.",
                title: "Check caveats",
                tone: "warn",
              },
            ],
          }),
          status: "completed",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await postCoachRoute(coachRequest({ step: "dashboard" }, "analyst-1"));
    await expect(response.json()).resolves.toMatchObject({
      hints: [
        {
          body: "Review readiness caveats before export.",
          title: "Check caveats",
          tone: "warn",
        },
      ],
      source: "llm",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    await expect(
      getEntitlementService().getDailyUsage("analyst-1"),
    ).resolves.toMatchObject({ used: 1 });
    expect(getEntitlementService().eventRecordsForTests()).toMatchObject([
      {
        attemptedProviderCall: true,
        route: "/api/coach",
        succeeded: true,
      },
    ]);
  });

  it("keeps deterministic hints when coach quota is exceeded", async () => {
    vi.stubEnv("AI_DAILY_QUOTA", "1");
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            hints: [{ body: "First call", title: "First", tone: "neutral" }],
          }),
          status: "completed",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await postCoachRoute(coachRequest({ step: "dashboard" }, "analyst-1"));
    const second = await postCoachRoute(coachRequest({ step: "dashboard" }, "analyst-1"));

    await expect(second.json()).resolves.toMatchObject({
      fallbackReason: "quota_exceeded",
      source: "deterministic",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

function coachRequest(body: unknown, userId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (userId) headers[TEST_USER_HEADER] = userId;
  return new Request("http://localhost/api/coach", {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
}
