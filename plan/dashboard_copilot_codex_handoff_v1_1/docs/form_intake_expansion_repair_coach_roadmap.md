# Form Intake Expansion, Repair Layer, And Coach Roadmap

Date: 2026-06-28

Status: approved for local/staging-safe planning and implementation. Phase 15,
Phase 16, and the safe protected-UI portion of Phase 17 were implemented locally
on 2026-06-28 in commit `1a3f4fe`. Phases 18-24 were implemented locally on
2026-06-28 as metadata-only controlled-beta surfaces. Production deployment,
production migrations, production environment changes, provider/model changes,
open signup, anonymous AI, public demo upload, credential storage, raw-data
persistence, and retention automation remain blocked unless separately
approved.

## Real Problem

The app currently detects form metadata and readiness gaps, but detection alone
does not help a responder move forward. The next product step is not more
flags. It is guided repair: the app should explain the issue, show the lowest
effort fix, offer safe app-assisted actions, and preserve the caveat for
handoff.

The coach must become contextual decision support. It should rank next actions
from the current workflow and repair state, not display generic tips.

## Strategic Outcome

Build a **Decision Repair Layer** over the existing form-aware workflow.

First executable slice:

1. Generate structured repair actions for meaningful warning or blocker states.
2. Make the coach consume repair actions and produce next best actions.
3. Integrate protected-app UI copy and cards without changing `/demo`.
4. Add tests proving privacy, demo isolation, and action ranking.

Implementation checkpoint:

- `types/repairAction.ts`;
- `lib/repairActions.ts`;
- `lib/coach/nextBestAction.ts`;
- protected workflow integration in `components/DashboardCopilotApp.tsx` and
  `components/WorkflowComponents.tsx`;
- tests in `tests/repair-actions.test.ts`,
  `tests/next-best-action-coach.test.ts`, `tests/coach.test.ts`,
  `tests/formIntake.test.ts`, and `tests/privacy-no-row-persistence.test.ts`.

Later approval-gated expansion:

1. Persist metadata-only form registry and reusable mapping records.
2. Add local/staging-safe integration surfaces for AI schema interpretation,
   connector metadata, PDF/OCR metadata, geocoding metadata, and fuzzy matching
   review candidates.
3. Keep raw response data, uploaded files, prepared rows, prompts, model
   responses, exports, credentials, and production state out of scope.

## Phase 15 - Session-Only Repair Foundation

Implementation status: complete locally on 2026-06-28.

Objective: add typed repair action contracts and deterministic generation over
existing readiness, form detection, quality, and AI fallback signals.

Acceptance:

- no new persistence tables, schema, RLS, migrations, or DB adapter methods;
- no new public route or new AI/provider path;
- `RepairAction` is separate from existing copilot handoff actions;
- every missing-evidence and ambiguous-mapping blocker has an `easiestFix`;
- every action states `whyItMatters`, app-assisted help, and human review;
- generated actions contain no raw rows, sample values, uploaded files, prompts,
  model responses, or operational secrets;
- tests cover missing evidence, ambiguous mapping, AI fallback, copy safety, and
  privacy boundaries.

## Phase 16 - Next Best Action Coach

Implementation status: complete locally on 2026-06-28.

Objective: replace generic coach hints with contextual triage over repair
actions.

Coach inputs:

- current workflow step;
- readiness result;
- evidence coverage;
- form detection metadata;
- repair actions;
- AI mode/fallback reason;
- quota/auth state;
- export readiness.

Coach modes:

- triage;
- repair;
- explain;
- proceed;
- handoff.

Acceptance:

- deterministic coach ranks 1-3 next actions;
- blockers rank above review issues and generic tips;
- coach explains lowest-effort path and what can be skipped;
- coach separates app-assisted steps from human review;
- AI augmentation remains optional and cannot override deterministic readiness;
- existing `/api/coach` is not expanded in this slice unless tests prove the
  library behavior first.

## Phase 17 - Protected UI Integration

Implementation status: safe protected-workflow portion complete locally on
2026-06-28. Public demo behavior remains unchanged.

Objective: extend the protected workflow with repair cards and coach-ranked next
actions.

Acceptance:

- public `/demo` remains deterministic, sample-only, and unchanged;
- no arbitrary upload appears in `/demo`;
- repair cards are visible only inside protected app workflow surfaces;
- UI copy avoids operational approval language such as unqualified "proceed";
- suggested copy uses review-oriented labels such as "Continue review",
  "Generate review dashboard", and "Prepare handoff";
- export/handoff records caveats and repair status without raw data.

## Phase 18 - Metadata Registry Foundation

Implementation status: complete locally on 2026-06-28.

Objective: add typed metadata contracts and draft persistence surfaces for form
families, form versions, and reusable mappings only after separate persistence
approval.

Gate:

- do not implement this phase until persistence expansion has explicit approval
  in the active decision docs;
- approval must name the metadata tables, local/staging migration target,
  adapter/API boundary, and test gates;
- production migration, production deployment, production environment mutation,
  raw row/file persistence, prompt/model-response persistence, and public demo
  upload remain out of scope.

Acceptance:

- schema/RLS drafts define only approved metadata tables;
- adapter allowlist includes only approved metadata surfaces;
- validators reject row-like keys, sample values, pasted rows, and full schema
  payloads with values;
