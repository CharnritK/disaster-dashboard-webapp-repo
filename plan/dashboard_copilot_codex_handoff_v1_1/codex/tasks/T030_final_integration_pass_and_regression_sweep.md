> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T030 — Final integration pass and regression sweep
Owner: QA/Test Engineer

Goal: Verify product contract across entire build.

Target files:
- all changed files

Implementation notes:
- `Run full validation commands.`
- `Document manual checks.`
- `Confirm no forbidden persistence.`
- `Confirm deterministic fallback.`

Acceptance criteria:
- `lint/test/build pass.`
- `Manual checks documented.`
- `No forbidden persistence.`
- `Deterministic fallback works.`

Tests:
- full suite
- manual smoke
- privacy checks

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No production deploy.`

Dependencies: T001, T002, T003, T004, T005, T006, T006A, T007, T008, T009, T010, T010A, T011, T012, T013, T014, T015, T016, T017, T018, T019, T020, T021, T022, T023, T024, T025, T026, T027, T028, T029

Risk: High

Stop condition: Stop on any product contract violation.
