# Roadmap v1.1

Status as of 2026-06-21: phases 0-14 are implemented for local/reviewable
controlled-beta paths. Staging Supabase-backed magic-link login was previously
user-confirmed, but authenticated staging smoke still needs a clicked magic-link
session. See `qa/t031_staging_beta_validation_2026-06-14.md` for staging status
and `qa/product_standout_local_validation_2026-06-21.md` for the latest local
phase 13/14 validation. Treat this roadmap as the execution history and
validation map. Production deployment, production migrations, added allowlists,
anonymous AI, and retention automation remain blocked.

## Phase 0 — Baseline and Vercel compatibility

Objective: Establish command baseline and remove deterministic deployment blockers.

Acceptance: `npm run lint`, `npm run test`, and `npm run build` outputs are reported; env defaults are deterministic-safe; Vercel deployment assumptions are verified or marked `VERIFY_CURRENT_DOCS`.

## Phase 1 — Product contract and decision records

Objective: Make the controlled authenticated AI beta contract explicit.

Acceptance: README/docs include persistence boundary, AI governance, deployment boundary, auth provider decision record, and persistence provider decision record.

## Phase 2 — Entitlement service interface first

Objective: Build quota logic with in-memory adapter before provider integration.

Acceptance: Asia/Bangkok bucketing, quota checks, typed deny reasons, and reserve methods have tests.

## Phase 3 — Route gating with auth abstraction/test identity

Objective: Gate `/api/recommend` and `/api/copilot` without requiring real provider auth yet.

Acceptance: deterministic fallback survives unauthenticated, over-quota, missing-key, invalid-body, and provider-failure scenarios.

## Phase 4 — Supabase Auth after approval

Objective: Add real auth only after explicit approval.

Acceptance: Supabase Auth maps to app profiles; `/demo` remains public; `/app/**` is protected; no custom password storage.

## Phase 5 — Supabase Postgres after approval

Objective: Add metadata-only persistence and RLS.

Acceptance: schema and RLS drafts exist; server-only DB client exists; service-role key never enters client; no production migration runs.

## Phase 6 — Atomic usage ledger

Objective: Persist provider-attempt usage and safe events.

Acceptance: usage is reserved before provider call; denied deterministic fallback does not increment; events record `attempted_provider_call`, `succeeded`, model, provider, and prompt version.

## Phase 7 — Usage UI

Objective: Show daily quota state in the authenticated app.

Acceptance: UI displays `used / limit`, quota fallback copy, and does not expose AI usage meter in public demo except CTA-only.

## Phase 8 — Feedback and eval capture

Objective: Capture thumbs, tags, comments, and safe metadata.

Acceptance: feedback validates allowed tags server-side; comments are length-limited; no row data accepted.

## Phase 9 — Template Builder

Objective: Create user custom templates and reviewed template architecture.

Acceptance: users can create private draft templates; reviewed templates are read-only; AI cannot certify safety.

## Phase 10 — Route split and workspace IA

Objective: Split the monolithic workflow into operational pages.

Acceptance: workflow behavior is preserved; uploads stay session-only; mobile uses tabs or bottom sheets.

## Phase 11 — AI coach and internal eval dashboard

Objective: Add deterministic coach first, then quota-aware AI augmentation and metadata-only admin reporting.

Acceptance: deterministic readiness remains authoritative; AI coach is gated; admin dashboard shows metadata only.

## Phase 12 — Vercel hardening

Objective: Add deployment docs and smoke checks without production deployment.

Acceptance: status endpoint is safe; AI disabled by default; fallback works without provider key; no uploaded rows are written to DB.

## Phase 13 — Form-aware disaster intake

Objective: Add deterministic, session-only recognition of structured disaster
management form exports and schemas so familiar responder inputs can map into
existing evidence coverage, decision readiness, dashboards, and handoff
artifacts.

Acceptance: in-scope structured inputs such as HXL-tagged tables, 3W/5W-style
operational presence exports, and XLSForm-like schemas are detected with
confidence, caveats, and review status; form-derived mappings can support the
existing evidence taxonomy without bypassing deterministic readiness; handoff
exports include safe form mapping metadata; no raw form responses, uploaded
files, prepared rows, full prompts, model responses, or exports are persisted;
`/demo` remains deterministic sample-only; implementation gates run
`npm run lint`, `npm run test`, `npm run build`, and `git diff --check`.

Planning artifacts:

- `plan/dashboard_copilot_codex_handoff_v1_1/docs/form_aware_disaster_intake_roadmap.md`
- `../../../docs/superpowers/plans/2026-06-21-form-aware-disaster-intake.md`
- `../../../docs/agent-playbooks/form-aware-disaster-intake-overnight.md`

## Phase 14 — Decision assurance product-standout layer

Objective: package the controlled-beta workflow around reviewable decision
assurance rather than generic dashboard generation.

Local implementation scope:

- Evidence Readiness Control Tower derived from deterministic evidence
  coverage and readiness outputs.
- Handoff Dossier v2 export fields for decision owner, reviewer, accepted
  caveats, unresolved blockers, source register, transformation lineage, AI
  mode/fallback reason, and review-by date.
- Decision Playbooks layered over the reviewed decision templates.
- AI Guardrail Explainer showing advisory AI status, fallback reason,
  deterministic acceptance/rejection, unsupported suggestions, and validation
  caveats.
- Protected AI trial route as an internal, authenticated, sample-only
  provider-path smoke surface. It remains under `/app/**`, uses bundled
  synthetic data, and does not change public demo behavior.
- Safe Beta Learning Loop helper that produces approved metadata-only signals
  from use case, readiness status, blocker counts, ambiguous/missing evidence,
  fallback reason, export type, approved feedback tags, and selected playbook.
- Form-aware disaster intake as the first deterministic, session-only intake
  slice for HXL, 3W/5W-style exports, and XLSForm-like schema metadata.

Acceptance: all six pillars remain local/session-scoped or export-only unless
already covered by approved metadata tables; deterministic readiness remains
authoritative; `/demo` remains deterministic sample-only; no new persistence,
provider/model/SDK/quota/admin, migration, deployment, retention, OCR/PDF,
geocoding, fuzzy matching, row deletion, imputation, or live sync behavior is
introduced; `npm run lint`, `npm run test`, `npm run build`, and
`git diff --check` pass before completion is claimed.

## Milestone checkpoint

The T010 checkpoint was reached and then satisfied by explicit approval before
T011+ continuation. Future work must still stop before production deployment,
production migrations, production environment mutation, added allowlist entries,
anonymous AI, or retention automation unless separately approved.
