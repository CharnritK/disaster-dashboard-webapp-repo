# QA / Challenger Closeout v1.1

## Verdict

`READY_WITH_ASSUMPTIONS`

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

### C1 — Vercel facts need current verification

Severity: High

Node runtime and Hobby limits may have changed. Codex or a human must check official Vercel docs before hard-coding runtime/function assumptions.

### C2 — Provider approvals are explicit but still high-impact

Severity: High

The default path approves Supabase Auth and Supabase Postgres only if the explicit approval block remains unchanged. Auth and DB provider work must stop if approval flags are edited or missing.

### C3 — Production actions are not approved

Severity: High

Deployment and migrations are external, irreversible-risk actions. Codex must create code and docs only. A human must deploy and run production migrations.

### C4 — Existing test coverage must be verified

Severity: Medium

Prior inspection did not find meaningful tests despite Vitest being configured. Codex must run `npm run test` and add unit/route tests before feature integration.

## Unsupported or weak claims

- Exact current Vercel Node versions.
- Exact current Hobby function durations.
- Current free-tier details for Supabase or other providers.
- Current repo test count since prior inspection.

## Required fixes before production

- Verify Vercel docs.
- Confirm provider approval flags.
- Add unit and route tests.
- Add RLS and privacy regression tests.
- Review DB schema and RLS policies.
- Run preview deployment smoke tests.
- Complete security/privacy review.

## Release readiness

Not production-ready.

The handoff is ready for controlled Codex implementation with assumptions and review gates. Preview build readiness depends on baseline commands and provider setup. Production release remains blocked until review gates are closed.

## T010A checkpoint update

Status: `CHECKPOINT_REACHED_STOP_REQUIRED`

The first milestone implementation reached the mandated T010/T010A checkpoint. The new checkpoint report is `qa/milestone_T010_report.md`.

Validated:

- lint, tests, and build pass after implementation;
- browser smoke passes on desktop and mobile through local Next dev;
- unauthenticated `/api/usage` returns deterministic fallback status;
- no provider SDK, real auth integration, database adapter, route split, AI coach, internal dashboard, production deployment, or migration was started.

Continue only after human review approves the checkpoint and confirms the next phase scope.

Continuation note:

- T006/T006A SQL drafts, T025 status hardening, and T027 deployment smoke artifacts were added as credential-free review artifacts after the initial checkpoint.
- T011 Supabase Auth foundation was added after confirming `APPROVED_PROVIDER_IMPLEMENTATION=true` and `APPROVED_AUTH_PROVIDER=Supabase Auth`.
- `/app/**` is now protected by Supabase SSR middleware and a verified-claims server page check; `/`, `/about`, `/demo`, and API fallback routes remain public.
- Magic-link login/callback/signout routes exist, but manual end-to-end Supabase email login is not claimed without reviewed provider credentials and redirect configuration.
- Current validation is recorded in `qa/milestone_T010_report.md`.
- DB adapter, persistent usage ledger, route split, AI coach, internal dashboard, production deployment, and production migration remain blocked.

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

Status: `IMPLEMENTATION_COMPLETE_WITH_T021_STOP_GATE`

The final implementation status is recorded in `qa/final_goal_status.md`.
T021 full workflow step-route split remains stop-gated because a correct split
requires shared in-memory workflow state under `/app`; fake route aliases would
not satisfy the product contract.