- in-memory adapter supports create/list/read flows;
- Supabase adapter methods are typed but no production migration runs;
- privacy tests fail if raw rows/files/prompts/response-like values are
  accepted.

Tables:

- `form_registries`;
- `form_registry_versions`;
- `reusable_mappings`.

## Phase 19 - Additional Repair Sources

Implementation status: complete locally on 2026-06-28.

Objective: extend repair action sources after Phase 15 is tested.

Repair action types:

- missing evidence;
- ambiguous mapping;
- weak form detection;
- connector sync issue;
- OCR/PDF confidence issue;
- geocoding uncertainty;
- fuzzy match conflict;
- AI fallback or quota/auth issue.

Acceptance:

- every review/blocker state has an `easiestFix`;
- every repair action has an operational `whyItMatters`;
- app-assisted actions are explicit and bounded;
- human review responsibilities are explicit;
- fuzzy/geocoding/OCR actions never auto-mutate data;
- repair actions are available to the coach and export handoff.

## Phase 20 - AI Schema Interpretation

Implementation status: complete locally on 2026-06-28. The route is governed,
schema-only, deterministic-first, and uses existing provider/model defaults.

Objective: add a dedicated governed route for schema-only interpretation.

Rules:

- use a new task type and prompt version;
- send minimized schema metadata only;
- build deterministic fallback first;
- authenticate before AI use;
- check entitlement and quota;
- preflight provider config before reserve;
- reserve quota immediately before provider attempt;
- store safe AI event metadata only;
- sanitize model output before returning it;
- do not persist model response bodies.

Acceptance:

- missing auth returns deterministic fallback;
- disabled AI returns deterministic fallback without quota reserve;
- unsupported provider/missing key do not reserve quota;
- provider attempt reserves quota and records safe event metadata;
- output sanitizer rejects row-like values and operational claims.

## Phase 21 - Connector Metadata And Live Sync Surface

Implementation status: complete locally on 2026-06-28 as metadata-only source
status validation. Credential storage, token handling, background jobs, and
persisted response rows were not implemented.

Objective: support KoBo/ODK/Google Forms as metadata-first sources.

Rules:

- no credential storage in this pass;
- no background sync jobs;
- no persisted synced rows;
- no token handling in client modules;
- connector references use opaque ids or hashes;
- imported response rows, if any, remain session-only.

Acceptance:

- connector metadata validators accept schema/status metadata only;
- sync runs persist counts/status/caveats only;
- unsafe connector payloads are rejected;
- UI describes connector sync as review-only and session-bound.

## Phase 22 - PDF/OCR And Geocoding Metadata

Implementation status: complete locally on 2026-06-28 as review-only metadata
contracts and validators.

Objective: represent OCR and geocoding as review-only assistance.

Rules:

- OCR stores metadata only: page count, field candidates, confidence buckets,
  caveats;
- no PDFs, screenshots, OCR text, images, or extracted rows are persisted;
- geocoding stores metadata only: provider/config version, match counts,
  precision buckets, caveats;
- no row-level coordinates, addresses, or place names are persisted.

Acceptance:

- validators reject full OCR text and geocoded result rows;
- repair actions describe confidence issues and review needs;
- no chart/map behavior assumes geocoding has authoritative output.

## Phase 23 - Fuzzy Matching Review Candidates

Implementation status: complete locally on 2026-06-28 as deterministic
session-only review candidates. It is not a cleaning transform.

Objective: add deterministic fuzzy matching as a review aid.

Rules:

- fuzzy matching is not a cleaning transform;
- candidate matches are suggestions only;
- no automatic row deletion, deduplication, recoding, or merge;
- confidence and rationale must be visible.

Acceptance:

- exact match, near match, conflict, and no-match cases are tested;
- repair actions explain what to accept/reject;
- user-reviewed decisions remain session-only unless saved as reusable mapping
  metadata.

## Phase 24 - Staging Validation

Implementation status: local validation complete on 2026-06-28. Authenticated
staging write smoke still requires a clicked magic-link session and configured
staging credentials.

Objective: validate local/staging-safe behavior without production action.

Checks:

- `npm run lint`;
- `npm run test`;
- `npm run build`;
- `git diff --check`;
- browser smoke on `/demo` and unauthenticated `/app/data` redirect;
- authenticated staging smoke when magic-link session is available;
- safe metadata-only write smoke for registry and mapping records only after
  registry persistence is approved and implemented;
- admin aggregate-only check if admin metrics are expanded.

## Explicit Non-Goals

- production deployment;
- production migrations;
- production environment mutation;
- provider/model change;
- open signup;
- anonymous AI;
- public demo arbitrary upload;
- saved projects or raw dataset persistence;
- scheduled/background sync;
- retention automation;
- operational command authority claims.

## Next Safe Task

Phases 15-24 are complete locally. The next safe continuation is review and
commit/publish workflow, followed by credential-dependent staging validation
only when a clicked magic-link session and staging credentials are available.

Before any later work, keep these approval gates explicit:

1. no production migration or production deployment without separate approval;
2. no credential storage, connector tokens, background sync jobs, or retention
   automation without separate approval;
3. no public `/demo` upload, anonymous AI, open signup, or provider/model/quota
   change without separate approval;
4. no persistence of uploaded rows, prepared rows, raw files, exports, full
   prompts, model responses, OCR text, addresses, coordinates, place names, or
   row-like payloads.
