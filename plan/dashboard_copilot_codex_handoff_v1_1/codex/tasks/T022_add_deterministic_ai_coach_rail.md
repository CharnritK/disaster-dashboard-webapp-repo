> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T022 — Add deterministic AI coach rail
Owner: AI Coach Engineer

Goal: Provide right-rail guidance without AI call dependency.

Target files:
- `components/AiCoachPanel.tsx`
- `lib/coach/**`
- `components/AppShell.tsx`

Implementation notes:
- `Generate deterministic hints by step.`
- `Do not call provider.`
- `Do not override deterministic readiness.`
- `Keep hints concise and caveated.`

Acceptance criteria:
- `Coach hints appear per step.`
- `No provider calls.`
- `No raw rows sent.`
- `Readiness remains authoritative.`

Tests:
- coach hint unit tests
- component render

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No chat agent.`
- `No AI augmentation.`

Dependencies: T021

Risk: Low

Stop condition: Stop if guidance contradicts readiness logic.
