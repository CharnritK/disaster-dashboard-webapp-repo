export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export function getSupabasePublicConfig(
  env: NodeJS.ProcessEnv = process.env,
): SupabasePublicConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey || !isAllowedSupabaseUrl(url, env)) return null;

  return {
    url,
    publishableKey,
  };
}

export function requireSupabasePublicConfig(
  env: NodeJS.ProcessEnv = process.env,
): SupabasePublicConfig {
  const config = getSupabasePublicConfig(env);
  if (!config) {
    throw new Error(
      "Supabase Auth requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return config;
}

function isAllowedSupabaseUrl(value: string, env: NodeJS.ProcessEnv) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return (
      url.protocol === "http:" &&
      env.NODE_ENV !== "production" &&
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "::1")
    );
  } catch {
    return false;
  }
}
