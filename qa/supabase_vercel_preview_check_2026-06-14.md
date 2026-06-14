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
- A CLI deployment attempted without `--prod` was unexpectedly classified by
  Vercel as target `production`; it failed during type checking and did not
  become live.
- The failed build exposed that the standalone `tutorial-video/` Remotion
  workspace was included in the root Next.js type check on Vercel. The app
  deployment now excludes that standalone workspace from root TypeScript checks
  and Vercel upload.

## Remaining Blockers

- Create a successful explicit Preview deployment with `--target preview`.
- Add a real preview URL to Supabase redirect URLs after the preview deployment
  exists.
- Set or update hosted preview env values outside git after the preview URL is
  known:
  - `APP_BASE_URL`
  - `AI_BETA_ALLOWED_EMAILS`
  - `ADMIN_EMAILS`
- Apply `db/schema.sql` and `db/rls.sql` only after schema/RLS review and only
  to a preview or staging database.
- Enable `METADATA_STORE=supabase`, `AI_USAGE_STORE=supabase`, and
  `SUPABASE_SECRET_KEY` only after the preview/staging database is prepared.
