> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T017 — Add template API routes
Owner: Template Builder Engineer

Goal: Create metadata-only template CRUD.

Target files:
- `app/api/templates/route.ts`
- `app/api/templates/[id]/route.ts`
- `lib/templates/**`
- `types/templates.ts`
- `tests/templates-api.test.ts`

Implementation notes:
- `Store user templates as draft/private by default.`
- `Reviewed templates are read-only to normal users.`
- `Validate template fields.`
- `Do not store example rows.`

Acceptance criteria:
- `Create draft works.`
- `Update draft works.`
- `Official/reviewed template cannot be edited by user.`
- `Versions validate.`

Tests:
- create
- update
- owner guard
- version validation
- example row rejection

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No admin approval UI.`

Dependencies: T012

Risk: Medium

Stop condition: Stop if template schema conflicts with existing decision types.
