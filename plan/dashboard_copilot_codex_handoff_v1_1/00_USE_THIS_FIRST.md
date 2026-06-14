# 00 — Use This First

This package is designed for a Codex-like coding agent.

## Paste-ready command

Use:

```text
/goal
[then paste the full contents of codex/prompts/GOAL_FULL_BUILD.md]
```

`GOAL_FULL_BUILD.md` intentionally does **not** start with `/goal`. Do not type `/goal` twice.

## Explicit approval block

The `/goal` prompt contains explicit approval flags. Review them before pasting.

Default values in v1.1:

```text
APPROVED_AUTH_PROVIDER=Supabase Auth
APPROVED_PERSISTENCE_PROVIDER=Supabase Postgres
APPROVED_DAILY_AI_QUOTA=20
APPROVED_ROOT_BEHAVIOR=/ redirects to /demo
APPROVED_ANONYMOUS_AI_VISIBILITY=none in /demo

APPROVED_PROVIDER_IMPLEMENTATION=true
APPROVED_SCHEMA_FILES=true
APPROVED_PREVIEW_DEPLOYMENT=true
APPROVED_PRODUCTION_DEPLOYMENT=false
APPROVED_PRODUCTION_MIGRATIONS=false
APPROVED_AI_PROVIDER_MODEL_CHANGES=false
APPROVED_DATA_RETENTION_AUTOMATION=false
APPROVED_OPEN_SIGNUP=false
APPROVED_BETA_ACCESS=named beta emails only
APPROVED_ADMIN_ACCESS=named admin emails only
```

If you do not approve provider implementation, set:

```text
APPROVED_PROVIDER_IMPLEMENTATION=false
```

Codex must then stop after:

1. repo baseline;
2. deterministic env/docs cleanup;
3. provider decision records;
4. in-memory entitlement service and tests.

## Safe execution rule

Codex may write code in the repo and prepare preview-only validation. Codex must
not deploy production, run production database migrations, enter credentials,
modify external systems without supplied targets, or claim tests passed unless
it actually ran the commands and reports real output.

## Stop immediately if

- Current Vercel docs cannot be checked and a runtime/deployment setting would be hard-coded.
- The build/test baseline fails for reasons unrelated to the current task.
- A provider SDK would be installed but `APPROVED_PROVIDER_IMPLEMENTATION` is not `true`.
- A migration would run against production.
- Raw uploaded data would be persisted or logged.
- Provider credentials are required.
- Any API key or service-role key would be exposed to the browser.
- The implementation would bypass Supabase RLS or owner isolation.
