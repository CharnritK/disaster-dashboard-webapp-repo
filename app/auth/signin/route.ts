import { getAuthAppBaseUrl } from "@/lib/auth/appBaseUrl";
import { normalizeAuthRedirectPath } from "@/lib/auth/redirects";
import { redirectNoStore } from "@/lib/auth/responses";
import { signInErrorCode } from "@/lib/auth/signInErrors";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = normalizeAuthRedirectPath(String(formData.get("next") ?? ""));

  if (!EMAIL_PATTERN.test(email)) {
    return redirectToLogin(request, next, "invalid_email");
  }

  if (!getSupabasePublicConfig()) {
    return redirectToLogin(request, next, "auth_not_configured");
  }

  const appBaseUrl = getAuthAppBaseUrl(request);
  if (!appBaseUrl) {
    return redirectToLogin(request, next, "auth_not_configured");
  }

  const supabase = await createSupabaseServerClient();
  const emailRedirectTo = callbackUrl(appBaseUrl, next);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo,
      shouldCreateUser: false,
    },
  });

  if (error) {
    return redirectToLogin(request, next, signInErrorCode(error));
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("next", next);
  url.searchParams.set("sent", "1");
  return redirectNoStore(url);
}

function callbackUrl(appBaseUrl: URL, next: string) {
  const url = new URL("/auth/callback", appBaseUrl);
  url.searchParams.set("next", next);
  return url.toString();
}

function redirectToLogin(request: Request, next: string, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", next);
  url.searchParams.set("error", error);
  return redirectNoStore(url);
}
