# Supabase RLS and Server-Only Access Requirements

This file is a security implementation note for the approved default provider path: Supabase Auth + Supabase Postgres.

Current SQL drafts: `../../../db/schema.sql` and `../../../db/rls.sql`. These
are review artifacts only, not production migrations.

## Non-negotiable rules

- Use Supabase `auth.users` as the identity source.
- Do not build custom password storage.
- Do not create an application password table.
- Map application user/profile rows to `auth.users.id`.
- Enable RLS on every user-owned or user-related table.
- Use `auth.uid()` for owner-scoped policies.
- Keep service-role keys server-only.
- Never import service-role credentials into client components.
- Do not allow direct browser writes unless the RLS policy is explicitly tested.

## Tables requiring RLS

- `users` / `user_profiles`
- `ai_usage_daily`
- `ai_events`
- `feedback`
- `custom_templates`
- `template_versions`

## Policy intent

| table | user read | user write | server write | admin/eval read |
|---|---|---|---|---|
| users/user_profiles | own profile | safe own fields only | yes | yes |
| ai_usage_daily | own usage | no direct write | yes | aggregate only |
| ai_events | own events if exposed | no direct write | yes | aggregate only |
| feedback | own feedback | own feedback only | yes | aggregate only |
| custom_templates | own templates | own draft/private templates | yes | reviewed metadata only |
| template_versions | reviewed + own versions | own draft versions only | yes | reviewed/all if admin |

## Acceptance criteria

- Schema SQL includes `alter table ... enable row level security` for each user-owned table.
- Policies use `auth.uid()` for owner isolation.
- Service-role client is only initialized in server-only modules.
- Client components cannot import DB service-role code.
- Tests or SQL policy checks cover owner read/write isolation.
- No uploaded rows, files, prepared rows, exported files, or prompt bodies are stored.

## Review gate

Reviewer: security/privacy owner and engineering lead.

Review scope:

- Supabase Auth mapping
- RLS policy correctness
- service-role key isolation
- server/client import boundaries
- metadata-only persistence compliance

Pass condition:

- owner isolation is enforced,
- server-only keys are not browser-visible,
- DB schema only includes allowed persistence,
- no production migration is run by Codex.

Fallback:

- keep in-memory adapter and SQL drafts only.
