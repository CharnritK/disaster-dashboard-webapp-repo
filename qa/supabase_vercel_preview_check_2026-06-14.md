# Supabase And Vercel Preview Check

Date: 2026-06-14

Status: superseded for current staging state.

This file records the earlier Supabase/Vercel preview setup pass against the
original Supabase project and memory-backed preview environment. Current
staging state is recorded in
`plan/dashboard_copilot_codex_handoff_v1_1/qa/supabase_staging_project_check_2026-06-14.md`.
Use that staging check for current DB/RLS, Supabase secret, and magic-link
evidence.

## Supabase Project

- Project: `Opensource: Dashboard Copilot`
- Project ref: `pmavjwqpjehynfmycnwe`
- URL: `https://pmavjwqpjehynfmycnwe.supabase.co`
- Status observed in dashboard: healthy
- Compute observed in dashboard: Free/nano, South Asia/Mumbai
- Migrations observed in dashboard: none
- Data API observed in dashboard: enabled
- Publishable key observed: present
- Secret key observed: present but hidden; not copied or exposed

## Supabase Changes Made

- Disabled open self-serve signups in Auth > Sign In / Providers.
- Added local auth callback redirect URLs:
  - `http://127.0.0.1:3003/auth/callback`
  - `http://localhost:3003/auth/callback`
  - `http://localhost:3000/auth/callback`
- Added hosted preview auth callback redirect URLs:
  - `https://disaster-dashboard-webapp-repo-charnritk-charnrit-k.vercel.app/auth/callback`
  - `https://disaster-dashboard-webapp-repo-git-codex-dash-fd18aa-charnrit-k.vercel.app/auth/callback`

## Local App Smoke

- `http://127.0.0.1:3003/demo` rendered the deterministic public workflow.
- `/api/recommend/status` returned deterministic fallback with `ai_disabled`.
- `/api/usage` rejected unauthenticated access.
- `http://localhost:3000/demo` returned 500 from a stale WSL-relayed target, not
  the active healthy dev server.

## Vercel State

- Vercel CLI was run through `npx vercel@latest`; no global install was
  required.
- Project created under `point's projects` / `charnrit-k`:
  `disaster-dashboard-webapp-repo`.
- Local repo linked to the Vercel project.
- Vercel project connected to the fork GitHub repository:
  `https://github.com/CharnritK/disaster-dashboard-webapp-repo.git`.
- Project framework settings corrected to Next.js, `npm ci`, and
  `npm run build`.
- Preview-scoped environment variables were added for branch
  `codex/dashboard-copilot-handoff-v1-1`:
  - `LLM_ENABLED=false`
  - `NEXT_PUBLIC_COPILOT_API_ENABLED=false`
  - `AI_DAILY_QUOTA=20`
  - `AI_BETA_ALLOW_ALL_AUTHENTICATED=false`
  - `AI_USAGE_STORE=memory`
  - `METADATA_STORE=memory`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `APP_BASE_URL`
- Preview-scoped allowlist environment variables were added for one named
  beta/admin email. The email value is stored only in Vercel env vars and is
  intentionally not committed to this repository:
  - `AI_BETA_ALLOWED_EMAILS`
  - `ADMIN_EMAILS`
- A CLI deployment attempted without `--prod` was unexpectedly classified by
  Vercel as target `production`; it failed during type checking and did not
  become live.
- The failed build exposed that the standalone `tutorial-video/` Remotion
  workspace was included in the root Next.js type check on Vercel. The app
  deployment now excludes that standalone workspace from root TypeScript checks
  and Vercel upload.
- Explicit Preview deployment with `--target preview` succeeded.
- Git preview deployment inspected. Unique deployment URLs rotate per build; use
  the stable Git branch preview alias:
    `https://disaster-dashboard-webapp-repo-git-codex-dash-fd18aa-charnrit-k.vercel.app`
  - target: `preview`
  - status: `Ready`
- Vercel SSO deployment protection was disabled for this project because it
  blocked anonymous external validation before requests reached the app.

## Remaining Blockers

- The earlier blocker to identify a non-production database target was resolved
  by creating a separate Supabase staging project.
- `db/schema.sql` and `db/rls.sql` were applied to staging only after review.
- `METADATA_STORE=supabase`, `AI_USAGE_STORE=supabase`, and
  `SUPABASE_SECRET_KEY` were enabled only in the branch-scoped Vercel Preview
  environment after the staging database was prepared.

## Hosted Preview Smoke

- Supabase Auth redirect URL added for the canonical Git preview alias:
  `https://disaster-dashboard-webapp-repo-git-codex-dash-fd18aa-charnrit-k.vercel.app/auth/callback`
- Anonymous HTTP checks against the canonical Git preview alias:
  - `/demo`: `200`
  - `/api/recommend/status`: `200`,
    `{"ai":{"fallbackReason":"ai_disabled","mode":"deterministic_fallback"},"ok":true}`
  - `/api/usage`: `401`, unauthenticated fallback
  - `/app/data`: `307` to `/login?next=%2Fapp%2Fdata`
  - `/login?next=/app/data`: `200`
- Browser check: hosted `/demo` rendered Dashboard Copilot with AI Off and the
  deterministic workflow visible.
- Vercel error-log scan over the smoke window returned no error entries.

## Beta Auth Smoke

- Created one named Supabase Auth beta/admin user from the Supabase dashboard.
  The user was auto-confirmed so the app can use magic-link login with
  `shouldCreateUser=false`.
- A throwaway dashboard-required password was generated only for user creation
  and was not stored or committed.
- App magic-link request smoke:
  - `POST /auth/signin`
  - result: `307` to `/login?next=%2Fapp%2Fdata&sent=1`
- Full end-to-end login was later user-confirmed from the recipient inbox in
  the staging-backed preview path. Codex did not inspect the inbox or one-time
  link.

## Schema And RLS Review

- Reviewed `db/schema.sql` and `db/rls.sql` against the metadata-only product
  boundary.
- Confirmed schema only defines approved metadata tables:
  - `user_profiles`
  - `ai_usage_daily`
  - `ai_events`
  - `feedback`
  - `custom_templates`
  - `template_versions`
- Confirmed forbidden persistence tables are not present: uploaded rows,
  prepared rows, raw files, exports, prompts, prompt bodies, screenshots, or
  model responses.
- Confirmed RLS is enabled for every metadata table.
- Confirmed `anon` and `authenticated` grants are revoked before explicit
  re-grants.
- Confirmed authenticated users can read only their own usage/events/feedback
  and own or reviewed templates.
- Confirmed authenticated users cannot directly insert/update/delete
  `ai_usage_daily` or `ai_events`.
- Confirmed `reserve_ai_usage(uuid, date, integer)` is executable by
  `service_role` only.
- Confirmed service-role DB access remains behind the server-only helper.
- Verification: `npm run test -- tests/db-schema-boundary.test.ts` passed
  with 4 tests.

## Still Not Performed

- No production deployment was created successfully or promoted.
- No production SQL migration was run.
- No production Supabase service-role key or database URL was copied into
  Vercel.
- No AI provider key was configured.
