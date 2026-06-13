# T002 — Fix deterministic env defaults and docs mismatch
Owner: Product Contract Editor

Goal: Make checked-in defaults deterministic-safe.

Target files:
- `.env.example`
- `README.md`
- `docs/AI_MODE.md`

Implementation notes:
- `Set LLM_ENABLED=false and NEXT_PUBLIC_COPILOT_API_ENABLED=false in examples.`
- `Add placeholders for DATABASE_URL, AUTH_SECRET/SUPABASE env vars only as empty placeholders.`
- `Document that secrets are server-side only.`

Acceptance criteria:
- `Defaults disable AI.`
- `Docs match env file.`
- `Provider keys are not present or suggested as literal values.`

Tests:
- `Existing tests only.`

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No provider SDK install.`
- `No auth implementation.`

Dependencies: T001

Risk: Low

Stop condition: Stop if docs contradict the product contract.
