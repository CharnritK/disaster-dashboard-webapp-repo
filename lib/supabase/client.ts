"use client";

import { createBrowserClient } from "@supabase/ssr";

import { requireSupabasePublicConfig } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  const config = requireSupabasePublicConfig();
  return createBrowserClient(config.url, config.publishableKey);
}
