> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T020 — Create authenticated /app shell
Owner: Workspace IA Engineer

Goal: Add protected app layout with usage meter.

Target files:
- `app/app/layout.tsx`
- `app/app/page.tsx`
- `components/AppShell.tsx`

Implementation notes:
- `Protect /app via auth middleware/helper.`
- `Show usage meter.`
- `Keep workflow starting point stable.`
- `Do not move every step yet.`

Acceptance criteria:
- `/app requires login.`
- `Usage meter appears.`
- `Workflow still starts.`

Tests:
- route guard
- manual app flow

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No full workflow route split.`

Dependencies: T011, T010

Risk: Medium

Stop condition: Stop if auth session unavailable.
