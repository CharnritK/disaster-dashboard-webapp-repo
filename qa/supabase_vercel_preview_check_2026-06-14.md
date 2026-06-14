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

- Browser showed the repo on Vercel's New Project import page.
- No `.vercel/` project link exists locally.
- `vercel` CLI is not installed on this machine.
- No Vercel deployment or project creation was performed.

## Remaining Blockers

- Choose preview source: commit the current controlled-beta work for Git-based
  Vercel preview, or use another explicit preview-only deployment path.
- Add a real preview URL to Supabase redirect URLs after the preview deployment
  exists.
- Set hosted preview env values outside git:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `APP_BASE_URL`
  - `LLM_ENABLED=false`
  - `NEXT_PUBLIC_COPILOT_API_ENABLED=false`
  - `AI_DAILY_QUOTA=20`
  - `AI_BETA_ALLOWED_EMAILS`
  - `ADMIN_EMAILS`
- Apply `db/schema.sql` and `db/rls.sql` only after schema/RLS review and only
  to a preview or staging database.
- Enable `METADATA_STORE=supabase`, `AI_USAGE_STORE=supabase`, and
  `SUPABASE_SECRET_KEY` only after the preview/staging database is prepared.
