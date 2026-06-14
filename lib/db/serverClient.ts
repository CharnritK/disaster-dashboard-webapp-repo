import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only boundary: do not import this module from Client Components.
// The static DB boundary test fails if a "use client" module imports it.

export type ServerSupabaseConfig = {
  secretKey: string;
  url: string;
};

export function getServerSupabaseConfig(
  env: NodeJS.ProcessEnv = process.env,
): ServerSupabaseConfig {
  return {
    secretKey: requiredEnv(env, "SUPABASE_SECRET_KEY"),
    url: requiredEnv(env, "NEXT_PUBLIC_SUPABASE_URL"),
  };
}

export function createServerSupabaseClient(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseClient {
  const config = getServerSupabaseConfig(env);
  return createClient(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function requiredEnv(env: NodeJS.ProcessEnv, name: string) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for server-side Supabase access.`);
  }
  return value;
}
