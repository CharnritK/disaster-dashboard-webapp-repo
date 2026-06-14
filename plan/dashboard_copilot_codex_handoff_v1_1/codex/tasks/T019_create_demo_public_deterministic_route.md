> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T019 — Create /demo public deterministic route
Owner: Workspace IA Engineer

Goal: Separate public demo from authenticated workspace.

Target files:
- `app/demo/page.tsx`
- `app/page.tsx`
- `components/**`

Implementation notes:
- `Use sample/synthetic data only.`
- `Force deterministic mode.`
- `Add sign-in CTA for AI-assisted workflow.`
- `Do not require auth.`

Acceptance criteria:
- `/demo loads without auth.`
- `Only deterministic mode.`
- `CTA present.`

Tests:
- manual demo flow
- route render if test infra exists

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No route split beyond demo/root.`

Dependencies: T010

Risk: Medium

Stop condition: Stop if app/page state extraction is too large for PR.
