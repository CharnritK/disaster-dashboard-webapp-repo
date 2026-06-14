> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T014 — Add prompt/model version registry and safe AI event metadata
Owner: AI Governance Engineer

Goal: Track model/prompt metadata without sensitive prompt content.

Target files:
- `lib/ai/promptVersions.ts`
- `lib/llmClient.ts`
- `lib/serverConfig.ts`
- `types/**`
- `tests/ai-events.test.ts`

Implementation notes:
- `Create AI_PROMPT_VERSIONS source of truth.`
- `Every AI task must map to a prompt version.`
- `Events include prompt_version, model, provider, fallback reason, attempted_provider_call, succeeded.`
- `Never store full prompt text.`

Acceptance criteria:
- `Events include prompt/model versions.`
- `Tests fail if an AI task lacks prompt_version.`
- `No raw request body or full prompt persisted.`

Tests:
- event metadata
- prompt version coverage
- no prompt persistence

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No model/provider changes without approval.`
- `No prompt registry UI.`

Dependencies: T010A

Risk: Medium

Stop condition: Stop if event payload includes user data, full prompts, or row-like values.
