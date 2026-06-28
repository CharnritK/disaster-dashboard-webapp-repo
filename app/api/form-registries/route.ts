import { NextResponse } from "next/server";

import { readJsonRequest } from "@/lib/apiSecurity";
import { getRequestAuthContext } from "@/lib/auth/requestAuth";
import {
  createFormRegistryDraft,
  FormRegistryValidationError,
  listFormRegistriesForUser,
  parseFormRegistryDraft,
} from "@/lib/formRegistry";

const FORM_REGISTRY_REQUEST_MAX_BYTES = 40_000;

export async function GET(request: Request) {
  const auth = await getRequestAuthContext(request);
  if (!auth) return jsonNoStore({ error: "Sign in required." }, { status: 401 });

  const registries = await listFormRegistriesForUser(auth.userId);
  return jsonNoStore({ registries });
}

export async function POST(request: Request) {
  const auth = await getRequestAuthContext(request);
  if (!auth) return jsonNoStore({ error: "Sign in required." }, { status: 401 });

  const body = await readJsonRequest(request, FORM_REGISTRY_REQUEST_MAX_BYTES);
  if (!body.ok) {
    return jsonNoStore({ error: body.error }, { status: body.status });
  }

  try {
    const result = await createFormRegistryDraft(
      auth.userId,
      parseFormRegistryDraft(body.body),
    );
    return jsonNoStore(result, { status: 201 });
  } catch (error) {
    if (error instanceof FormRegistryValidationError) {
      return jsonNoStore({ error: error.message }, { status: 400 });
    }
    return jsonNoStore({ error: "Form registry could not be saved." }, { status: 500 });
  }
}

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
