# QA / Challenger Closeout v1.1

## Verdict

`IMPLEMENTATION_COMPLETE_T031_PARTIAL_STAGING_VALIDATION`

## Scope reviewed

- Product contract
- Repo findings from prior inspection
- Vercel readiness risks
- Data model draft
- Supabase Auth/Postgres approval path
- Supabase RLS and server-only DB requirements
- Quota and atomic usage semantics
- Codex task backlog and task cards
- Review gates
- Testing strategy

## v1.1 fixes applied

- Duplicate `/goal` invocation removed from `GOAL_FULL_BUILD.md`.
- Package-reading preflight added to the main goal prompt.
- Explicit approval flags added.
- Entitlement and route-gating sequence moved before provider integration.
- Supabase `auth.users` mapping and no-custom-password rule added.
- Supabase RLS and service-role key isolation requirements added.
- Quota semantics clarified: count provider attempts via atomic reservation.
- Prompt/model version tracking required for `ai_events`.
- Milestone checkpoint added after usage UI and route gating.

## Remaining critical issues

### C1 — Vercel facts need current verification before new deployment assumptions

Severity: High

Node runtime and Hobby limits may change. The current preview path has been
validated, but Codex or a human must check official Vercel docs before
hard-coding new runtime/function assumptions.

### C2 — Provider approvals are explicit but still high-impact

Severity: High

The default path approves Supabase Auth and Supabase Postgres only if the explicit approval block remains unchanged. Auth and DB provider work must stop if approval flags are edited or missing.

### C3 — Production actions are not approved

Severity: High

Deployment and migrations are external, irreversible-risk actions. Codex must create code and docs only. A human must deploy and run production migrations.

### C4 — Staging metadata behavior still needs authenticated smoke

Severity: Medium

The code and staging schema/RLS are in place, but current T031 recheck blocks
at `POST /auth/signin` with `error=auth_failed`. The next validation phase must
restore magic-link initiation, then exercise authenticated feedback, templates,
usage, and admin aggregate paths against staging.

## Unsupported or weak claims

- Exact current Vercel Node versions.
- Exact current Hobby function durations.
- Current free-tier details for Supabase or other providers.
- Production readiness; production has not been deployed or migrated.

## Required fixes before production

- Verify Vercel docs.
- Confirm provider approval flags.
- Run authenticated staging metadata-persistence smoke tests.
- Complete security/privacy review for production.
- Obtain explicit production deployment and migration approvals.

## Release readiness

Not production-ready.

The controlled-beta implementation is complete for local/reviewable paths and
the staging auth path was previously user-confirmed. Current T031 authenticated
route and metadata persistence smoke remains blocked by `auth_failed`.
Production release remains blocked until review gates are closed.

## T010A checkpoint update

Status: `CHECKPOINT_SATISFIED_AND_CONTINUED`

The first milestone implementation reached the mandated T010/T010A checkpoint. The new checkpoint report is `qa/milestone_T010_report.md`.

Validated:

- lint, tests, and build pass after implementation;
- browser smoke passes on desktop and mobile through local Next dev;
- unauthenticated `/api/usage` returns deterministic fallback status;
- no provider SDK, real auth integration, database adapter, route split, AI coach, internal dashboard, production deployment, or migration was started at that checkpoint.

That stop was later satisfied by explicit human approval.

Continuation note:

- T006/T006A SQL drafts, T025 status hardening, and T027 deployment smoke artifacts were added as credential-free review artifacts after the initial checkpoint.
- T011 Supabase Auth foundation was added after confirming `APPROVED_PROVIDER_IMPLEMENTATION=true` and `APPROVED_AUTH_PROVIDER=Supabase Auth`.
- `/app/**` is now protected by Supabase SSR middleware and a verified-claims server page check; `/`, `/about`, `/demo`, and API fallback routes remain public.
- Magic-link login/callback/signout routes exist, and staging Supabase-backed
  magic-link login was previously user-confirmed for the approved beta/admin
  email. Current T031 recheck blocks at `error=auth_failed`.
- Current validation is recorded in `qa/milestone_T010_report.md`.
- DB adapter, persistent usage ledger, route split, AI coach, internal dashboard,
  and admin aggregate reporting are implemented for controlled-beta validation.
  Production deployment and production migration remain blocked.

## Review gate

Reviewer:

- product owner
- engineering lead
- security/privacy owner

Review scope:

- provider defaults
- persistence boundary
- AI route gating
- DB schema and RLS
- quota semantics
- deployment settings

Pass condition:

- all tests pass
- no forbidden persistence
- deterministic fallback works
- provider keys stay server-only
- RLS policies protect user-owned data
- preview smoke tests pass

Fallback:

- keep demo deterministic only
- disable AI mode
- do not deploy authenticated beta

## Final goal update

Status: `IMPLEMENTATION_COMPLETE_T031_PARTIAL_STAGING_VALIDATION`

The final implementation status is recorded in `qa/final_goal_status.md`.
The next recommended goal is to restore staging auth-link initiation, then
complete validation of authenticated routes, metadata-only persistence, and
admin aggregate reporting.
