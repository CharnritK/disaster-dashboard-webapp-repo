# T031 Staging Beta Validation Evidence

Date: 2026-06-14

Branch: `codex/dashboard-copilot-handoff-v1-1`

Preview URL:
`https://disaster-dashboard-webapp-repo-git-codex-dash-fd18aa-charnrit-k.vercel.app`

Verdict: `PARTIAL_STAGING_BETA_VALIDATION_PUBLIC_UNAUTH_VERIFIED_AUTH_RECHECK_BLOCKED`

## Scope

T031 validates the staging beta after the earlier Supabase-backed preview setup:
public and protected route behavior, metadata-only persistence boundaries,
admin aggregate boundaries, and production isolation.

This pass did not enable provider-backed AI, add users, mutate production,
run production migrations, automate retention deletion, or inspect secrets.

## User-Confirmed Before T031

- The approved beta/admin email `pointbcsc2000@hotmail.com` previously received
  the Supabase magic-link email.
- Opening that magic link previously completed login against the staging-backed
  Vercel Preview.
- The authenticated preview path previously worked for the user.
- Codex did not read the user's inbox or inspect a one-time magic-link URL.

## Codex-Verified This Pass

Preview public and unauthenticated checks:

- `/` returned `307` and redirected to `/demo`.
- `/demo` returned `200` and rendered `Dashboard Copilot`.
- `/demo` showed deterministic public workflow state with `AI Off`; no
  anonymous provider call was observed.
- `/api/recommend/status` returned `200` with
  `fallbackReason="ai_disabled"` and `mode="deterministic_fallback"`.
- `/app/usage` redirected unauthenticated users to
  `/login?next=%2Fapp%2Fusage`.
- `/app/templates` redirected unauthenticated users to
  `/login?next=%2Fapp%2Ftemplates`.
- `/app/feedback` redirected unauthenticated users to
  `/login?next=%2Fapp%2Ffeedback`.
- `/admin` redirected unauthenticated users to `/login?next=/admin`.
- `GET /api/usage` returned `401` with
  `fallbackReason="unauthenticated"`.
- `GET /api/templates` returned `401`.
- `POST /api/templates` returned `401`.
- `PATCH /api/templates/t031-check` returned `401`.
- `POST /api/feedback` returned `401` with
  `fallbackReason="unauthenticated"`.
- `POST /api/coach` returned deterministic fallback with
  `fallbackReason="unauthenticated"`.

Preview environment scope check:

- Vercel CLI listed the relevant environment variable names only as
  branch-scoped Preview entries for `codex/dashboard-copilot-handoff-v1-1`.
- Production Vercel environment variables were not changed.
- Secret values were not pulled or printed.

Local code and test validation:

- Protected `/app/**` routes require Supabase identity.
- `/admin` requires Supabase identity plus explicit admin allowlist.
- `/demo` is public, deterministic, and sample-only.
- Metadata persistence code is limited to `user_profiles`, `ai_usage_daily`,
  `ai_events`, `feedback`, `custom_templates`, and `template_versions`.
- Feedback and template APIs reject row/file/prompt/response-shaped payloads.
- Admin metrics aggregate counts, fallback reasons, and feedback tags only.
- Uploaded files, uploaded rows, prepared rows, exports, full prompts, and full
  model responses are not represented in the schema or adapter surface.

## Blocked Or Not Verified

Current authenticated staging recheck is blocked:

- Browser submission for `pointbcsc2000@hotmail.com` redirected to
  `/login?next=%2Fapp%2Fusage&error=auth_failed`.
- A direct `POST /auth/signin` probe also returned `307` to
  `/login?next=%2Fapp%2Fusage&error=auth_failed`.
- Because magic-link initiation currently fails, Codex could not verify
  authenticated `/app/usage`, `/app/templates`, `/app/feedback`, or `/admin`
  rendering in this pass.

Credential-dependent staging DB checks were not performed:

- Local environment does not provide a staging service-role key or staging
  `DATABASE_URL`.
- Codex did not query staging rows directly.
- Runtime proof that feedback/template writes reach staging tables as
  metadata-only rows remains pending.
- Runtime proof that the admin page shows current staging aggregates remains
  pending.
- Vercel runtime log review for absence of secrets/rows remains pending.

## Fix Applied During T031

One local governance bug was found and fixed:

- `/api/coach` now preflights unsupported providers before reserving quota or
  recording `attemptedProviderCall=true`.
- Regression coverage confirms unsupported provider fallback does not call
  `fetch`, does not increment usage, and records a safe non-attempt AI event.

## Production Boundary

Production remained untouched:

- No production deployment was run.
- No production Vercel environment variable was changed.
- No production Supabase configuration was changed.
- No production migration was run.
- No production admin allowlist was changed.
- No additional beta/admin emails were added.
- `LLM_ENABLED` was not enabled for staging or production by this pass.
- No retention automation was added.

## Commands And Evidence Sources

- `git status --short --branch`
- In-app browser route checks against the stable preview URL.
- PowerShell HTTP probes against the stable preview URL.
- `npx --yes vercel@latest env ls preview codex/dashboard-copilot-handoff-v1-1 --format=json`
- `npm run test -- tests/coach-api.test.ts`
- Code inspection of auth, route, DB adapter, feedback, template, entitlement,
  coach, admin, schema, and RLS paths.

## Next Safe Actions

1. Recheck Supabase Auth staging configuration for the approved email, invite
   state, redirect URL, and current auth logs without exposing secrets.
2. After magic-link initiation returns `sent=1`, complete the browser session
   and verify authenticated `/app/usage`, `/app/templates`, `/app/feedback`,
   and `/admin`.
3. Perform read-only staging DB checks that summarize metadata categories only:
   table counts, RLS/grant state, and absence of forbidden persistence tables.
4. Exercise one safe feedback and one safe template write, then confirm only
   approved metadata was persisted.
