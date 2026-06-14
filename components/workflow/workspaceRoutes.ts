import type { WorkflowStep } from "@/lib/config";

const WORKSPACE_STEP_PATHS: Record<WorkflowStep, string> = {
  brief: "/app/data",
  upload: "/app/data",
  profile: "/app/data",
  recommend: "/app/prepare",
  validate: "/app/readiness",
  dashboard: "/app/dashboard",
  export: "/app/export",
};

const WORKSPACE_ROUTE_DEFAULT_STEPS: Record<string, WorkflowStep> = {
  "/app/data": "brief",
  "/app/prepare": "recommend",
  "/app/readiness": "validate",
  "/app/dashboard": "dashboard",
  "/app/export": "export",
};

export function workspacePathForStep(step: WorkflowStep) {
  return WORKSPACE_STEP_PATHS[step];
}

export function workspaceDefaultStepFromPath(pathname: string | null) {
  if (!pathname) return null;
  return WORKSPACE_ROUTE_DEFAULT_STEPS[normalizeWorkspacePath(pathname)] ?? null;
}

export function isWorkspaceWorkflowPath(pathname: string | null) {
  if (!pathname) return false;
  return normalizeWorkspacePath(pathname) in WORKSPACE_ROUTE_DEFAULT_STEPS;
}

export function isStepCompatibleWithWorkspacePath(
  step: WorkflowStep,
  pathname: string | null,
) {
  if (!pathname) return false;
  return workspacePathForStep(step) === normalizeWorkspacePath(pathname);
}

function normalizeWorkspacePath(pathname: string) {
  return pathname.replace(/\/$/, "") || pathname;
}
