import { NextResponse } from "next/server";

import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import {
  createTemplateDraft,
  listTemplatesForUser,
  parseTemplateDraft,
  TemplateValidationError,
} from "@/lib/templates";

export async function GET(request: Request) {
  const auth = await getRequestAuthContext(request);
  if (!auth) return jsonNoStore({ error: "Sign in required." }, { status: 401 });

  const templates = await listTemplatesForUser(auth.userId);
  return jsonNoStore({ templates });
}

export async function POST(request: Request) {
  const auth = await getRequestAuthContext(request);
  if (!auth) return jsonNoStore({ error: "Sign in required." }, { status: 401 });

  try {
    const result = await createTemplateDraft(
      auth.userId,
      parseTemplateDraft(await request.json()),
    );
    return jsonNoStore(result, { status: 201 });
  } catch (error) {
    if (error instanceof TemplateValidationError) {
      return jsonNoStore({ error: error.message }, { status: 400 });
    }
    return jsonNoStore({ error: "Template could not be saved." }, { status: 500 });
  }
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
