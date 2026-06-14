import { afterEach, describe, expect, it, vi } from "vitest";

import { POST as postCopilotRoute } from "@/app/api/copilot/route";
import { POST as postRecommendRoute } from "@/app/api/recommend/route";
import { TEST_USER_HEADER } from "@/lib/auth/requestAuth";
import {
  getEntitlementService,
  resetEntitlementServiceForTests,
} from "@/lib/entitlement";
import { createDefaultDecisionBrief } from "@/lib/decisionContext";
import { createTabularDataset, parseCsv } from "@/lib/fileParsers";
import { profileDataset } from "@/lib/profiling";

afterEach(() => {
  resetEntitlementServiceForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("AI route governance", () => {
  it("returns unauthenticated fallback before provider calls or usage increments", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postRecommendRoute(recommendationRequest(recommendationBody()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      fallbackReason: "unauthenticated",
      source: "deterministic",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(
      getEntitlementService().getDailyUsage("analyst-1"),
    ).resolves.toMatchObject({ used: 0 });
  });

  it("does not consume quota when the provider key is missing", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postRecommendRoute(
      recommendationRequest(recommendationBody(), "analyst-1"),
    );
    const body = await response.json();

    expect(body.fallbackReason).toBe("missing_api_key");
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(
      getEntitlementService().getDailyUsage("analyst-1"),
    ).resolves.toMatchObject({ used: 0 });
  });

  it("rejects invalid recommend requests before provider calls or quota reserve", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postRecommendRoute(
      recommendationRequest({ profiles: "invalid", useLlm: true }, "analyst-1"),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(
      getEntitlementService().getDailyUsage("analyst-1"),
    ).resolves.toMatchObject({ used: 0 });
  });

  it("reserves quota for provider attempts and blocks later over-quota requests", async () => {
    vi.stubEnv("AI_DAILY_QUOTA", "1");
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    const fetchMock = vi.fn(async () =>
      Response.json({
        output_text: JSON.stringify({
          assumptions: ["profile-only"],
          recommendedPath: {
            actions: ["Accept"],
            confidence: 0.7,
            rationale: "Model summary was accepted after server validation.",
            title: "Use model recommendation",
          },
          summary: "AI summary",
        }),
        status: "completed",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = await postRecommendRoute(
      recommendationRequest(recommendationBody(), "analyst-1"),
    );
    const second = await postRecommendRoute(
      recommendationRequest(recommendationBody(), "analyst-1"),
    );

    await expect(first.json()).resolves.toMatchObject({ source: "llm" });
    await expect(second.json()).resolves.toMatchObject({
      fallbackReason: "quota_exceeded",
      source: "deterministic",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(
      getEntitlementService().getDailyUsage("analyst-1"),
    ).resolves.toMatchObject({ limit: 1, remaining: 0, used: 1 });
  });

  it("gates the copilot route with the same auth requirement", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postCopilotRoute(copilotRequest(copilotBody()));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      fallbackReason: "unauthenticated",
      source: "deterministic",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid copilot requests before provider calls or quota reserve", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postCopilotRoute(
      copilotRequest({ useLlm: true }, "analyst-1"),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(
      getEntitlementService().getDailyUsage("analyst-1"),
    ).resolves.toMatchObject({ used: 0 });
  });

  it("returns ai_disabled fallback before quota reserve", async () => {
    vi.stubEnv("LLM_ENABLED", "false");
    vi.stubEnv("LLM_API_KEY", "test-key");

    const response = await postCopilotRoute(
      copilotRequest(copilotBody(), "analyst-1"),
    );
    const body = await response.json();

    expect(body.fallbackReason).toBe("ai_disabled");
    await expect(
      getEntitlementService().getDailyUsage("analyst-1"),
    ).resolves.toMatchObject({ used: 0 });
  });

  it("does not consume copilot quota when the provider key is missing", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await postCopilotRoute(
      copilotRequest(copilotBody(), "analyst-1"),
    );
    const body = await response.json();

    expect(body.fallbackReason).toBe("missing_api_key");
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(
      getEntitlementService().getDailyUsage("analyst-1"),
    ).resolves.toMatchObject({ used: 0 });
  });

  it("reserves copilot quota for provider attempts and blocks later over-quota requests", async () => {
    vi.stubEnv("AI_DAILY_QUOTA", "1");
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    const fetchMock = vi.fn(async () =>
      Response.json({
        output_text: JSON.stringify({
          assumptions: ["summary-only"],
          caveats: ["Review data quality before sharing."],
          handoffNarrative: "Share the response-prioritization brief with the operations lead.",
          readinessExplanation: "Ready for review with one caveat.",
          repairActions: [
            {
              ownerHint: "Response lead",
              priority: "medium",
              rationale: "Confirm the caveat before external use.",
              title: "Review caveat",
            },
          ],
        }),
        status: "completed",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = await postCopilotRoute(
      copilotRequest(copilotBody(), "analyst-1"),
    );
    const second = await postCopilotRoute(
      copilotRequest(copilotBody(), "analyst-1"),
    );

    await expect(first.json()).resolves.toMatchObject({ source: "llm" });
    await expect(second.json()).resolves.toMatchObject({
      fallbackReason: "quota_exceeded",
      source: "deterministic",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(
      getEntitlementService().getDailyUsage("analyst-1"),
    ).resolves.toMatchObject({ limit: 1, remaining: 0, used: 1 });
  });
});

function recommendationRequest(body: unknown, userId?: string) {
  return jsonRequest("http://localhost/api/recommend", body, userId);
}

function copilotRequest(body: unknown, userId?: string) {
  return jsonRequest("http://localhost/api/copilot", body, userId);
}

function jsonRequest(url: string, body: unknown, userId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": `test-${crypto.randomUUID()}`,
  };
  if (userId) headers[TEST_USER_HEADER] = userId;
  return new Request(url, {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
}

function recommendationBody() {
  const dataset = createTabularDataset(
    "needs.csv",
    "csv",
    "sample",
    parseCsv("district_code,needs_score\nD01,78\n"),
  );
  return {
    mode: "single",
    profiles: [profileDataset(dataset)],
    recommendationScope: "workflow",
    useLlm: true,
  };
}

function copilotBody() {
  return {
    aiMode: "llm",
    decisionBrief: createDefaultDecisionBrief(),
    qualitySummary: [],
    taskType: "decision_handoff_summary",
    transformationSummary: [],
    useLlm: true,
  };
}
