# Release Readiness Checklist

This app is not production-ready until every gate below has an owner and a pass
record.

Current status as of 2026-06-14: public and unauthenticated staging preview
behavior is Codex-verified, and earlier magic-link login was user-confirmed for
the approved beta/admin email. Current `POST /auth/signin` evidence shows
staging can issue a magic link (`sent=1`), while immediate repeat requests can
hit Supabase OTP resend protection. Local code now maps that cooldown/rate-limit
path to `auth_rate_limited` instead of generic `auth_failed`, pending preview
redeploy verification. Authenticated route rendering, metadata write smoke,
admin aggregate runtime smoke, and direct staging DB row checks remain pending
until the latest magic link is clicked and a browser session is available.
Production deployment, production environment variables, and production
migrations remain blocked.

## Approved Beta Decisions

- D1: Use preview-only deployment first. Production remains blocked until auth,
  DB, and fallback smoke tests pass.
- D2: Use Supabase Auth and Supabase Postgres for the real controlled-beta
  project.
- D3: Review schema and RLS first, then migrate only in preview or staging.
- D4: Start with named beta emails and named admins. No open self-serve signup.
- D5: Keep `AI_DAILY_QUOTA=20` for early beta.
- D6: Keep `/demo` deterministic and sample-only. No anonymous AI.
- D7: Document retention now; automate deletion only after legal/product review.

## Product

- Public `/demo` remains deterministic.
- Authenticated `/app` keeps uploaded data in browser session state.
- Deterministic readiness remains authoritative over AI advice.

## Safety And Privacy

- No uploaded row/file/report persistence.
- No full prompt or full model response persistence.
- Supabase secret keys, database URLs, and LLM keys stay server-side.
- Feedback and template inputs reject row-like content.

## Auth And DB

- Supabase Auth redirect URLs are reviewed.
- Beta access is invite/allowlist controlled.
- RLS and grants are reviewed before any production migration.
- Usage reservation uses the reviewed atomic function.
- Complete the staging magic-link session before claiming authenticated beta
  smoke is current.

## AI Governance

- Every AI event has a prompt version.
- Quota increments only immediately before provider attempts.
- Denied, disabled, missing-key, invalid, and unauthenticated fallbacks do not
  increment usage.

## Deployment

- Preview smoke tests pass before production approval.
- `/api/recommend/status` reports safe public state only.
- `/api/usage` rejects unauthenticated requests.
- Production deployment and migrations remain separate explicit approvals.

## Rollback

- Disable AI with `LLM_ENABLED=false` and
  `NEXT_PUBLIC_COPILOT_API_ENABLED=false`.
- Keep `/demo` available as deterministic fallback.
- Revert provider-backed metadata store to `AI_USAGE_STORE=memory` and
  `METADATA_STORE=memory` if DB integration misbehaves.
