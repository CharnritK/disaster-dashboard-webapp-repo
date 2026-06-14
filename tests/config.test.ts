import { describe, expect, it } from "vitest";

import { getLlmServerConfig } from "@/lib/serverConfig";

describe("server configuration", () => {
  it("ignores empty LLM_API_KEY placeholders when OPENAI_API_KEY is set", () => {
    const config = getLlmServerConfig({
      LLM_API_KEY: "",
      LLM_PROVIDER: "openai",
      NODE_ENV: "test",
      OPENAI_API_KEY: "fallback-key",
    } as NodeJS.ProcessEnv);

    expect(config.apiKey).toBe("fallback-key");
  });
});
