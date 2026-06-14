# Prompt and Model Version Tracking

## Source of truth

The source of truth is:

```text
lib/ai/promptVersions.ts
```

Current shape:

```ts
export const AI_PROMPT_VERSIONS = {
  workflow_harmonization: "workflow_harmonization:v1",
  dashboard_synthesis: "dashboard_synthesis:v1",
  decision_handoff_summary: "decision_handoff_summary:v1",
  quality_repair_guidance: "quality_repair_guidance:v1",
} as const;
```

## Rules

- Every AI task type must have a prompt version.
- Every `ai_event` must record `prompt_version`.
- Do not store full prompt text in `ai_events`.
- Prompt version changes require a changelog or docs note.

## Tests

- all task types have a prompt version;
- `ai_events` creation fails or test fails when prompt version is missing;
- model/provider metadata is captured without prompt bodies or row-like values.
