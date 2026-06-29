import { afterEach, describe, expect, it, vi } from "vitest";

import { getLlmServerConfig } from "@/lib/serverConfig";

const originalMaxUploadSizeMb = process.env.MAX_UPLOAD_SIZE_MB;

async function loadUploadConfig(maxUploadSizeMb: string | undefined) {
  if (maxUploadSizeMb === undefined) {
    delete process.env.MAX_UPLOAD_SIZE_MB;
  } else {
    process.env.MAX_UPLOAD_SIZE_MB = maxUploadSizeMb;
  }

  vi.resetModules();
  return import("@/lib/config");
}

afterEach(() => {
  if (originalMaxUploadSizeMb === undefined) {
    delete process.env.MAX_UPLOAD_SIZE_MB;
  } else {
    process.env.MAX_UPLOAD_SIZE_MB = originalMaxUploadSizeMb;
  }
  vi.resetModules();
});

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

describe("upload configuration", () => {
  it("defaults to 10 MB per uploaded file", async () => {
    const config = await loadUploadConfig(undefined);

    expect(config.MAX_UPLOAD_SIZE_MB).toBe(10);
    expect(config.MAX_UPLOAD_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  it("honors the upload size environment override", async () => {
    const config = await loadUploadConfig("12.5");

    expect(config.MAX_UPLOAD_SIZE_MB).toBe(12.5);
    expect(config.MAX_UPLOAD_SIZE_BYTES).toBe(12.5 * 1024 * 1024);
  });

  it("clamps upload size overrides below the minimum", async () => {
    const config = await loadUploadConfig("-5");

    expect(config.MAX_UPLOAD_SIZE_MB).toBe(0.1);
    expect(config.MAX_UPLOAD_SIZE_BYTES).toBe(0.1 * 1024 * 1024);
  });
});
