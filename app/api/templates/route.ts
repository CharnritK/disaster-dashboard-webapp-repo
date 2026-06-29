import { NextResponse } from "next/server";

import { readJsonRequest } from "@/lib/apiSecurity";
import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import {
  createTemplateDraft,
  listTemplatesForUser,
  parseTemplateDraft,
  TemplateValidationError,
} from "@/lib/templates";

const TEMPLATE_REQUEST_MAX_BYTES = 20_000;

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
    const bodyResult = await readJsonRequest(request, TEMPLATE_REQUEST_MAX_BYTES);
    if (!bodyResult.ok) {
      return jsonNoStore({ error: bodyResult.error }, { status: bodyResult.status });
    }
    const result = await createTemplateDraft(
      auth.userId,
      parseTemplateDraft(bodyResult.body),
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
