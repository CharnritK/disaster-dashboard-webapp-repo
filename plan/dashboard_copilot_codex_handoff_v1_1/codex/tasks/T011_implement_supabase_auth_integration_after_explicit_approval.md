> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T011 — Implement Supabase auth integration after explicit approval
Owner: Auth & Entitlement Engineer

Goal: Add real auth after T010 checkpoint and approval.

Target files:
- `lib/auth/**`
- `middleware.ts`
- `app/login/**`
- `app/auth/**`
- `app/app/**`

Implementation notes:
- `Proceed only if APPROVED_PROVIDER_IMPLEMENTATION=true and APPROVED_AUTH_PROVIDER=Supabase Auth.`
- `Use Supabase Auth as identity source.`
- `Do not build custom password storage.`
- `Map profile id to auth.users(id).`
- `Protect /app/**; keep /demo public.`
- `Do not proceed unless explicit approval flags remain true.`
- `Do not create an app-owned password table.`

Acceptance criteria:
- `Login works in dev when env vars are configured.`
- `/demo public.`
- `/app protected.`
- `API routes can resolve user.`
- `No provider secrets exposed to browser.`
- `No custom password table exists.`

Tests:
- auth helper
- route guard
- manual login

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No production auth config changes.`
- `No custom password table.`

Dependencies: T010A

Risk: High

Stop condition: Stop if provider env/credentials are needed or approval flags are not explicit.
