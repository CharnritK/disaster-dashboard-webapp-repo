# Form Expansion Repair Coach Agent Playbook

Date: 2026-06-28

Use this playbook only after the product owner approves local/staging-safe
implementation. The parent Codex thread owns scope, edits, verification, and
final synthesis.

## Global Boundaries

Allowed:

- local code edits;
- tests;
- SQL/RLS draft edits;
- metadata-only adapter methods;
- protected app UI changes;
- local browser smoke with sample/synthetic data.

Forbidden:

- production deployment;
- production migrations;
- production environment mutation;
- provider/model changes;
- open signup;
- anonymous AI;
- public demo upload changes;
- `.env` or secret inspection;
- account, billing, quota, payment, or subscription pages;
- raw disaster data, uploaded rows, prepared rows, exports, full prompts, model
  responses, connector rows, OCR text, PDFs, screenshots, geocoded result rows.

## Agent A - Registry Contract

Role: worker

Objective: implement typed metadata contracts and validators.

Owned files:

- `types/formRegistry.ts`
- `lib/formRegistry/validation.ts`
- `tests/form-registry.test.ts`

Stop if:

- validator needs row values or sample values;
- scope drifts into API routes or DB adapter.

Return:

- changed files;
- red/green test commands;
- validator guarantees;
- residual risks.

## Agent B - Metadata Persistence Boundary

Role: worker

Objective: add SQL/RLS drafts and adapter support for approved metadata tables.

Owned files:

- `db/schema.sql`
- `db/rls.sql`
- `db/verify_metadata_preview.sql`
- `lib/db/metadataAdapter.ts`
- `tests/db-schema-boundary.test.ts`
- `tests/db-adapter.test.ts`
- `tests/privacy-no-row-persistence.test.ts`

Stop if:

- implementation requires production migration;
- table design needs raw rows, files, OCR text, coordinates, prompts, or
  connector records.

Return:

- table list;
- RLS/grant summary;
- adapter methods;
- test results.

## Agent C - Repair Actions And Fuzzy Matching

Role: worker

Objective: convert issues into repair actions and add review-only fuzzy
candidate matching.

Owned files:

- `lib/formRegistry/repairActions.ts`
- `lib/formRegistry/fuzzy.ts`
- `tests/repair-actions.test.ts`
- `tests/form-fuzzy.test.ts`

Stop if:

- fuzzy matching mutates rows;
- repair text implies operational approval;
- any auto-fix bypasses review.

Return:

- issue types covered;
- sample repair action summaries;
- tests run.

## Agent D - Coach And Protected UI

Role: worker

Objective: integrate repair actions into deterministic coach ranking and
protected app UI.

Owned files:

- `lib/coach/nextBestAction.ts`
- `lib/coach/index.ts`
- `components/WorkflowComponents.tsx`
- optional `components/FormRepairPanel.tsx`
- `tests/next-best-action-coach.test.ts`
- `tests/coach.test.ts`
- `tests/formIntake.test.ts`

Stop if:

- UI change affects `/demo` upload behavior;
- coach becomes generic or authoritative;
- client code imports server-only DB helpers.

Return:

- coach modes implemented;
- protected UI summary;
- tests run.

## Agent E - AI Schema Interpretation

Role: worker

Objective: add governed schema-only AI interpretation route.

Owned files:

- `app/api/form-schema/interpret/route.ts`
- `types/recommendations.ts`
- `lib/ai/promptVersions.ts`
- `lib/serverConfig.ts`
- `lib/llmClient.ts`
- `tests/form-schema-ai-api.test.ts`
- relevant SQL route-check updates

Stop if:

- raw rows or sample values are needed;
- provider/model change is requested;
- prompt or model response persistence is suggested.

Return:

- task type and prompt version;
- payload minimization summary;
- fallback/quota behavior;
- test results.

## Agent F - Challenger Review

Role: default or architecture-expert, read-only

Objective: red-team the completed diff before final claims.

Inspect:

- git diff;
- tests added;
- schema/RLS drafts;
- adapter allowlist;
- API route governance;
- client/server import boundaries;
- coach copy and repair action wording.

Return:

- findings ordered by severity;
- evidence with file references;
- false positives rejected;
- required fixes before closeout.

## Parent Integration Rules

The parent must:

- launch at most 2-3 workers at once unless write scopes are disjoint;
- review each worker diff before continuing;
- run targeted tests after each merge;
- run full `npm run lint`, `npm run test`, `npm run build`, and
  `git diff --check` before completion claims;
- document unverified staging or credential-dependent behavior separately.
