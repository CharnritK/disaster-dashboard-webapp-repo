import { normalizeAuthRedirectPath } from "@/lib/auth/redirects";
import { redirectNoStore } from "@/lib/auth/responses";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeAuthRedirectPath(requestUrl.searchParams.get("next"));

  if (!code || !getSupabasePublicConfig()) {
    return redirectToLogin(request, next, "callback_failed");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToLogin(request, next, "callback_failed");
  }

  return redirectNoStore(new URL(next, request.url));
}

function redirectToLogin(request: Request, next: string, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", next);
  url.searchParams.set("error", error);
  return redirectNoStore(url);
}
