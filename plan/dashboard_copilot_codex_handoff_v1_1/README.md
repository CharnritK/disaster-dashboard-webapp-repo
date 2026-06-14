# Dashboard Copilot Codex Handoff v1.1

This package is a Codex-ready handoff to convert `CharnritK/disaster-dashboard-webapp-repo` from a session-only prototype into a controlled authenticated AI beta with session-only uploaded data.

## Primary prompt

Use:

```text
/goal
[then paste codex/prompts/GOAL_FULL_BUILD.md]
```

`GOAL_FULL_BUILD.md` does not include `/goal` on its first line.

## v1.1 hardening

This revision:

- removes duplicate `/goal` ambiguity;
- adds explicit provider approval flags;
- tells Codex to read the package files before editing code;
- moves entitlement and quota foundations before provider integration;
- adds Supabase RLS and server-only DB requirements;
- defines provider-attempt quota accounting with atomic reserve;
- adds prompt/model version tracking requirements;
- adds a milestone checkpoint after T010.

## Product contract

Production v1 is:

> Controlled authenticated AI beta with session-only uploaded data.

Persistent storage is allowed only for users/auth metadata, AI usage, AI events, feedback, custom templates, template versions, and non-sensitive eval metadata.

Persistent storage is forbidden for uploaded files, uploaded rows, prepared rows, full datasets, exported files, full LLM request bodies, secrets, API keys, service-role keys, private tokens, or sensitive operational data.

## Status

Readiness: `IMPLEMENTATION_COMPLETE_STAGING_AUTH_VERIFIED`.

Assumptions:

- Supabase Auth and Supabase Postgres remain approved defaults.
- Current Vercel docs must be verified before hard-coding new runtime/function settings.
- Preview/staging Supabase configuration and Vercel Preview environment have been validated for the approved beta/admin email.
- No production deployment, production migrations, production credentials, or production environment changes are approved.

The task backlog and task cards remain useful as the historical execution plan.
For current state, use `qa/final_goal_status.md`,
`qa/supabase_staging_project_check_2026-06-14.md`, and
`qa/document_consistency_audit_2026-06-14.md`.

## Key files

- `00_USE_THIS_FIRST.md`
- `APPROVALS_TO_REVIEW.md`
- `codex/prompts/GOAL_FULL_BUILD.md`
- `codex/backlog.md`
- `codex/backlog.json`
- `docs/quota_accounting_policy.md`
- `docs/security_supabase_rls.md`
- `docs/prompt_versions.md`
- `qa/review_gates.md`
- `qa/testing_strategy.md`

## Required validation commands for Codex

```bash
npm run lint
npm run test
npm run build
```

Codex must report actual output and must not claim success unless the commands ran.
