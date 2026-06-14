# Roadmap v1.1

Status as of 2026-06-14: phases 0-12 are implemented for local/reviewable
controlled-beta paths, and staging Supabase-backed magic-link login is
user-confirmed. Treat this roadmap as the execution history and validation map.
Production deployment, production migrations, added allowlists, anonymous AI,
and retention automation remain blocked.

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

## Milestone checkpoint

The T010 checkpoint was reached and then satisfied by explicit approval before
T011+ continuation. Future work must still stop before production deployment,
production migrations, production environment mutation, added allowlist entries,
anonymous AI, or retention automation unless separately approved.
