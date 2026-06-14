> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T001 — Verify repo, build, and test baseline
Owner: Repo Cartographer

Goal: Confirm current repo structure and command baseline before feature work.

Target files:
- `package.json`
- `.tool-versions`
- `.env.example`
- `next.config.ts`
- `app/page.tsx`
- `app/api/**`
- `lib/**`
- `components/**`

Implementation notes:
- `List actual paths before editing.`
- `Run baseline commands and capture actual output.`
- `Do not start feature work in this task.`
- `Add a baseline Vitest smoke test only if the runner has no tests and test command otherwise fails due no tests.`

Acceptance criteria:
- `Repo map is documented.`
- `Actual command output is captured.`
- `No auth/DB/UI feature work is started.`

Tests:
- `No feature tests.`
- `Baseline smoke test only if needed.`

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No auth.`
- `No DB.`
- `No route split.`

Dependencies: None

Risk: Low

Stop condition: Stop if repo files differ materially from handoff or baseline fails for unrelated reasons.
