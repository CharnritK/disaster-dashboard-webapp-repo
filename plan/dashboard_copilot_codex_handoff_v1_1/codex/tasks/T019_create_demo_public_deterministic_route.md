# T019 — Create /demo public deterministic route
Owner: Workspace IA Engineer

Goal: Separate public demo from authenticated workspace.

Target files:
- `app/demo/page.tsx`
- `app/page.tsx`
- `components/**`

Implementation notes:
- `Use sample/synthetic data only.`
- `Force deterministic mode.`
- `Add sign-in CTA for AI-assisted workflow.`
- `Do not require auth.`

Acceptance criteria:
- `/demo loads without auth.`
- `Only deterministic mode.`
- `CTA present.`

Tests:
- manual demo flow
- route render if test infra exists

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No route split beyond demo/root.`

Dependencies: T010

Risk: Medium

Stop condition: Stop if app/page state extraction is too large for PR.
