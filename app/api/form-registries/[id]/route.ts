import { NextResponse } from "next/server";

import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import { getFormRegistryForUser } from "@/lib/formRegistry";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const auth = await getRequestAuthContext(request);
  if (!auth) return jsonNoStore({ error: "Sign in required." }, { status: 401 });

  const { id } = await context.params;
  const result = await getFormRegistryForUser(auth.userId, id);
  if (!result) {
    return jsonNoStore({ error: "Form registry not found." }, { status: 404 });
  }

  return jsonNoStore(result);
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
