import { NextResponse } from "next/server";

import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import { getEntitlementService, usageLocalDate } from "@/lib/entitlement";

export async function GET(request: Request) {
  const auth = await getRequestAuthContext(request);
  if (!auth) {
    return jsonNoStore(
      {
        authenticated: false,
        fallbackReason: "unauthenticated",
        message: "Sign in to use AI-assisted workflow.",
      },
      { status: 401 },
    );
  }

  const localDate = usageLocalDate();
  const usage = await getEntitlementService().getDailyUsage(
    auth.userId,
    localDate,
  );

  return jsonNoStore({
    authenticated: true,
    ...usage,
  });
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
