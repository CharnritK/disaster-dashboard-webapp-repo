import type { CopilotTaskType } from "@/types/recommendations";

export const AI_PROMPT_VERSIONS: Record<CopilotTaskType, string> = {
  dashboard_synthesis: "dashboard_synthesis:v1",
  decision_handoff_summary: "decision_handoff_summary:v1",
  form_schema_interpretation: "form_schema_interpretation:v1",
  quality_repair_guidance: "quality_repair_guidance:v1",
  workflow_harmonization: "workflow_harmonization:v1",
};

export function promptVersionForTask(taskType: CopilotTaskType) {
  return AI_PROMPT_VERSIONS[taskType];
}
