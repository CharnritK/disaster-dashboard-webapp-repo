import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  getSupabasePublicConfig,
  requireSupabasePublicConfig,
} from "@/lib/supabase/env";

export type SupabaseServerIdentity = {
  userId: string;
  email?: string;
};

export async function createSupabaseServerClient(
  env: NodeJS.ProcessEnv = process.env,
) {
  const config = requireSupabasePublicConfig(env);
  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; middleware refreshes sessions.
        }
      },
    },
  });
}

export async function getSupabaseServerIdentity(
  env: NodeJS.ProcessEnv = process.env,
): Promise<SupabaseServerIdentity | null> {
  if (!getSupabasePublicConfig(env)) return null;

  const supabase = await createSupabaseServerClient(env);
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  return {
    userId: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : undefined,
  };
}
