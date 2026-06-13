# Decisions Requiring User Approval

## D1 — Auth provider

Default in `/goal`:

- Supabase Auth

Alternatives:

- Auth.js with OAuth
- Auth.js with credentials
- Auth0
- Clerk

Approval needed before:

- installing provider SDK
- creating auth routes
- creating auth tables
- changing route protection

Recommended default:

Supabase Auth if the user wants the fewest external services.

Fallback:

If not approved, implement only auth interfaces and mock sessions for tests.

## D2 — Persistence provider

Default in `/goal`:

- Supabase Postgres

Alternatives:

- Neon Postgres
- Vercel Marketplace Postgres
- external managed Postgres

Approval needed before:

- adding provider SDK
- adding migration files
- connecting DB adapter
- deploying schema

Recommended default:

Supabase Postgres with metadata-only tables.

Fallback:

Use in-memory adapters and SQL draft only.

## D3 — Daily AI quota

Default:

- 20 AI assists per user per Asia/Bangkok day

Approval needed before:

- hard-coding default quota
- exposing quota copy in UI
- writing quota policy docs

Fallback:

Use environment variable `AI_DAILY_QUOTA=20`.

## D4 — Root route behavior

Default:

- `/` redirects to `/demo`

Alternative:

- Keep `/` as the demo route.
- Keep `/` as landing page with `/demo` CTA.

Approval needed before:

- changing root route behavior

Fallback:

Leave root route unchanged and add `/demo`.

## D5 — Anonymous AI visibility

Default:

- show disabled AI mode with CTA

Alternative:

- hide AI controls entirely for anonymous users

Approval needed before:

- changing public demo messaging

Fallback:

Hide AI controls in `/demo`.

## D6 — Vercel deployment settings

Default:

- no production deployment by Codex
- generate config and smoke checklist only

Approval needed before:

- deploying
- modifying production env values
- running production smoke tests with live credentials

Fallback:

Preview-only handoff.

## D7 — Data retention policy

Default draft:

- `ai_events`: 90 days
- `feedback`: 180 days
- templates: retained until user deletion
- users: retained until account deletion

Approval needed before:

- scheduled deletion
- retention automation
- legal/compliance docs

Fallback:

Document retention as pending.
