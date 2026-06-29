import type { WorkflowStep } from "@/lib/config";

export const STEP_LABELS: Record<WorkflowStep, string> = {
  brief: "Template",
  upload: "Upload",
  profile: "Profile",
  recommend: "Harmonize",
  validate: "Validate",
  dashboard: "Dashboard",
  export: "Export",
};

export const DEMO_SAFETY_STRIP =
  "Controlled beta - synthetic sample data - not for operational action";

export const DEMO_SESSION_CHIP = "Session-only - nothing is stored";

export const DEMO_UPLOAD_TITLE = "Choose sample data";

export const DEMO_SAMPLE_ONLY_COPY = "Synthetic sample data only";

export const DEMO_GUIDED_FLOW_COPY =
  "Use the template as-is for the guided flow without AI.";

export const DEMO_AI_CTA = "Sign in to use AI-assisted workflow";
