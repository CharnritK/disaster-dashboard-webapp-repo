# ChatGPT GitHub Connector Review Reconciliation

Date: 2026-06-28

Raw review:
`plan/dashboard_copilot_codex_handoff_v1_1/redteam/chatgpt_desktop_github_connector_result_2026-06-28.md`

Status: checked against local repository evidence.

## Accepted Findings

1. Persisted form registry and reusable mappings conflict with the current
   active approval state.
   - Evidence: `docs/decisions_required.md` still blocks persisted
     form-family registry tables and reusable user mapping storage.
   - Evidence: `AGENTS.md`, `product_contract.md`, `db/schema.sql`, and
     `lib/db/metadataAdapter.ts` limit persistence to the existing approved
     metadata tables.

2. Existing dataset/profile/session objects are unsafe persistence inputs.
   - Evidence: `types/dataset.ts`, `lib/fileParsers.ts`, `lib/formIntake.ts`,
     `lib/profiling.ts`, and `lib/harmonization.ts` include `data`,
     `sampleRows`, `sampleValues`, `semanticNotes`, and input hints in workflow
     objects.
   - Conclusion: any future registry must use a dedicated persistence DTO.

3. The generic metadata sanitizer is insufficient for a form registry.
   - Evidence: `sanitizeSafeMetadata` in `lib/db/metadataAdapter.ts` validates
     key shape, scalar values, and string length, but does not reject sensitive
     semantic key classes.
   - Evidence: `sanitizeAiEventMetadata` in `lib/entitlement/index.ts` is
     stricter for prompt/row/sample/response keys.

4. `/api/coach` is not the right first base for the proposed Next Best Action
   Coach.
   - Evidence: `app/api/coach/route.ts` accepts a small generic JSON body,
     derives hints mostly from `step`, and does not use the shared
     `readJsonRequest` content-type/size/error pattern.
   - Conclusion: first-slice coach work should be deterministic library work,
     not API expansion.

5. Current handoff repair actions are not the proposed Decision Repair Layer.
   - Evidence: `types/copilot.ts` defines `HandoffRepairAction` as
     `title`, `rationale`, `priority`, and `ownerHint`.
   - Conclusion: create a separate canonical `RepairAction` model.

6. `/demo` is protected today but vulnerable to shared-component scope creep.
   - Evidence: `app/demo/page.tsx` passes `forceDeterministic`; shared
     `DashboardCopilotApp` derives `demoMode`, disables AI availability, and
     passes `onFiles={undefined}` plus `sampleOnly={demoMode}` to upload UI.
   - Conclusion: any registry/coach/API additions need explicit demo guards and
     tests.

7. Existing readiness logic is the best substrate for repair actions.
   - Evidence: `lib/decisionContext.ts` already models readiness status,
     missing evidence, ambiguous mappings, blockers, and review copy.
   - Conclusion: derive repair actions from readiness/evidence/quality outputs
     instead of inventing separate detection logic.

## Qualified Findings

1. Test coverage is broader locally than the connector saw.
   - Local `tests/` contains many files beyond `tests/formIntake.test.ts`,
     including DB, privacy, API governance, coach, templates, auth, usage, and
     admin tests.
   - The connector evidence gap should be treated as a connector limitation,
     not as proof that only one test file exists.

2. Some missing-test recommendations are still valid.
   - Existing tests cover important privacy boundaries, but not the proposed
     new registry DTO, new repair-action model, deterministic next-best-action
     ranking over repair actions, demo no-registry/no-coach-API behavior, or
     future registry route validators.

3. The review's recommended first slice is directionally correct but should be
   made slightly stricter.
   - First slice should be: deterministic Decision Repair Layer plus local
     deterministic Next Best Action guidance, with no persistence, no new API,
     no AI schema interpretation, no connector/OCR/geocoding/fuzzy runtime, and
     no `/demo` behavior change.

## Rejected Or Not Proven

1. The review cannot prove exhaustive test absence.
   - It explicitly says the connector did not provide recursive
     `tests/**/*.test.ts` enumeration.
   - Local enumeration contradicts any broad claim that test coverage is only
     `tests/formIntake.test.ts`.

2. The review's connector branch evidence is advisory only.
   - It reported the branch matched local HEAD `ef6f09c`; local git state should
     remain the source of truth before implementation or handoff.

## Recommended Roadmap Change

Adjust the roadmap before implementation:

1. Move persisted form registry and reusable mappings out of the first slice.
2. Make first slice deterministic and session-only:
   - `types/repairAction.ts`;
   - `lib/repairActions.ts`;
   - deterministic next-best-action ranking over sanitized repair actions;
   - protected UI cards/panel only;
   - copy change from `Proceed` to `Continue review` / `Generate review
     dashboard` / `Prepare handoff`.
3. Add tests for:
   - missing evidence repair actions;
   - ambiguous mapping repair actions;
   - copy-safety/no operational approval language;
   - coach ranking and one-to-three action limit;
   - `/demo` no upload/no AI/no registry/no coach API regression.
4. Keep registry persistence, AI schema interpretation, connector metadata,
   OCR/PDF, geocoding, and fuzzy matching as later approval-gated phases.

## Decision

Use the ChatGPT connector review as a valid challenger input, with the local
corrections above. Its strongest point is scope control: do not let the approved
form-intake expansion start with persistence or connector/OCR/geocoding/fuzzy
surfaces. The safest implementation entry point is deterministic repair and
next-action guidance over existing readiness outputs.
