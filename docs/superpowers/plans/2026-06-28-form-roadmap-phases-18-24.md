# Form Roadmap Phases 18-24 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the approved local/staging-safe form roadmap after the session-only repair coach slice without expanding raw-data persistence or production state.

**Architecture:** Add typed metadata-only form registry, mapping, schema interpretation, connector, OCR/geocoding, and fuzzy-review contracts. Keep deterministic fallbacks and validators authoritative; adapters may persist only approved metadata tables, while uploaded rows/files, prompts, model responses, and extracted values remain session-only or rejected.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest, Supabase schema/RLS draft files, existing metadata adapter boundary.

**Status:** Completed locally on 2026-06-28. Production deployment, production
migrations, production environment changes, public demo upload, open signup,
retention automation, credential storage, and raw-data persistence were not
performed.

---

### Task 1: Phase 18 Metadata Registry Foundation

Status: complete locally.

**Files:**
- Create: `types/formRegistry.ts`
- Create: `lib/formRegistry/index.ts`
- Modify: `lib/db/metadataAdapter.ts`
- Modify: `db/schema.sql`
- Modify: `db/rls.sql`
- Create: `app/api/form-registries/route.ts`
- Create: `app/api/form-registries/[id]/route.ts`
- Create: `tests/form-registry.test.ts`
- Modify: `tests/db-adapter.test.ts`
- Modify: `tests/db-schema-boundary.test.ts`
- Modify: `tests/privacy-no-row-persistence.test.ts`

- [ ] Add metadata-only registry/version/reusable mapping types.
- [ ] Add strict parser and sanitizer that rejects row-like keys, sample values, files, prompts, model responses, nested raw data, and unsafe text.
- [ ] Extend in-memory and Supabase metadata adapter methods for create/list/read flows.
- [ ] Add protected API routes for list/create/read registry metadata.
- [ ] Add schema/RLS drafts for `form_registries`, `form_registry_versions`, and `reusable_mappings`; keep production execution out of scope.
- [ ] Add tests for valid metadata, unsafe payload rejection, ownership, table allowlist, and DB draft alignment.

### Task 2: Phase 20 Schema-Only AI Interpretation

Status: complete locally.

**Files:**
- Create: `lib/formSchemaInterpretation.ts`
- Create: `app/api/form-schema/interpret/route.ts`
- Modify: `types/recommendations.ts`
- Modify: `lib/ai/promptVersions.ts`
- Modify: `lib/serverConfig.ts`
- Modify: `lib/db/metadataAdapter.ts`
- Modify: `db/schema.sql`
- Modify: `tests/coach-api.test.ts` or create `tests/form-schema-interpretation-api.test.ts`
- Modify: `tests/api-ai-governance.test.ts`

- [ ] Add a new `form_schema_interpretation` task type and prompt version.
- [ ] Add deterministic schema interpretation fallback that operates on field names/types/labels only.
- [ ] Add protected quota-gated API route that sends minimized schema metadata only.
- [ ] Record safe AI event metadata only; do not persist prompt body or model response body.
- [ ] Reject sample values, rows, files, OCR text, geocoded values, and operational claims in request and response sanitizers.
- [ ] Add tests for unauthenticated, AI disabled, missing key, quota, provider success, invalid model response, and unsafe payloads.

### Task 3: Phase 19 Additional Repair Sources

Status: complete locally.

**Files:**
- Modify: `types/repairAction.ts`
- Modify: `lib/repairActions.ts`
- Create: `tests/repair-actions-extended.test.ts`

- [ ] Add repair issue types for weak form detection, connector sync, OCR/PDF confidence, geocoding uncertainty, and fuzzy match conflict.
- [ ] Add builders that convert metadata-only review states into next repair actions.
- [ ] Ensure every action includes easiest fix, why it matters, app help, human review, effort, and safe automation level.
- [ ] Add tests proving no raw values, no automatic mutation, stable ranking, and copy safety.

### Task 4: Phase 23 Fuzzy Matching Review Candidates

Status: complete locally.

**Files:**
- Create: `types/fuzzyReview.ts`
- Create: `lib/fuzzyReview.ts`
- Modify: `lib/repairActions.ts`
- Create: `tests/fuzzy-review.test.ts`

- [ ] Add deterministic candidate matching over labels/field names only.
- [ ] Classify exact, near, conflict, and no-match outcomes.
- [ ] Keep candidates suggestion-only; no cleaning transform, dedupe, merge, recode, deletion, or row mutation.
- [ ] Add tests for exact, near, conflict, no-match, and row-like payload rejection.

### Task 5: Phase 21 Connector Metadata Surface

Status: complete locally.

**Files:**
- Create: `types/connectorMetadata.ts`
- Create: `lib/connectorMetadata.ts`
- Modify: `lib/repairActions.ts`
- Create: `tests/connector-metadata.test.ts`

- [ ] Add KoBo/ODK/Google Forms connector metadata contracts using opaque references only.
- [ ] Add validators for status/count/caveat metadata.
- [ ] Reject credentials, tokens, URLs with secrets, response rows, form submissions, and background sync directives.
- [ ] Add repair actions for sync stale/error/review-needed states.
- [ ] Add tests for safe metadata and unsafe payload rejection.

### Task 6: Phase 22 OCR/Geocoding Metadata

Status: complete locally.

**Files:**
- Create: `types/extractionMetadata.ts`
- Create: `lib/extractionMetadata.ts`
- Modify: `lib/repairActions.ts`
- Create: `tests/extraction-metadata.test.ts`

- [ ] Add OCR/PDF metadata contracts: page count, field candidate count, confidence buckets, caveats only.
- [ ] Add geocoding metadata contracts: provider/config version, match counts, precision buckets, caveats only.
- [ ] Reject PDFs, images, screenshots, OCR text, addresses, place names, coordinates, and extracted rows.
- [ ] Add repair actions for low confidence and review-needed states.
- [ ] Add tests for safe metadata and unsafe payload rejection.

### Task 7: Phase 24 Staging Validation And Handoff

Status: local validation complete. Credential-dependent authenticated staging
smoke remains unavailable without a clicked magic-link session.

**Files:**
- Modify: `plan/dashboard_copilot_codex_handoff_v1_1/docs/form_intake_expansion_repair_coach_roadmap.md`
- Modify: `plan/dashboard_copilot_codex_handoff_v1_1/qa/final_goal_status.md`

- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] Run browser smoke on `/demo` and unauthenticated `/app/data` when practical.
- [ ] Update status docs with implemented phases, verification evidence, credential-dependent gaps, and production non-actions.
