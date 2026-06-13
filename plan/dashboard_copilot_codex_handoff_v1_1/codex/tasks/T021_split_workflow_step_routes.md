# T021 — Split workflow step routes
Owner: Workspace IA Engineer

Goal: Move monolithic page into operational pages after auth/entitlement is stable.

Target files:
- `app/app/data/page.tsx`
- `app/app/prepare/page.tsx`
- `app/app/readiness/page.tsx`
- `app/app/dashboard/page.tsx`
- `app/app/export/page.tsx`
- `components/workflow/**`

Implementation notes:
- `Do not combine with auth/entitlement PR.`
- `Preserve existing behavior.`
- `Keep uploaded data in session/client state.`
- `Add mobile tabs or bottom sheets rather than one giant stacked page.`

Acceptance criteria:
- `Step navigation works.`
- `State persists within session.`
- `Mobile not one stacked report.`
- `Deterministic fallback still works.`

Tests:
- manual full flow
- component smoke tests
- mobile sanity check

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No AI coach.`
- `No saved projects.`

Dependencies: T011, T013, T020

Risk: High

Stop condition: Stop if route split would combine with auth/entitlement changes or risk session-only uploads.
