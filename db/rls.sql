-- Dashboard Copilot Supabase RLS and Data API grant draft.
--
-- Review artifact only: do not run against production without explicit
-- migration approval. Data API grants and RLS are both required controls.

revoke all on table public.user_profiles from anon, authenticated;
revoke all on table public.ai_usage_daily from anon, authenticated;
revoke all on table public.ai_events from anon, authenticated;
revoke all on table public.feedback from anon, authenticated;
revoke all on table public.custom_templates from anon, authenticated;
revoke all on table public.template_versions from anon, authenticated;

alter table public.user_profiles enable row level security;
alter table public.ai_usage_daily enable row level security;
alter table public.ai_events enable row level security;
alter table public.feedback enable row level security;
alter table public.custom_templates enable row level security;
alter table public.template_versions enable row level security;

grant select on table public.user_profiles to authenticated;
grant update (display_name, last_login_at, updated_at) on table public.user_profiles to authenticated;
grant select on table public.ai_usage_daily to authenticated;
grant select on table public.ai_events to authenticated;
grant select, insert on table public.feedback to authenticated;
grant select, insert, update, delete on table public.custom_templates to authenticated;
grant select, insert, update, delete on table public.template_versions to authenticated;

grant select, insert, update, delete on table public.user_profiles to service_role;
grant select, insert, update, delete on table public.ai_usage_daily to service_role;
grant select, insert, update, delete on table public.ai_events to service_role;
grant select, insert, update, delete on table public.feedback to service_role;
grant select, insert, update, delete on table public.custom_templates to service_role;
grant select, insert, update, delete on table public.template_versions to service_role;

-- RPC execution should be explicit. Keep reserve_ai_usage unavailable to
-- browser roles until a reviewed migration decides otherwise.
revoke execute on function public.reserve_ai_usage(uuid, date, integer) from anon, authenticated;
grant execute on function public.reserve_ai_usage(uuid, date, integer) to service_role;

drop policy if exists "Users can read own profile" on public.user_profiles;
create policy "Users can read own profile"
  on public.user_profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can update safe own profile fields" on public.user_profiles;
create policy "Users can update safe own profile fields"
  on public.user_profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can read own usage" on public.ai_usage_daily;
create policy "Users can read own usage"
  on public.ai_usage_daily
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- No authenticated INSERT/UPDATE/DELETE grant or policy for ai_usage_daily.
-- Server routes must reserve usage through service-role code or a reviewed RPC.

drop policy if exists "Users can read own AI events" on public.ai_events;
create policy "Users can read own AI events"
  on public.ai_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- No authenticated INSERT/UPDATE/DELETE grant or policy for ai_events.
-- Server routes record events through service-role code or a reviewed RPC.

drop policy if exists "Users can read own feedback" on public.feedback;
create policy "Users can read own feedback"
  on public.feedback
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own feedback" on public.feedback;
create policy "Users can insert own feedback"
  on public.feedback
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own or reviewed templates" on public.custom_templates;
create policy "Users can read own or reviewed templates"
  on public.custom_templates
  for select
  to authenticated
  using (
    (select auth.uid()) = owner_user_id
    or visibility = 'reviewed'
    or status = 'reviewed'
  );

drop policy if exists "Users can insert own draft templates" on public.custom_templates;
create policy "Users can insert own draft templates"
  on public.custom_templates
  for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_user_id
    and status = 'draft'
    and visibility = 'private'
  );

drop policy if exists "Users can update own draft private templates" on public.custom_templates;
create policy "Users can update own draft private templates"
  on public.custom_templates
  for update
  to authenticated
  using (
    (select auth.uid()) = owner_user_id
    and status = 'draft'
    and visibility = 'private'
  )
  with check (
    (select auth.uid()) = owner_user_id
    and status = 'draft'
    and visibility = 'private'
  );

drop policy if exists "Users can delete own draft private templates" on public.custom_templates;
create policy "Users can delete own draft private templates"
  on public.custom_templates
  for delete
  to authenticated
  using (
    (select auth.uid()) = owner_user_id
    and status = 'draft'
    and visibility = 'private'
  );

drop policy if exists "Users can read reviewed or own template versions" on public.template_versions;
create policy "Users can read reviewed or own template versions"
  on public.template_versions
  for select
  to authenticated
  using (
    is_reviewed = true
    or exists (
      select 1
      from public.custom_templates templates
      where templates.id = template_versions.template_id
        and templates.owner_user_id = (select auth.uid())
    )
  );

drop policy if exists "Users can insert own draft template versions" on public.template_versions;
create policy "Users can insert own draft template versions"
  on public.template_versions
  for insert
  to authenticated
  with check (
    is_reviewed = false
    and review_status = 'draft'
    and exists (
      select 1
      from public.custom_templates templates
      where templates.id = template_versions.template_id
        and templates.owner_user_id = (select auth.uid())
        and templates.status = 'draft'
        and templates.visibility = 'private'
    )
  );

drop policy if exists "Users can update own draft template versions" on public.template_versions;
create policy "Users can update own draft template versions"
  on public.template_versions
  for update
  to authenticated
  using (
    is_reviewed = false
    and review_status = 'draft'
    and exists (
      select 1
      from public.custom_templates templates
      where templates.id = template_versions.template_id
        and templates.owner_user_id = (select auth.uid())
        and templates.status = 'draft'
        and templates.visibility = 'private'
    )
  )
  with check (
    is_reviewed = false
    and review_status = 'draft'
    and exists (
      select 1
      from public.custom_templates templates
      where templates.id = template_versions.template_id
        and templates.owner_user_id = (select auth.uid())
        and templates.status = 'draft'
        and templates.visibility = 'private'
    )
  );

drop policy if exists "Users can delete own draft template versions" on public.template_versions;
create policy "Users can delete own draft template versions"
  on public.template_versions
  for delete
  to authenticated
  using (
    is_reviewed = false
    and review_status = 'draft'
    and exists (
      select 1
      from public.custom_templates templates
      where templates.id = template_versions.template_id
        and templates.owner_user_id = (select auth.uid())
        and templates.status = 'draft'
        and templates.visibility = 'private'
    )
  );
