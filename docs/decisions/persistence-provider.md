# Persistence Provider Decision

Status: approved default, implemented for staging preview; production gated

## Decision

Use Supabase Postgres as the default metadata store for the controlled authenticated AI beta when the explicit approval flags remain:

```text
APPROVED_PROVIDER_IMPLEMENTATION=true
APPROVED_PERSISTENCE_PROVIDER=Supabase Postgres
APPROVED_SCHEMA_FILES=true
APPROVED_PRODUCTION_MIGRATIONS=false
```

## Rationale

Supabase Postgres gives the project a managed Postgres path with RLS, owner-scoped tables, and a natural pairing with Supabase Auth. The allowed data model is metadata-only: account/profile metadata, AI usage, AI events, feedback, custom templates, template versions, and non-sensitive eval metadata.

## Alternative Considered

Neon Postgres is a viable managed Postgres alternative. It keeps the app on standard Postgres, but auth/RLS ownership would need a separate identity provider mapping and additional integration work.

## Forbidden Persistence

The database must not store uploaded files, uploaded rows, prepared rows, full datasets, exported reports/files, full LLM request bodies, full prompts, secrets, API keys, service-role keys, private tokens, or sensitive operational data.

## Supabase-Specific Notes

Current Supabase guidance requires treating Data API grants and RLS as separate controls. New tables may need explicit grants before they are reachable through the Data API, and RLS must still be enabled on exposed tables. Service-role or secret keys must stay in server-only modules.

## Review Gate

Before production DB configuration or migration, review schema, RLS policies,
owner isolation, server-only import boundaries, rollback notes, and current
staging evidence. Codex must not run production migrations.
