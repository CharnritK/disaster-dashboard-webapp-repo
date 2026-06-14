> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T006 — Draft metadata-only database schema
Owner: Persistence Engineer

Goal: Add schema draft for approved tables without running production migrations.

Target files:
- `db/schema.sql`
- `docs/data_model.md`

Implementation notes:
- `Create SQL/schema draft for users/user_profiles, ai_usage_daily, ai_events, feedback, custom_templates, and template_versions.`
- `Map app profiles to auth.users if Supabase remains approved.`
- `Document forbidden persistence in schema comments.`

Acceptance criteria:
- `Schema draft exists.`
- `Forbidden data is documented.`
- `No production migration is run.`

Tests:
- `Schema validation if tooling exists.`
- `Static review if no schema tooling exists.`

Commands:
- `npm run lint`
- `npm run test`

Non-goals:
- `No production DB writes.`
- `No provider SDK install unless explicitly approved.`

Dependencies: T004, T005, T010A

Risk: Medium

Stop condition: Stop before migration execution or if schema requires storing forbidden data.
