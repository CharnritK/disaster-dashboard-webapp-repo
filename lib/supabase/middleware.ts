import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { normalizeAuthRedirectPath } from "@/lib/auth/redirects";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export async function updateSupabaseSession(
  request: NextRequest,
  env: NodeJS.ProcessEnv = process.env,
) {
  const config = getSupabasePublicConfig(env);
  const protectedPath = isProtectedAppPath(request.nextUrl.pathname);

  if (!config) {
    if (protectedPath) {
      return redirectToLogin(request, "auth_not_configured");
    }

    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  if (protectedPath && !data?.claims?.sub) {
    return redirectToLogin(request);
  }

  if (protectedPath) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export function isProtectedAppPath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export function isPublicDemoPath(pathname: string) {
  return pathname === "/demo" || pathname.startsWith("/demo/");
}

export function buildLoginRedirectUrl(request: NextRequest, error?: string) {
  const url = request.nextUrl.clone();
  const next = normalizeAuthRedirectPath(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", next);
  if (error) url.searchParams.set("error", error);

  return url;
}

function redirectToLogin(request: NextRequest, error?: string) {
  const response = NextResponse.redirect(buildLoginRedirectUrl(request, error));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
