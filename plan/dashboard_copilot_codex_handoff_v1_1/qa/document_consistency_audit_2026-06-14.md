# Document Consistency Audit

Date: 2026-06-14

Verdict: `CURRENT_DOCS_UPDATED_WITH_T031_PARTIAL_EVIDENCE`

## Current Truth

- T011-T030 are implemented for local/reviewable controlled-beta paths.
- The workaround for Supabase preview branching is a separate staging Supabase
  project, not a billed Supabase preview branch.
- Staging schema/RLS was applied only to the staging project.
- Branch-scoped Vercel Preview env values point to staging Supabase.
- The approved beta/admin email previously completed magic-link login in the
  staging-backed Vercel Preview. Current `POST /auth/signin` can return
  `sent=1`, and local code maps OTP resend cooldown to `auth_rate_limited`
  after preview redeploy.
- Current T031 evidence verifies public and unauthenticated staging behavior,
  but authenticated route rendering, metadata write smoke, admin aggregate
  runtime smoke, and direct staging DB row checks remain pending until a clicked
  magic-link session is available.
- Production deployment, production environment variables, production Supabase
  configuration, production migrations, added allowlist entries, anonymous AI,
  provider-backed AI enablement, and retention automation remain blocked.

## Documents Reconciled

- Root README now points to the active controlled-beta handoff and records the
  partial T031 staging validation state.
- `AGENTS.md`, `docs/README.md`, `docs/release-readiness.md`,
  `docs/deployment-smoke-tests.md`, `docs/vercel_free_readiness.md`,
  `docs/digital-public-good-guide.md`, and `docs/showcase-script.md` now
  separate public demo behavior, authenticated beta behavior, metadata-only
  persistence, and production readiness.
- Auth and persistence decision records now say the default providers are
  implemented for staging preview while production remains gated.
- Active handoff README, index, architecture, Vercel readiness, limitations,
  roadmap, prompt-version guidance, challenger closeout, backlog, manifest, and
  QA checklist distinguish historical task-plan language from current QA
  evidence.
- `qa/t031_staging_beta_validation_2026-06-14.md` now records current T031
  route/API, auth blocker, metadata boundary, and production-isolation
  evidence.
- The earlier root `qa/supabase_vercel_preview_check_2026-06-14.md` is marked
  superseded for current staging state and points to the staging evidence file.
- Spec Kit decision-context files now state that their T001-T030 IDs are
  spec-local and historical, not the controlled-beta handoff task IDs.

## Historical Documents

The backlog, task cards, archived handoff packs, and original prompt files are
left as historical execution-plan artifacts. They may contain stop conditions
or implementation instructions that were true when written. Use
`qa/final_goal_status.md`, the staging evidence files, and this audit file for
current state before continuing T031 staging beta validation.

## Remaining Documentation Boundary

No production launch claim is made. T031 should still verify authenticated
metadata persistence and admin aggregate behavior in staging before any
production decision.
