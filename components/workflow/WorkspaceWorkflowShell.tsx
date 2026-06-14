"use client";

import DashboardCopilotApp from "@/components/DashboardCopilotApp";
import type { ReactNode } from "react";

export function WorkspaceWorkflowShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <DashboardCopilotApp workspaceMode />
      {children}
    </>
  );
}
