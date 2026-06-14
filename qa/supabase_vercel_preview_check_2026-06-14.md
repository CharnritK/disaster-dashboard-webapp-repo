# Supabase And Vercel Preview Check

Date: 2026-06-14

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
- A CLI deployment attempted without `--prod` was unexpectedly classified by
  Vercel as target `production`; it failed during type checking and did not
  become live.
- The failed build exposed that the standalone `tutorial-video/` Remotion
  workspace was included in the root Next.js type check on Vercel. The app
  deployment now excludes that standalone workspace from root TypeScript checks
  and Vercel upload.
- Explicit Preview deployment with `--target preview` succeeded.
- Latest deployment inspected:
  - unique URL:
    `https://disaster-dashboard-webapp-repo-r0sqgh8tp-charnrit-k.vercel.app`
  - stable preview alias:
    `https://disaster-dashboard-webapp-repo-charnritk-charnrit-k.vercel.app`
  - target: `preview`
  - status: `Ready`
- Vercel SSO deployment protection was disabled for this project because it
  blocked anonymous external validation before requests reached the app.

## Remaining Blockers

- Confirm named beta and admin allowlist values:
  - `AI_BETA_ALLOWED_EMAILS`
  - `ADMIN_EMAILS`
- Apply `db/schema.sql` and `db/rls.sql` only after schema/RLS review and only
  to a preview or staging database.
- Enable `METADATA_STORE=supabase`, `AI_USAGE_STORE=supabase`, and
  `SUPABASE_SECRET_KEY` only after the preview/staging database is prepared.

## Hosted Preview Smoke

- Supabase Auth redirect URL added:
  `https://disaster-dashboard-webapp-repo-charnritk-charnrit-k.vercel.app/auth/callback`
- Anonymous HTTP checks against the stable preview alias:
  - `/demo`: `200`
  - `/api/recommend/status`: `200`,
    `{"ai":{"fallbackReason":"ai_disabled","mode":"deterministic_fallback"},"ok":true}`
  - `/api/usage`: `401`, unauthenticated fallback
  - `/app/data`: `307` to `/login?next=%2Fapp%2Fdata`
  - `/login?next=/app/data`: `200`
- Browser check: hosted `/demo` rendered Dashboard Copilot with AI Off and the
  deterministic workflow visible.
- Vercel error-log scan over the smoke window returned no error entries.

## Still Not Performed

- No production deployment was created successfully or promoted.
- No SQL migration was run.
- No Supabase service-role key or database URL was copied into Vercel.
- No AI provider key was configured.
- No beta/admin email allowlists were populated because named values were not
  supplied in this run.
