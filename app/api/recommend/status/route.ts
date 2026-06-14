import { NextResponse } from "next/server";

import { getLlmServerConfig } from "@/lib/serverConfig";

export function GET() {
  const llmServerConfig = getLlmServerConfig();
  const aiAvailable =
    llmServerConfig.enabled &&
    Boolean(llmServerConfig.apiKey) &&
    llmServerConfig.provider === "openai";
  const response = NextResponse.json({
    ai: {
      fallbackReason: aiAvailable
        ? undefined
        : publicFallbackReason(llmServerConfig),
      mode: aiAvailable ? "available" : "deterministic_fallback",
    },
    ok: true,
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}

function publicFallbackReason(config: ReturnType<typeof getLlmServerConfig>) {
  if (!config.enabled) return "ai_disabled";
  if (!config.apiKey) return "missing_server_configuration";
  if (config.provider !== "openai") return "unsupported_provider";
  return undefined;
}
