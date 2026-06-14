> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T024 — Add internal eval and usage dashboard
Owner: AI Governance Engineer

Goal: Show aggregate usage and feedback to admins using metadata only.

Target files:
- `app/app/usage/page.tsx`
- `app/admin/**`
- `lib/adminMetrics/**`

Implementation notes:
- `Aggregate usage, fallback reasons, feedback tags, templates.`
- `Protect with admin role.`
- `Do not display row data or full prompts.`

Acceptance criteria:
- `Admins see usage, fallbacks, tags.`
- `Users cannot access admin view.`
- `No row data shown.`

Tests:
- admin guard
- query functions
- metadata-only checks

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No export of eval data.`
- `No saved datasets.`

Dependencies: T015, T013

Risk: Medium

Stop condition: Stop if dashboard could expose user data or row-like metadata.
