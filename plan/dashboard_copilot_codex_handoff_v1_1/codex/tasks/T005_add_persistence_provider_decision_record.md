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
