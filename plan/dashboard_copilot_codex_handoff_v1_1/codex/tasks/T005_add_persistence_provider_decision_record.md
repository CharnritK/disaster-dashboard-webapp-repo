> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T005 — Add persistence provider decision record
Owner: Persistence Engineer

Goal: Document DB provider before implementation.

Target files:
- `docs/decisions/persistence-provider.md`

Implementation notes:
- `Compare Supabase Postgres default with at least one external managed Postgres alternative.`
- `State metadata-only persistence boundary.`
- `Call out no row/file/report storage.`

Acceptance criteria:
- `Decision record exists.`
- `Default provider is clear.`
- `Approval gate is explicit.`

Tests:
- `No code tests.`

Commands:
- None

Non-goals:
- `No provider SDK install.`
- `No migrations.`

Dependencies: T002

Risk: Low

Stop condition: Stop before provider SDK install if approval missing.
