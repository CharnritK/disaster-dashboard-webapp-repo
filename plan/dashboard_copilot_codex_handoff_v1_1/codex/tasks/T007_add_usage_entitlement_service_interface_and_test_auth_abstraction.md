# T007 — Add usage entitlement service interface and test auth abstraction
Owner: AI Governance Engineer

Goal: Make quota logic and authenticated/anonymous route tests possible before provider or DB integration.

Target files:
- `lib/entitlement/**`
- `lib/auth/** or test auth abstraction`
- `tests/entitlement.test.ts`
- `tests/auth-context.test.ts`

Implementation notes:
- `Implement Asia/Bangkok date bucketing.`
- `Expose checkAiEntitlement, reserveAiUsage, recordAiEvent, and markAiEventComplete interfaces.`
- `Start with in-memory adapter.`
- `Add test identity support that cannot be trusted in production.`
- `Do not require Supabase or a real DB.`

Acceptance criteria:
- `Unit tests pass.`
- `No DB dependency.`
- `No provider SDK dependency.`
- `Quota deny reasons are typed.`
- `Authenticated/anonymous route tests can use a safe abstraction.`

Tests:
- date bucket
- first use
- `reserve/increment`
- quota exceeded
- different users
- provider-attempt counted only after reserve
- test identity only works in test mode

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No provider SDK.`
- `No route wiring.`

Dependencies: T001, T002

Risk: Medium

Stop condition: Stop if date bucketing or test identity would weaken production auth.
