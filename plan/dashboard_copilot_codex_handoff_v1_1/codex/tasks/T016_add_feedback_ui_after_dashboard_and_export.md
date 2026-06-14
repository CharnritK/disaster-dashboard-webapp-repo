> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T016 — Add feedback UI after dashboard and export
Owner: Eval & Feedback Engineer

Goal: Capture thumbs and tags in workflow.

Target files:
- `components/FeedbackForm.tsx`
- `components/WorkflowComponents.tsx`
- `app/**`

Implementation notes:
- `Render thumbs up/down, allowed tags, optional comment.`
- `Warn users not to include sensitive data.`
- `Post to feedback API.`
- `Show success/error states.`

Acceptance criteria:
- `User can submit feedback.`
- `Success/error states render.`
- `No demo-only noise.`

Tests:
- component validation
- manual export flow

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No AI suggestion editing tracking yet.`

Dependencies: T015

Risk: Low

Stop condition: Stop if UI target changes in route split.
