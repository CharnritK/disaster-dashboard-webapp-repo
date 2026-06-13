# T008 — Wrap /api/recommend with entitlement and quota check
Owner: Auth & Entitlement Engineer

Goal: Gate AI attempts while preserving deterministic fallback.

Target files:
- `app/api/recommend/route.ts`
- `lib/entitlement/**`
- `lib/auth/** or test auth abstraction`
- `tests/api-recommend.test.ts`

Implementation notes:
- `Build deterministic fallback first.`
- `Use auth abstraction/test identity before Supabase integration.`
- `If unauthenticated or over quota, return deterministic fallback with reason and do not reserve usage.`
- `Reserve usage atomically only before a provider call attempt.`
- `Record safe event metadata.`

Acceptance criteria:
- `Deterministic mode unchanged.`
- `Unauth AI request returns fallback.`
- `Over-quota AI request returns fallback.`
- `Provider attempts are counted with reserve.`
- `Missing key does not consume quota.`

Tests:
- unauth useLlm true
- auth under quota
- auth over quota
- missing key
- invalid body
- deterministic fallback shape preserved

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No Supabase session required yet.`
- `No full prompt persistence.`

Dependencies: T007

Risk: Medium

Stop condition: Stop if fallback shape cannot be preserved.
