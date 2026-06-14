> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T006A — Add Supabase RLS policy draft and server-only DB access rules
Owner: Persistence Engineer

Goal: Prevent insecure provider integration by defining RLS, auth.users mapping, and service-key boundaries before real DB code.

Target files:
- `db/rls.sql`
- `db/README.md`
- `docs/security_supabase_rls.md`
- `lib/db/serverClient.ts or verified equivalent`

Implementation notes:
- `Enable RLS on user-owned tables in SQL draft.`
- `Use auth.uid() owner policies.`
- `Make ai_events/ai_usage writes server-controlled.`
- `Document service-role key must never be imported into client modules.`
- `Reviewed templates are read-only to normal users; custom templates are owner-scoped.`

Acceptance criteria:
- `RLS policy draft exists.`
- `Owner isolation rules are explicit.`
- `Server-only DB client boundary is documented.`
- `No client-side service-role key import path exists.`

Tests:
- `Add policy checks if Supabase local/test tooling exists.`
- `Add static import guard test for service-role key helper if feasible.`

Commands:
- `npm run lint`
- `npm run test`

Non-goals:
- `No production migration.`
- `No direct browser writes unless policies are tested.`

Dependencies: T006

Risk: High

Stop condition: Stop before provider integration if RLS ownership rules cannot be defined.
