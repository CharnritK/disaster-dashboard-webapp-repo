import { createServerClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "@/lib/supabase/env";

export type RequestAuthContext = {
  source: "supabase" | "test";
  userId: string;
  email?: string;
};

const TEST_USER_HEADER = "x-dashboard-copilot-test-user";
const SAFE_TEST_USER_ID = /^[A-Za-z0-9._:@-]{1,120}$/;

export type SupabaseAuthResolver = (
  request: Request,
  env: NodeJS.ProcessEnv,
) => Promise<RequestAuthContext | null>;

export async function getRequestAuthContext(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
  resolveSupabaseAuth: SupabaseAuthResolver = getSupabaseRequestAuthContext,
): Promise<RequestAuthContext | null> {
  const testUserId = request.headers.get(TEST_USER_HEADER)?.trim();
  if (testUserId && isTestIdentityEnabled(env)) {
    if (SAFE_TEST_USER_ID.test(testUserId)) {
      return {
        source: "test",
        userId: testUserId,
      };
    }

    return null;
  }

  return resolveSupabaseAuth(request, env);
}

export function isTestIdentityEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV === "test";
}

export async function getSupabaseRequestAuthContext(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RequestAuthContext | null> {
  const config = getSupabasePublicConfig(env);
  if (!config) return null;

  const supabase = createServerClient(config.url, config.publishableKey, {
    auth: {
      persistSession: false,
    },
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie"));
      },
      setAll() {
        // API routes return their own responses. Middleware refreshes browser cookies.
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  return {
    source: "supabase",
    userId: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : undefined,
  };
}

export function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return [];

  return cookieHeader
    .split(";")
    .map((cookie) => {
      const [rawName, ...rawValue] = cookie.split("=");
      const name = rawName.trim();
      if (!name) return null;

      return {
        name,
        value: decodeCookieValue(rawValue.join("=")),
      };
    })
    .filter((cookie): cookie is { name: string; value: string } => Boolean(cookie));
}

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export { TEST_USER_HEADER };
