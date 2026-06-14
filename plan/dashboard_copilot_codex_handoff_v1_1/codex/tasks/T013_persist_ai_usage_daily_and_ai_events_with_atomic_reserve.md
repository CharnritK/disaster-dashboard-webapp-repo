> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T013 — Persist ai_usage_daily and ai_events with atomic reserve
Owner: AI Governance Engineer

Goal: Move usage/event logging from memory to DB adapter using provider-attempt accounting.

Target files:
- `lib/entitlement/**`
- `lib/usage/**`
- `lib/db/**`
- `tests/usage-db.test.ts`

Implementation notes:
- `Reserve usage before provider call.`
- `Count provider attempts, not just successes.`
- `Do not increment for unauthenticated, not_entitled, quota_exceeded, ai_disabled, missing_api_key, invalid_request, or request_too_large.`
- `Record attempted_provider_call and succeeded separately.`

Acceptance criteria:
- `Usage rows upsert correctly.`
- `Event rows store safe metadata.`
- `Denied fallback does not increment.`
- `Provider attempt increments/reserves.`

Tests:
- upsert
- `atomic reserve/concurrent if feasible`
- privacy guard
- denied fallback no increment

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No full prompt or row persistence.`

Dependencies: T012, T014

Risk: High

Stop condition: Stop if transaction/reservation semantics are unsafe.
