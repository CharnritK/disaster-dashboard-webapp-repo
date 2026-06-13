# T009 — Wrap /api/copilot with entitlement and quota check
Owner: Auth & Entitlement Engineer

Goal: Gate handoff summaries while preserving fallback.

Target files:
- `app/api/copilot/route.ts`
- `lib/entitlement/**`
- `lib/auth/** or test auth abstraction`
- `tests/api-copilot.test.ts`

Implementation notes:
- `Apply same pattern as /api/recommend.`
- `Do not consume quota for unauthenticated, over-quota, missing-key, invalid-request, or deterministic-mode fallback before provider call.`
- `Record safe events.`

Acceptance criteria:
- `Unauth AI returns fallback.`
- `Over-quota returns fallback.`
- `Deterministic handoff still works.`
- `Provider attempts are reserved/countable.`

Tests:
- auth under quota
- over quota
- unauth
- missing key
- invalid body

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No Supabase session required yet.`

Dependencies: T007, T008

Risk: Medium

Stop condition: Stop if fallback object lacks reason field.
