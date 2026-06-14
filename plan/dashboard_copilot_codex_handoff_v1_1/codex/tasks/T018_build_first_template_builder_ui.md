> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T018 — Build first Template Builder UI
Owner: Template Builder Engineer

Goal: Let users create private draft templates.

Target files:
- `app/app/templates/page.tsx`
- `app/app/templates/new/page.tsx`
- `components/TemplateBuilder.tsx`

Implementation notes:
- `Build form for decision question, intended action, decision-maker, geography/timeframe, required evidence, suggested fields, caveats, example schema.`
- `AI may advise later but must not certify safety.`

Acceptance criteria:
- `Draft form saves.`
- `List shows user drafts and reviewed templates.`
- `Validation errors render.`

Tests:
- component validation
- manual save flow

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No official approval workflow.`

Dependencies: T017

Risk: Medium

Stop condition: Stop if route structure not split yet.
