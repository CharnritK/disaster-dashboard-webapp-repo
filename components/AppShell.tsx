"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { UsageMeter } from "@/components/UsageMeter";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="workspace-shell-header">
        <div>
          <p className="eyebrow">Authenticated workspace</p>
          <h1>Dashboard Copilot beta</h1>
        </div>
        <div className="workspace-shell-actions">
          <UsageMeter enabled />
          <Link href="/app/data">Workflow</Link>
          <Link href="/app/ai-trial">AI trial</Link>
          <Link href="/app/usage">Usage</Link>
          <Link href="/progress">Progress</Link>
          <Link href="/app/feedback">Feedback</Link>
          <Link href="/app/templates">Templates</Link>
          <form method="post" action="/auth/signout">
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
