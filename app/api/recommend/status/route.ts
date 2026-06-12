import { NextResponse } from "next/server";

import { llmServerConfig } from "@/lib/serverConfig";

export function GET() {
  const response = NextResponse.json({
    llmEnabled: llmServerConfig.enabled,
    provider: llmServerConfig.provider,
    model: llmServerConfig.model,
    hasApiKey: Boolean(llmServerConfig.apiKey),
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}
