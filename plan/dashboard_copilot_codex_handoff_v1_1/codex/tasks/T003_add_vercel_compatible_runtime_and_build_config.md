> Status note (2026-06-14): Historical v1.1 task card. T001-T030 are implemented for local/reviewable controlled-beta paths; check `../../qa/final_goal_status.md` and `../../qa/supabase_staging_project_check_2026-06-14.md` before treating this as active work.

# T003 — Add Vercel-compatible runtime and build config
Owner: Vercel Deployment Auditor

Goal: Remove repo-level build blockers for Vercel Free/Hobby without inventing current Vercel facts.

Target files:
- `package.json`
- `.tool-versions`
- `next.config.ts`
- `scripts/prepare-sites-dist.mjs`
- `README.md`
- `docs/vercel_free_readiness.md`

Implementation notes:
- `Verify current official Vercel docs before hard-coding Node/runtime/function settings.`
- `If docs cannot be checked, mark settings VERIFY_CURRENT_DOCS and continue only non-deployment-dependent local work.`
- `Make Vercel path use standard Next output.`
- `Make static/Codex post-build script conditional.`

Acceptance criteria:
- `Vercel-specific assumptions are either verified or marked VERIFY_CURRENT_DOCS.`
- `Static/Codex build path remains conditional.`
- `Local build passes.`

Tests:
- `Add config test only if repo already has config tests.`

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No production deployment.`
- `No production setting changes.`

Dependencies: T001, T002

Risk: Medium

Stop condition: Stop before merging deployment-specific config if current Vercel docs cannot be checked.
