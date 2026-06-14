# Approvals To Review

Use this file to decide whether `codex/prompts/GOAL_FULL_BUILD.md` is ready to paste after `/goal`.

## Explicit approval defaults

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

## What the flags mean

| flag | default | meaning |
|---|---|---|
| `APPROVED_PROVIDER_IMPLEMENTATION` | `true` | Codex may install and wire the approved auth/DB provider after decision records and local entitlement tests exist. |
| `APPROVED_SCHEMA_FILES` | `true` | Codex may create schema and RLS SQL files. It may not run production migrations. |
| `APPROVED_PREVIEW_DEPLOYMENT` | `true` | Codex may prepare and validate preview-only deployment settings when credentials and target are supplied. |
| `APPROVED_PRODUCTION_DEPLOYMENT` | `false` | Codex must not deploy to production or change production settings. |
| `APPROVED_PRODUCTION_MIGRATIONS` | `false` | Codex must not run migrations against production. |
| `APPROVED_AI_PROVIDER_MODEL_CHANGES` | `false` | Codex must not change AI provider/model behavior except metadata logging and route gating. |
| `APPROVED_DATA_RETENTION_AUTOMATION` | `false` | Codex may draft retention policy but must not automate deletion. |
| `APPROVED_OPEN_SIGNUP` | `false` | Supabase Auth must stay invite/allowlist controlled for beta. |

## If not approved

Set `APPROVED_PROVIDER_IMPLEMENTATION=false` before pasting the goal prompt.

Codex must stop after:

1. baseline repo audit;
2. deterministic env cleanup;
3. provider decision records;
4. in-memory entitlement service and tests.

Codex must not:

- install provider SDKs;
- create provider-specific DB code;
- run migrations;
- change production deployment settings;
- request or handle credentials.
