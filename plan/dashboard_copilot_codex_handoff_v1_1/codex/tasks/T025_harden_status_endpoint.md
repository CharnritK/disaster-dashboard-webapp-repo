> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T025 — Harden status endpoint
Owner: Security/Privacy Reviewer

Goal: Ensure public status is safe.

Target files:
- `app/api/recommend/status/route.ts`
- `tests/status-route.test.ts`

Implementation notes:
- `Return safe status only.`
- `Do not expose raw provider key presence if product owner decides this is sensitive.`
- `Keep Cache-Control no-store.`

Acceptance criteria:
- `No secret fields.`
- `Cache-Control no-store.`
- `Tests pass.`

Tests:
- safe status
- no secret

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No AI provider behavior changes.`

Dependencies: T001

Risk: Low

Stop condition: Stop if product owner wants model/provider hidden.
