# Supabase Staging Project Check

Date: 2026-06-14

## Staging Target

- Supabase project: `Dashboard Copilot Staging`
- Supabase ref: `pcaktvkhkeyqvgkiiwrj`
- Region selected in dashboard: `South Asia (Mumbai)`
- Production Supabase ref left untouched: `pmavjwqpjehynfmycnwe`

## Migration

Applied to staging only:

- `db/schema.sql`
- `db/rls.sql`

No SQL was run against the production Supabase project.

## Verification

Staging verification results:

- metadata tables exist:
  - `ai_events`
  - `ai_usage_daily`
  - `custom_templates`
  - `feedback`
  - `template_versions`
  - `user_profiles`
- RLS enabled on all six metadata tables.
- `anon` has no table grants on the metadata tables.
- authenticated table grants are metadata-scoped:
  - `ai_events`: `SELECT`
  - `ai_usage_daily`: `SELECT`
  - `custom_templates`: `DELETE,INSERT,SELECT,UPDATE`
  - `feedback`: `INSERT,SELECT`
  - `template_versions`: `DELETE,INSERT,SELECT,UPDATE`
  - `user_profiles`: `SELECT`
- `reserve_ai_usage(uuid,date,integer)` exists.
- RPC privilege check:
  - `anon_execute=false`
  - `authenticated_execute=false`
  - `service_role_execute=true`

## Auth Configuration

- Site URL set to the stable Vercel preview alias.
- Redirect URLs added for the stable Vercel preview callback and local callback
  smoke URLs.
- Open signup disabled.
- Anonymous sign-ins disabled.
- Email confirmation remains enabled.
- Named staging Auth user created for the approved beta/admin email.

## Vercel Preview Environment

Updated only the branch-scoped Preview environment for
`codex/dashboard-copilot-handoff-v1-1`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `METADATA_STORE=supabase`
- `AI_USAGE_STORE=supabase`

Production Vercel environment variables were not changed.

## Preview Deployment Smoke

Vercel Preview deployment for commit `6a7176c` reached `READY`.

Stable preview alias:

- `https://disaster-dashboard-webapp-repo-git-codex-dash-fd18aa-charnrit-k.vercel.app`

Smoke results:

- `/demo`: `200`
- `/api/recommend/status`: `200`, `fallbackReason=ai_disabled`
- `/api/usage`: `401`, `fallbackReason=unauthenticated`
- `/api/templates`: `401`
- `POST /auth/signin` for the approved beta/admin email:
  - `307`
  - redirect location:
    `/login?next=%2Fapp%2Fusage&sent=1`

## Authenticated Magic-Link Smoke

User-confirmed on 2026-06-14:

- The approved beta/admin email received the Supabase magic-link email.
- Opening the link completed login against the staging-backed Vercel preview.
- The authenticated preview path worked for the user.

Codex did not read the user's email inbox or inspect the one-time magic-link
URL. This is recorded as user-confirmed external auth validation, not as a
Codex-controlled email-link capture.

## T031 Continuation Evidence

Follow-up validation is recorded in
`qa/t031_staging_beta_validation_2026-06-14.md`.

Current Codex-verified staging behavior:

- `/demo` still returns `200`.
- `/api/recommend/status` still returns deterministic fallback with
  `fallbackReason=ai_disabled`.
- unauthenticated protected pages redirect to `/login`.
- unauthenticated feedback/template mutation APIs return `401`.
- branch-scoped Preview environment variable names are present for
  `codex/dashboard-copilot-handoff-v1-1`; secret values were not pulled or
  printed.

Current T031 continuation status:

- Re-submitting the approved beta/admin email against the current stable
  preview returned `/login?next=%2Fapp%2Fusage&sent=1` once.
- An immediate repeat request hit generic `auth_failed` on deployment
  `dpl_2XqRJnp8NGAYFqRCKypez318c8aT`, consistent with Supabase OTP resend
  cooldown/rate limiting.
- Local code now maps that cooldown path to `auth_rate_limited` after preview
  redeploy.
- Authenticated route rendering, metadata write smoke, admin aggregate runtime
  smoke, and direct staging DB row checks remain unverified until the latest
  magic link is clicked and a browser session is available.

Production remained untouched during the T031 recheck.
