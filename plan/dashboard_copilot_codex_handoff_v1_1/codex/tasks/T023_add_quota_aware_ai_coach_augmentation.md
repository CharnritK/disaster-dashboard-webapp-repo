> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T023 — Add quota-aware AI coach augmentation
Owner: AI Coach Engineer

Goal: Allow authenticated AI hints under quota without overriding deterministic coach.

Target files:
- `lib/coach/**`
- `app/api/recommend/route.ts or dedicated coach route`
- `components/AiCoachPanel.tsx`

Implementation notes:
- `AI coach only behind auth/quota.`
- `Fallback to deterministic hints on quota/provider failure.`
- `Record events with prompt versions.`
- `Never send row-like values.`

Acceptance criteria:
- `AI coach only when auth/quota valid.`
- `Quota exceeded keeps deterministic hints.`
- `Events logged safely.`

Tests:
- under quota
- over quota
- unauth
- row-like payload guard

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No autonomous decisions.`
- `No readiness override.`

Dependencies: T022, T013, T014

Risk: Medium

Stop condition: Stop if prompt would include row-like values.
