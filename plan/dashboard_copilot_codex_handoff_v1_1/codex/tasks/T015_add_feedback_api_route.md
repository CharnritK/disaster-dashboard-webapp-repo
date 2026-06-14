> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T015 — Add feedback API route
Owner: Eval & Feedback Engineer

Goal: Persist first eval signals.

Target files:
- `app/api/feedback/route.ts`
- `lib/feedback/**`
- `types/feedback.ts`
- `tests/feedback-api.test.ts`

Implementation notes:
- `Validate allowed tags server-side.`
- `Require auth unless explicitly using safe demo no-op.`
- `Limit comment length.`
- `Reject row-like payloads.`

Acceptance criteria:
- `Valid feedback saves.`
- `Invalid tags rejected.`
- `Unauth request rejected or safe fallback.`
- `No row data accepted.`

Tests:
- tag validation
- comment length
- auth check
- row-like payload rejected

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No internal eval dashboard.`

Dependencies: T013

Risk: Medium

Stop condition: Stop if comments need sensitive-data scanning beyond length/copy controls.
