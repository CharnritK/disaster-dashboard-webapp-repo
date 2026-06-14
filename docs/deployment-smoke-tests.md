# Deployment Smoke Tests

Use this checklist for preview validation. It is intentionally safe for
external validation without touching production.

Approved path: preview-only first. Do not deploy production until auth, DB, and
fallback smoke tests pass.

## Preconditions

- Use Node `24.x` on Vercel. Current Vercel docs list `24.x` as the default
  supported Node runtime, with `22.x` and `20.x` also available.
- Treat function-duration and Fluid Compute assumptions as `VERIFY_CURRENT_DOCS`
  before launch because Vercel plan and function-limit pages can differ by
  context.
- Do not add production environment variables in local files.
- Do not run production migrations from Codex.
- Keep `NEXT_PUBLIC_COPILOT_API_ENABLED=false` for static/public deterministic
  demos unless the API routes are available in the deployment target.

## Environment Variables

Required for deterministic preview:

- `NEXT_PUBLIC_COPILOT_API_ENABLED=false`

Required only when intentionally enabling authenticated AI:

- `NEXT_PUBLIC_COPILOT_API_ENABLED=true`
- `LLM_ENABLED=true`
- exactly one server-side provider key, such as `LLM_API_KEY` or `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `APP_BASE_URL`
- `AUTH_SECRET`
- `AI_BETA_ALLOWED_EMAILS` with named beta users
- `ADMIN_EMAILS` with named admins only
- `AI_DAILY_QUOTA=20`

Server-only values:

- `LLM_API_KEY`
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `AUTH_SECRET`
- `SUPABASE_SECRET_KEY`

Metadata storage switches:

- Keep `AI_USAGE_STORE=memory` and `METADATA_STORE=memory` until the preview or
  staging schema/RLS review passes.
- Use `AI_USAGE_STORE=supabase` and `METADATA_STORE=supabase` only after the
  reviewed Supabase project has schema and RLS applied outside production.

Never expose server-only values through `NEXT_PUBLIC_*`.

## Public Route Checks

Run:

```bash
node scripts/smoke-vercel.mjs --url https://your-preview-url.vercel.app
```

Expected:

- `/` returns 200.
- `/api/recommend/status` returns 200 and no secret-bearing fields such as
  `hasApiKey`, `provider`, `model`, or raw key names.
- `/api/usage` returns 401 without authentication and does not expose usage
  counts.

## AI Fallback Checks

For deterministic/public preview:

- AI toggle is off or AI requests fall back deterministically.
- Missing auth, missing keys, disabled AI, unsupported provider, and quota
  denials do not consume quota.
- UI copy says deterministic fallback is being used; it must not imply AI output
  is authoritative.

For authenticated AI preview:

- Sign-in works with approved Supabase redirect URLs.
- `/api/usage` returns the signed-in user's own usage only.
- Provider attempts reserve quota before calling the provider.
- Over-quota requests continue deterministically.

## Logs

In Vercel preview logs, confirm:

- no server-only secrets appear in logs;
- no uploaded rows or prepared rows appear in logs;
- provider failures produce deterministic fallback, not uncaught errors;
- status endpoint responses are `Cache-Control: no-store`.

## DB Row Check

Only after schema/RLS review and approved preview DB setup:

- Public deterministic page load creates no metadata rows.
- Unauthenticated `/api/usage` creates no usage row.
- Pre-provider fallback caused by missing auth, disabled AI, missing key,
  unsupported provider, invalid request, oversized request, or rate limit does
  not increment `ai_usage_daily`.
- Provider attempts create safe `ai_events` metadata only.
- No uploaded rows, prepared rows, exported files, full prompts, full responses,
  screenshots, or operational incident details are stored.

## Rollback

- Set `LLM_ENABLED=false`.
- Set `NEXT_PUBLIC_COPILOT_API_ENABLED=false`.
- Remove preview Supabase env values if auth is not under test.
- Do not run cleanup SQL against production unless a reviewed rollback exists.
