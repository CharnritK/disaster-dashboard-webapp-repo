# Data Model Draft

Use Postgres only after provider approval. Until then, implement interfaces and in-memory test adapters.

Current SQL draft: `../../../db/schema.sql`. This is a review artifact only,
not a production migration.

## Global rules

- Use UUID primary keys.
- Use `created_at` and `updated_at` timestamps.
- Use parameterized SQL or a safe ORM.
- Never store uploaded rows, prepared rows, exported files, full prompts, or secrets.
- Store JSON only for metadata and schema-like content.
- If using Supabase, use `auth.users` as the source of identity and enable RLS on user-owned tables.

## Supabase Auth mapping

For Supabase Auth:

- Do not create a password table.
- Do not store password hashes in the app database.
- Use Supabase `auth.users` as the authentication source.
- Create `public.users` or `public.user_profiles` with:
  - `id`: UUID primary key references `auth.users(id)` on delete cascade
  - `email`: text nullable
  - `display_name`: text nullable
  - `role`: text default `user`
  - `created_at`: timestamptz
  - `updated_at`: timestamptz
  - `last_login_at`: timestamptz nullable
- Use `auth.uid()` in RLS owner policies.

Privacy notes:

- Store minimum account metadata.
- Do not store API keys, service-role keys, or provider secrets.
- Do not store uploaded data or sensitive operational notes.

## Table: ai_usage_daily

Fields:

- `id`: UUID primary key
- `user_id`: UUID foreign key to app user profile / `auth.users(id)`
- `usage_date`: date, based on Asia/Bangkok
- `used_count`: integer
- `daily_limit`: integer
- `created_at`: timestamptz
- `updated_at`: timestamptz

Constraints:

- unique: `user_id`, `usage_date`
- index: `usage_date`

RLS expectation:

- users can read own usage;
- writes are server-only or controlled by a reviewed RPC;
- no client direct write unless policy tests exist.

Never store:

- prompts;
- row values;
- model responses.

## Table: ai_events

Fields:

- `id`: UUID primary key
- `user_id`: UUID foreign key nullable
- `created_at`: timestamptz
- `task_type`: text
- `route`: text
- `ai_mode`: text
- `model`: text nullable
- `provider`: text nullable
- `prompt_version`: text
- `template_id`: UUID nullable
- `template_version_id`: UUID nullable
- `readiness_status`: text nullable
- `fallback_reason`: text nullable
- `attempted_provider_call`: boolean
- `succeeded`: boolean
- `dashboard_recommendation_ids`: text array
- `export_action`: text nullable
- `metadata`: jsonb

Constraints:

- index: `user_id`, `created_at`
- index: `task_type`
- index: `fallback_reason`

RLS expectation:

- normal users cannot directly insert arbitrary events;
- server routes record events;
- user-facing reads, if exposed, are owner-scoped.

Privacy notes:

- Metadata must be non-sensitive.
- Metadata may include counts, ids, selected options, task names, fallback reasons, and versions.
- Metadata must not include row-like values.

Never store:

- full request body;
- full prompt;
- full response if it contains row-like values;
- uploaded fields with sample values beyond approved metadata.

## Table: feedback

Fields:

- `id`: UUID primary key
- `user_id`: UUID foreign key
- `ai_event_id`: UUID foreign key nullable
- `template_id`: UUID nullable
- `template_version_id`: UUID nullable
- `dashboard_id`: text nullable
- `thumb`: text, `up` or `down`
- `tags`: text array
- `comment`: text nullable
- `created_at`: timestamptz

Constraints:

- index: `user_id`, `created_at`
- index: `ai_event_id`
- check: `thumb in ('up','down')`
- server-side allowed tag validation

RLS expectation:

- users can insert/read own feedback;
- admins can aggregate metadata only.

Privacy notes:

- UI copy must warn users not to include sensitive data.
- Server should limit comment length.

Never store:

- pasted data rows;
- exported reports;
- screenshots with sensitive data.

## Table: custom_templates

Fields:

- `id`: UUID primary key
- `owner_user_id`: UUID foreign key
- `status`: text
- `visibility`: text
- `title`: text
- `description`: text nullable
- `created_at`: timestamptz
- `updated_at`: timestamptz
- `latest_version_id`: UUID nullable

Constraints:

- index: `owner_user_id`, `status`
- index: `visibility`

RLS expectation:

- users can CRUD own draft/private templates;
- reviewed templates are not edited by normal users.

Privacy notes:

- Draft/private by default.
- Treat user templates as untrusted.

Never store:

- uploaded datasets;
- customer data;
- operational incident details.

## Table: template_versions

Fields:

- `id`: UUID primary key
- `template_id`: UUID foreign key nullable
- `version_number`: integer
- `is_reviewed`: boolean
- `review_status`: text
- `reviewed_by_user_id`: UUID nullable
- `decision_question`: text
- `intended_action`: text
- `decision_maker`: text
- `geography_timeframe`: text
- `required_evidence`: text array
- `suggested_fields`: jsonb
- `caveats`: text
- `example_data_schema`: jsonb
- `created_at`: timestamptz

Constraints:

- unique: `template_id`, `version_number`
- index: `is_reviewed`
- index: `review_status`

RLS expectation:

- reviewed versions are read-only for normal users;
- draft versions are owner-scoped.

Privacy notes:

- Example schema is allowed.
- Example rows are not allowed.

Never store:

- sample row data;
- sensitive field values;
- certification claims unless reviewed.
