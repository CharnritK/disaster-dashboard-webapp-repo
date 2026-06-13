# T027 — Add deployment smoke test checklist and script
Owner: QA/Test Engineer

Goal: Make Vercel preview validation repeatable without production deployment.

Target files:
- `docs/deployment-smoke-tests.md`
- `scripts/smoke-vercel.mjs`

Implementation notes:
- `Script must not require credentials.`
- `Checklist covers env vars, status endpoint, fallback, logs, DB row check.`
- `Mark Vercel assumptions VERIFY_CURRENT_DOCS if docs unavailable.`

Acceptance criteria:
- `Checklist covers fresh deploy, env vars, status, fallback, logs, DB row check.`
- `Script is safe and dry-run capable.`

Tests:
- script dry run if possible

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No deployment.`
- `No production settings.`

Dependencies: T003

Risk: Low

Stop condition: Stop if script would need credentials.
