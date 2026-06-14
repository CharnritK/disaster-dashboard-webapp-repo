-- Dashboard Copilot metadata-only schema draft.
--
-- This file is a review artifact, not an executed production migration.
-- It intentionally stores only account, quota, AI-event, feedback, and
-- template metadata. It must never be expanded to store uploaded rows,
-- prepared rows, exported files, screenshots, full prompts, full model
-- responses, provider secrets, or operational incident details.

create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz,
  constraint user_profiles_role_check check (role in ('user', 'admin'))
);

comment on table public.user_profiles is
  'Minimal Supabase Auth profile metadata. No passwords, API keys, uploaded data, or operational incident details.';

create table if not exists public.custom_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft',
  visibility text not null default 'private',
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  latest_version_id uuid,
  constraint custom_templates_status_check check (status in ('draft', 'reviewed', 'archived')),
  constraint custom_templates_visibility_check check (visibility in ('private', 'reviewed'))
);

comment on table public.custom_templates is
  'Template metadata only. Does not store datasets, customer rows, or operational incident details.';

create index if not exists custom_templates_owner_status_idx
  on public.custom_templates (owner_user_id, status);

create index if not exists custom_templates_visibility_idx
  on public.custom_templates (visibility);

create table if not exists public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.custom_templates(id) on delete cascade,
  version_number integer not null,
  is_reviewed boolean not null default false,
  review_status text not null default 'draft',
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  decision_question text not null,
  intended_action text not null,
  decision_maker text not null,
  geography_timeframe text not null,
  required_evidence text[] not null default '{}',
  suggested_fields jsonb not null default '[]'::jsonb,
  caveats text not null default '',
  example_data_schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint template_versions_template_version_unique unique (template_id, version_number),
  constraint template_versions_version_number_check check (version_number > 0),
  constraint template_versions_review_status_check check (review_status in ('draft', 'pending_review', 'reviewed', 'rejected'))
);

comment on table public.template_versions is
  'Decision-template version metadata and schema hints only. Example rows and sensitive field values are forbidden.';

comment on column public.template_versions.suggested_fields is
  'Schema-like field suggestions only; do not store sample row values.';

comment on column public.template_versions.example_data_schema is
  'Allowed: column names/types/roles. Forbidden: example rows, uploaded values, or customer data.';

create index if not exists template_versions_is_reviewed_idx
  on public.template_versions (is_reviewed);

create index if not exists template_versions_review_status_idx
  on public.template_versions (review_status);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'custom_templates_latest_version_fk'
      and conrelid = 'public.custom_templates'::regclass
  ) then
    alter table public.custom_templates
      add constraint custom_templates_latest_version_fk
      foreign key (latest_version_id)
      references public.template_versions(id)
      on delete set null;
  end if;
end;
$$;

create table if not exists public.ai_usage_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  used_count integer not null default 0,
  daily_limit integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_usage_daily_user_date_unique unique (user_id, usage_date),
  constraint ai_usage_daily_used_count_check check (used_count >= 0),
  constraint ai_usage_daily_daily_limit_check check (daily_limit > 0),
  constraint ai_usage_daily_limit_bounds_check check (used_count <= daily_limit)
);

comment on table public.ai_usage_daily is
  'Daily AI provider-attempt quota metadata. Does not store prompts, rows, model responses, or exported artifacts.';

create index if not exists ai_usage_daily_usage_date_idx
  on public.ai_usage_daily (usage_date);

create or replace function public.reserve_ai_usage(
  p_user_id uuid,
  p_usage_date date,
  p_daily_limit integer
)
returns table (
  id uuid,
  user_id uuid,
  usage_date date,
  used_count integer,
  daily_limit integer,
  created_at timestamptz,
  updated_at timestamptz,
  reserved boolean
)
language plpgsql
as $$
declare
  v_reserved_count integer;
begin
  return query
  insert into public.ai_usage_daily as usage_row (
    user_id,
    usage_date,
    used_count,
    daily_limit,
    updated_at
  )
  values (
    p_user_id,
    p_usage_date,
    1,
    p_daily_limit,
    now()
  )
  on conflict (user_id, usage_date)
  do update set
    daily_limit = excluded.daily_limit,
    updated_at = now(),
    used_count = usage_row.used_count + 1
  where usage_row.used_count < excluded.daily_limit
  returning
    usage_row.id,
    usage_row.user_id,
    usage_row.usage_date,
    usage_row.used_count,
    usage_row.daily_limit,
    usage_row.created_at,
    usage_row.updated_at,
    true as reserved;

  get diagnostics v_reserved_count = row_count;
  if v_reserved_count > 0 then
    return;
  end if;

  return query
  select
    usage_row.id,
    usage_row.user_id,
    usage_row.usage_date,
    usage_row.used_count,
    usage_row.daily_limit,
    usage_row.created_at,
    usage_row.updated_at,
    false as reserved
  from public.ai_usage_daily as usage_row
  where usage_row.user_id = p_user_id
    and usage_row.usage_date = p_usage_date;
end;
$$;

comment on function public.reserve_ai_usage(uuid, date, integer) is
  'Atomic daily AI provider-attempt reservation. Stores quota metadata only.';

create table if not exists public.ai_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  task_type text not null,
  route text not null,
  ai_mode text not null default 'deterministic',
  model text,
  provider text,
  prompt_version text not null,
  template_id uuid references public.custom_templates(id) on delete set null,
  template_version_id uuid references public.template_versions(id) on delete set null,
  readiness_status text,
  fallback_reason text,
  attempted_provider_call boolean not null default false,
  succeeded boolean not null default false,
  dashboard_recommendation_ids text[] not null default '{}',
  export_action text,
  metadata jsonb not null default '{}'::jsonb,
  constraint ai_events_route_check check (route in ('/api/recommend', '/api/copilot', '/api/coach')),
  constraint ai_events_ai_mode_check check (ai_mode in ('deterministic', 'llm')),
  constraint ai_events_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

comment on table public.ai_events is
  'Safe AI event metadata only. Full request bodies, prompts, row-like values, and full model responses are forbidden.';

comment on column public.ai_events.metadata is
  'Allowed: counts, identifiers, versions, selected options, fallback reasons. Forbidden: uploaded rows, sample values, full prompts, full responses.';

create index if not exists ai_events_user_created_at_idx
  on public.ai_events (user_id, created_at);

create index if not exists ai_events_task_type_idx
  on public.ai_events (task_type);

create index if not exists ai_events_fallback_reason_idx
  on public.ai_events (fallback_reason);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ai_event_id uuid references public.ai_events(id) on delete set null,
  template_id uuid references public.custom_templates(id) on delete set null,
  template_version_id uuid references public.template_versions(id) on delete set null,
  dashboard_id text,
  thumb text not null,
  tags text[] not null default '{}',
  comment text,
  created_at timestamptz not null default now(),
  constraint feedback_thumb_check check (thumb in ('up', 'down')),
  constraint feedback_comment_length_check check (comment is null or char_length(comment) <= 2000)
);

comment on table public.feedback is
  'User feedback metadata. Comments are length-limited and must not include sensitive data, pasted rows, screenshots, or reports.';

create index if not exists feedback_user_created_at_idx
  on public.feedback (user_id, created_at);

create index if not exists feedback_ai_event_id_idx
  on public.feedback (ai_event_id);
