# Review Gates and Stop Conditions

## Gate G1 — Auth provider

Reviewer:

- product owner
- security/privacy owner

Scope:

- provider choice
- login flow
- session storage
- route protection

Pass condition:

- provider is approved through explicit flags
- secrets are server-side only
- `/app/**` is protected
- `/demo` remains public
- custom password storage is not added when Supabase Auth is selected

Fallback:

- use auth interface with test adapter only

## Gate G2 — Persistence provider

Reviewer:

- product owner
- data/privacy owner

Scope:

- DB provider
- schema
- connection handling
- data retention

Pass condition:

- only allowed tables exist
- no row/file/report persistence
- migration is safe for target env
- provider SDK install is explicitly approved

Fallback:

- use in-memory adapter and SQL draft only

## Gate G2A — Supabase RLS and server-only access

Reviewer:

- security/privacy owner
- engineering lead

Scope:

- Supabase `auth.users` mapping
- RLS policies
- owner isolation
- server-only DB client
- service-role key handling

Pass condition:

- RLS enabled on user-owned tables
- `auth.uid()` ownership policies exist
- normal users cannot access another user's metadata
- service-role key is never imported by client code
- reviewed templates are read-only for normal users

Fallback:

- stop before Supabase integration; keep in-memory adapter and SQL draft only

## Gate G3 — DB migration

Reviewer:

- data/privacy owner
- engineering lead

Scope:

- migration file
- rollback
- production target

Pass condition:

- migration reviewed
- backup/rollback defined
- production execution approved

Fallback:

- do not run migration

## Gate G4 — AI route governance

Reviewer:

- AI governance owner
- security/privacy owner

Scope:

- entitlement checks
- quota reserve semantics
- fallback behavior
- event metadata
- prompt minimization

Pass condition:

- all AI routes check auth/quota
- provider attempts are counted with atomic reserve
- deterministic fallback works
- no row-like values sent or stored
- prompt versions are recorded without prompt text

Fallback:

- set `LLM_ENABLED=false`

## Gate G5 — Deployment settings

Reviewer:

- deployment owner

Scope:

- Node version
- Vercel settings
- env vars
- function limits

Pass condition:

- official docs support settings
- preview deploy passes smoke tests
- no production change is made by Codex

Fallback:

- keep deployment docs only and mark assumptions `VERIFY_CURRENT_DOCS`

## Gate G6 — Data retention

Reviewer:

- product owner
- privacy/legal owner

Scope:

- retention durations
- deletion logic
- account deletion

Pass condition:

- retention policy approved
- automation tested
- no prohibited data stored

Fallback:

- document retention as pending

## Milestone checkpoint after T010

Stop and report before provider SDK installation, large route split, AI coach, or internal dashboard unless:

- lint/test/build pass;
- entitlement route tests pass;
- product contract still holds;
- changed files remain reviewable;
- explicit approval flags remain approved.

## Global stop conditions

Stop if:

- credentials are needed
- production deployment is requested
- production migration would run
- raw uploaded rows would be stored
- full rows would be sent to the LLM
- full prompts would be stored
- provider key or service-role key would be browser-visible
- RLS or owner isolation cannot be defined
- deterministic fallback breaks
- scope expands into billing, teams, org admin, SSO, queues, workers, durable workflows, or saved projects
- tests cannot be defined
- target files are unknown and risky
