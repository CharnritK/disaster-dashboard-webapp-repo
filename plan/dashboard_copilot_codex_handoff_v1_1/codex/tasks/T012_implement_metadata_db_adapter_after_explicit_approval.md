> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T012 — Implement metadata DB adapter after explicit approval
Owner: Persistence Engineer

Goal: Connect approved Postgres provider safely while preserving metadata-only boundary.

Target files:
- `lib/db/**`
- `db/**`
- `tests/db-adapter.test.ts`

Implementation notes:
- `Proceed only after T006A and explicit approval.`
- `Use server-only DB client for privileged access.`
- `Adapter supports required tables only.`
- `No row persistence method may exist.`

Acceptance criteria:
- `Adapter supports required metadata tables.`
- `Tests use memory or test DB.`
- `No upload persistence API exists.`
- `Service-role key is server-only.`

Tests:
- CRUD metadata
- no row persistence method
- error handling
- server-only import guard if feasible

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No production DB writes.`
- `No direct browser writes without RLS tests.`

Dependencies: T006A, T011

Risk: High

Stop condition: Stop before production DB writes or if server-only key handling is unclear.
