-- Read-only verification queries for the Dashboard Copilot metadata preview DB.
--
-- Run only after db/schema.sql and db/rls.sql have been applied to a preview or
-- staging Supabase database. Do not run migrations against production.

with expected_tables(table_name) as (
  values
    ('user_profiles'),
    ('ai_usage_daily'),
    ('ai_events'),
    ('feedback'),
    ('custom_templates'),
    ('template_versions')
)
select
  expected_tables.table_name,
  tables.table_name is not null as exists_in_public,
  coalesce(pg_class.relrowsecurity, false) as rls_enabled
from expected_tables
left join information_schema.tables tables
  on tables.table_schema = 'public'
  and tables.table_name = expected_tables.table_name
left join pg_class
  on pg_class.oid = to_regclass(format('public.%I', expected_tables.table_name))
order by expected_tables.table_name;

select
  routine_schema,
  routine_name,
  data_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'reserve_ai_usage';

select
  to_regprocedure('public.reserve_ai_usage(uuid,date,integer)') is not null
    as rpc_exists,
  has_function_privilege(
    'anon',
    'public.reserve_ai_usage(uuid,date,integer)',
    'execute'
  ) as anon_execute,
  has_function_privilege(
    'authenticated',
    'public.reserve_ai_usage(uuid,date,integer)',
    'execute'
  ) as authenticated_execute,
  has_function_privilege(
    'service_role',
    'public.reserve_ai_usage(uuid,date,integer)',
    'execute'
  ) as service_role_execute;

select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'user_profiles',
    'ai_usage_daily',
    'ai_events',
    'feedback',
    'custom_templates',
    'template_versions'
  )
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;
