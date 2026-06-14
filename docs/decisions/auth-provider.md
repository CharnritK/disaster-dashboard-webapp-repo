# Auth Provider Decision

Status: approved default, implemented for staging preview; production gated

## Decision

Use Supabase Auth as the default provider for the controlled authenticated AI beta when the explicit approval flags remain:

```text
APPROVED_PROVIDER_IMPLEMENTATION=true
APPROVED_AUTH_PROVIDER=Supabase Auth
```

## Rationale

Supabase Auth keeps identity close to the approved Supabase Postgres metadata layer and maps cleanly to `auth.users(id)` for RLS owner policies. It also avoids custom password handling in this app.

## Alternative Considered

Auth.js with OAuth is a viable alternative if the project later wants provider flexibility without adopting Supabase Auth. It would add a separate auth integration and still require a careful user-to-database identity mapping for owner-scoped metadata.

## Boundaries

- Do not build custom password storage.
- Do not create an app-owned password table.
- Keep `/demo` public and deterministic.
- Keep `/app/**` protected by Supabase-backed auth in configured preview/staging environments.
- Keep test identities limited to `NODE_ENV=test`.
- Do not request or handle credentials in code generation.

## Review Gate

Before any additional auth-provider changes or production configuration,
confirm the approval flags remain explicit, secrets stay server-side, and route
protection preserves the public deterministic demo.
