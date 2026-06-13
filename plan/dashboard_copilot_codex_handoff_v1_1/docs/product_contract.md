# Product Contract

## Contract wording for README and docs

Production v1 is a controlled authenticated AI beta with session-only uploaded data.

The public demo remains open and deterministic. Logged-in users may request AI assistance only after the server verifies authentication, entitlement, and daily quota. Uploaded data remains session-only. The server may persist only account, usage, feedback, template, and non-sensitive evaluation metadata.

AI assistance is advisory. Deterministic profiling, readiness checks, dashboard generation, export caveats, and fallback behavior remain authoritative for workflow continuity.

## Allowed persistence

The app may persist only:

- `users` or `user_profiles`
- auth/account metadata
- `ai_usage_daily`
- `ai_events`
- `feedback`
- `custom_templates`
- `template_versions`
- non-sensitive eval metadata

## Forbidden persistence

The app must never persist:

- uploaded raw files
- uploaded rows
- prepared rows
- full datasets
- exported reports or files
- full LLM request bodies
- full prompts
- prompts containing row-like values
- model responses containing row-like values
- secrets, API keys, service-role keys, private tokens, or sensitive operational data

## AI governance

Every AI route must:

1. Build deterministic fallback first.
2. Verify authenticated user when AI is requested.
3. Check entitlement and daily quota.
4. Return deterministic fallback on denial or failure.
5. Reserve quota atomically before a provider call attempt.
6. Count quota only when a provider call is attempted.
7. Build a minimized request body.
8. Call the provider only from the server.
9. Validate model output.
10. Record non-sensitive usage and event metadata.
11. Record `attempted_provider_call` and `succeeded` separately.
12. Record model and prompt version identifiers without storing prompt text.
13. Never expose provider keys or service-role keys to the browser.

## Deterministic fallback reasons

Use stable fallback reasons:

- `ai_disabled`
- `unauthenticated`
- `not_entitled`
- `quota_exceeded`
- `missing_api_key`
- `unsupported_provider`
- `provider_rate_limit`
- `provider_unavailable`
- `request_timeout`
- `network_error`
- `model_response_invalid`
- `model_response_truncated`
- `invalid_request`
- `request_too_large`
- `app_rate_limit`

## Supabase boundary if approved

If Supabase remains approved:

- use Supabase Auth as the source of identity;
- do not build custom password storage;
- map app user profiles to `auth.users(id)`;
- enable RLS on user-owned tables;
- use `auth.uid()` owner policies;
- keep service-role key server-only;
- do not allow direct browser writes unless RLS policy tests exist.

## Deployment boundary for Vercel Free/Hobby

V1 must avoid:

- background workers
- queues
- WebSockets
- durable workflows
- long-running jobs
- server-side storage of uploaded rows
- paid-only Vercel features

Use a small external managed Postgres provider only after approval. Keep uploads session-only even when a database is added.

If current official Vercel docs cannot be checked, mark deployment assumptions as `VERIFY_CURRENT_DOCS` and do not hard-code deployment settings.

## Public demo contract

Route: `/demo`

Behavior:

- no login required
- sample or synthetic data only
- deterministic mode only
- no AI calls
- CTA: “Sign in to use AI-assisted workflow.”

## Authenticated app contract

Routes: `/app/**`

Behavior:

- login required
- uploaded data remains in browser session
- AI mode visible only after login
- server checks entitlement and quota before every AI attempt
- quota exceeded means deterministic fallback, not broken workflow
- usage meter shows `used / limit`
