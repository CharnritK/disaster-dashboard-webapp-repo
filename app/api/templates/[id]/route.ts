import { NextResponse } from "next/server";

import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import {
  parseTemplatePatch,
  TemplateValidationError,
  updateTemplateDraft,
} from "@/lib/templates";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await getRequestAuthContext(request);
  if (!auth) return jsonNoStore({ error: "Sign in required." }, { status: 401 });

  const { id } = await context.params;
  let patch: ReturnType<typeof parseTemplatePatch>;
  try {
    patch = parseTemplatePatch(await request.json());
  } catch (error) {
    if (error instanceof TemplateValidationError) {
      return jsonNoStore({ error: error.message }, { status: 400 });
    }
    return jsonNoStore({ error: "Template update could not be parsed." }, { status: 400 });
  }

  const updated = await updateTemplateDraft(auth.userId, id, patch);

  if (!updated) {
    return jsonNoStore({ error: "Template not found or read-only." }, { status: 404 });
  }

  return jsonNoStore({ template: updated });
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
