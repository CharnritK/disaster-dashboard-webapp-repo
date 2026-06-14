import { redirectNoStore } from "@/lib/auth/responses";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (getSupabasePublicConfig()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("status", "signed_out");
  return redirectNoStore(url);
}
