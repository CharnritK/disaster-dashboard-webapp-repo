import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { getSupabaseServerIdentity } from "@/lib/supabase/server";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const identity = await getSupabaseServerIdentity();
  if (!identity) redirect("/login?next=/app");

  return <AppShell>{children}</AppShell>;
}
