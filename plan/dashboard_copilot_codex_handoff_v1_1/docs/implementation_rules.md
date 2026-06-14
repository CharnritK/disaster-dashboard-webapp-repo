# Implementation Rules

## Non-negotiables

1. Do not persist uploaded rows.
2. Do not send full uploaded rows to LLM routes.
3. Do not expose provider API keys or Supabase service-role keys to the browser.
4. Do not store full LLM prompts or full row-like request bodies.
5. Do not add background jobs, queues, durable workflows, WebSockets, or long-lived server memory in v1.
6. Do not add team workspaces, saved projects, billing, org admin, SSO, or role hierarchies in v1.
7. Do not break deterministic mode.
8. Do not merge large route-split UI refactors into the same PR as auth/entitlement.
9. Prefer explicit service interfaces and in-memory adapters before DB integration.
10. Use atomic reserve semantics for provider-attempt usage counting.

## Approval gates required before implementation

Require human approval before:

- adding or changing auth provider;
- adding or changing persistence provider;
- installing provider SDKs if approval flags are not explicit;
- creating DB migrations;
- running migrations in any non-local environment;
- changing deployment settings;
- modifying AI provider/model behavior;
- changing data-retention policy;
- making production deployment changes.

## Provider implementation rules

If Supabase is used:

- use Supabase Auth as source identity;
- do not store custom passwords;
- map app user profile IDs to `auth.users(id)`;
- enable RLS on user-owned tables;
- keep service-role access server-only;
- add owner-isolation policy checks.

## Vercel rules

If current official Vercel docs cannot be checked:

- continue local implementation only where not deployment-dependent;
- mark deployment assumptions as `VERIFY_CURRENT_DOCS`;
- stop before hard-coding runtime/function settings;
- do not claim deployment compatibility is verified.
