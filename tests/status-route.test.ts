import { afterEach, describe, expect, it, vi } from "vitest";

import { GET as getStatusRoute } from "@/app/api/recommend/status/route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("recommendation status route", () => {
  it("returns no-store safe deterministic status without secret details", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("LLM_PROVIDER", "openai");
    vi.stubEnv("LLM_MODEL", "sensitive-model-name");

    const response = getStatusRoute();
    const body = await response.json();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      ai: {
        fallbackReason: "missing_server_configuration",
        mode: "deterministic_fallback",
      },
      ok: true,
    });
    expect(JSON.stringify(body)).not.toMatch(/apiKey|hasApiKey|secret|provider|model|sensitive-model-name/i);
  });

  it("reports availability without exposing provider, model, or key presence", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubEnv("LLM_PROVIDER", "openai");
    vi.stubEnv("LLM_MODEL", "gpt-private");

    const response = getStatusRoute();
    const body = await response.json();

    expect(body).toEqual({
      ai: {
        mode: "available",
      },
      ok: true,
    });
    expect(JSON.stringify(body)).not.toMatch(/apiKey|hasApiKey|test-key|provider|model|gpt-private/i);
  });
});
