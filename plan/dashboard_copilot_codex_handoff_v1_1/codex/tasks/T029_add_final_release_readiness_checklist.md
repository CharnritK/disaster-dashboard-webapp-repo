> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T029 — Add final release readiness checklist
Owner: QA/Test Engineer

Goal: Define beta launch gates.

Target files:
- `docs/release-readiness.md`
- `qa/checklist.md`

Implementation notes:
- `Checklist should cover product, safety, privacy, auth, DB, AI governance, deployment, support, and rollback.`
- `Include reviewer/pass/fallback for every gate.`

Acceptance criteria:
- `Checklist is actionable.`
- `Gates have pass conditions and fallbacks.`

Tests:
- `No code tests.`

Commands:
- None

Non-goals:
- `No production launch.`

Dependencies: T027, T028

Risk: Low

Stop condition: Stop before production launch.
