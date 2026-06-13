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

Dependencies: T001, T002, T003, T004, T005, T006, T006A, T007, T008, T009, T010

Risk: High

Stop condition: Stop on any product contract violation.
