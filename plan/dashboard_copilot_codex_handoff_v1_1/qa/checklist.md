# QA Checklist

Status note: this checklist is a reusable template for future PRs and staging
passes. It is not the current completion record. Current state lives in
`qa/final_goal_status.md`, `qa/supabase_staging_project_check_2026-06-14.md`,
and `qa/document_consistency_audit_2026-06-14.md`.

## Pre-implementation

- [ ] Confirm current branch.
- [ ] Confirm clean working tree.
- [ ] Inspect repo file structure.
- [ ] Run baseline lint/test/build.
- [ ] Verify current Vercel Node support.
- [ ] Verify current Hobby function limits.
- [ ] Confirm approval block.
- [ ] Confirm no credentials are needed.

## Per PR

- [ ] PR is small.
- [ ] Scope matches one task or phase.
- [ ] `npm run lint` output captured.
- [ ] `npm run test` output captured.
- [ ] `npm run build` output captured.
- [ ] Tests added for new behavior.
- [ ] Deterministic fallback still works.
- [ ] No uploaded rows are persisted.
- [ ] No provider keys are exposed.
- [ ] Review gate owner is named.

## Pre-deploy preview

- [ ] AI disabled by default.
- [ ] Env vars configured safely.
- [ ] Status endpoint is safe.
- [ ] Demo works without login.
- [ ] App route requires login.
- [ ] Quota fallback works.
- [ ] Missing API key fallback works.
- [ ] Feedback writes metadata only.
- [ ] Template save writes metadata only.
- [ ] Logs do not show secrets or rows.

## Post-deploy preview

- [ ] Monitor function errors.
- [ ] Verify usage rows.
- [ ] Verify event metadata.
- [ ] Verify feedback rows.
- [ ] Verify no dataset rows in DB.
- [ ] Run mobile check.
- [ ] Document unresolved risks.

## Production

Codex must not perform production deployment.

A human deployment owner must approve:

- production env values
- production migrations
- production smoke test timing
- rollback plan
