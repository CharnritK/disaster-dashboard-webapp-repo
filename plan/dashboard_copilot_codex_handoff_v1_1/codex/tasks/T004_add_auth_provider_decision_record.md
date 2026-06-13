# T004 — Add auth provider decision record
Owner: Auth & Entitlement Engineer

Goal: Document provider choice before implementation.

Target files:
- `docs/decisions/auth-provider.md`

Implementation notes:
- `Compare Supabase Auth default with at least one alternative.`
- `State explicit approval flags.`
- `Document no custom password storage if Supabase Auth is used.`

Acceptance criteria:
- `Decision record exists.`
- `Provider default is clear.`
- `Approval gate is explicit.`

Tests:
- `No code tests.`

Commands:
- None

Non-goals:
- `No provider SDK install.`
- `No login UI.`

Dependencies: T002

Risk: Low

Stop condition: Stop before provider SDK install if approval missing.
