import type { ReactNode } from "react";

import { WorkspaceWorkflowShell } from "@/components/workflow/WorkspaceWorkflowShell";

export default function WorkflowLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WorkspaceWorkflowShell>{children}</WorkspaceWorkflowShell>;
}
