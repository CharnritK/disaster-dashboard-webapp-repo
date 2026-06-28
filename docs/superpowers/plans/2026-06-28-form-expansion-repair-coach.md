# Session-Only Decision Repair And Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use
> `superpowers:subagent-driven-development` for multi-agent execution or
> `superpowers:executing-plans` for single-agent execution. Track checklist
> items task by task.

**Goal:** Implement the first safe slice of the form-intake expansion:
session-only Decision Repair Layer plus deterministic Next Best Action Coach.

**Single-run handoff:** For a launch prompt that runs the whole safe slice
without asking the user to execute each task manually, use
`plan/dashboard_copilot_codex_handoff_v1_1/goals/session_repair_coach_single_run_goal_2026-06-28.md`.

**Scope boundary:** Do not add persistence, SQL/RLS, DB adapter methods, registry
APIs, schema interpretation AI routes, connector sync, OCR/PDF, geocoding, fuzzy
matching runtime, production changes, provider/model changes, or public `/demo`
behavior changes in this goal.

**Architecture:** Reuse existing readiness, form detection, validation, and AI
fallback signals. Generate canonical repair actions in memory, rank them into
1-3 next best actions, and show protected-app guidance without weakening the
metadata-only privacy boundary.

## File Structure

- Create `types/repairAction.ts`: canonical session-only repair action and next
  best action types.
- Create `lib/repairActions.ts`: deterministic repair action generation.
- Create `lib/coach/nextBestAction.ts`: deterministic ranking over repair
  actions and workflow state.
- Modify `lib/coach/index.ts` only if needed to reuse the new ranking library.
- Modify `components/WorkflowComponents.tsx` only for protected-app repair
  cards and safer action copy.
- Update tests: `tests/repair-actions.test.ts`,
  `tests/next-best-action-coach.test.ts`, `tests/coach.test.ts`,
  `tests/formIntake.test.ts`, and `tests/privacy-no-row-persistence.test.ts`.

## Task 1: Repair Action Type Contract

**Files:**
- Create: `types/repairAction.ts`
- Test: `tests/repair-actions.test.ts`

- [ ] Write failing tests for canonical repair action shape.
- [ ] Cover `missing_evidence`, `ambiguous_mapping`, and `ai_fallback`.
- [ ] Assert every repair action has `whyItMatters`, `easiestFix`,
  `appCanHelpWith`, `humanMustReview`, `estimatedEffort`, and
  `safeAutomationLevel`.
- [ ] Assert serialized repair actions do not contain row-like, sample, prompt,
  response, file, token, or secret keys.
- [ ] Run `npm run test -- tests/repair-actions.test.ts` and confirm failure.
- [ ] Implement the minimal type contract and helpers.
- [ ] Run the targeted test again and confirm pass.

## Task 2: Deterministic Repair Action Generation

**Files:**
- Create: `lib/repairActions.ts`
- Test: `tests/repair-actions.test.ts`

- [ ] Write failing tests for missing evidence.
- [ ] Write failing tests for ambiguous mapping.
- [ ] Write failing tests for AI fallback or quota/auth denial.
- [ ] Implement deterministic repair action generation from existing readiness,
  evidence coverage, form metadata, validation, and fallback reason inputs.
- [ ] Keep generated text concise, review-oriented, and non-authoritative.
- [ ] Do not mutate datasets, prepared rows, or transformation logs.
- [ ] Run `npm run test -- tests/repair-actions.test.ts`.

## Task 3: Next Best Action Coach

**Files:**
- Create: `lib/coach/nextBestAction.ts`
- Modify: `lib/coach/index.ts` only if needed
- Test: `tests/next-best-action-coach.test.ts`
- Test: `tests/coach.test.ts`

- [ ] Write failing tests that blockers outrank review issues and generic tips.
- [ ] Write failing tests that output is capped at 1-3 actions.
- [ ] Write failing tests that app-assisted help is separated from human review.
- [ ] Implement deterministic ranking: blocker severity, current workflow step,
  low effort, then stable issue ordering.
- [ ] Preserve deterministic fallback behavior for existing coach tests.
- [ ] Run `npm run test -- tests/next-best-action-coach.test.ts tests/coach.test.ts`.

## Task 4: Protected Workflow UI Integration

**Files:**
- Modify: `components/WorkflowComponents.tsx`
- Possibly create: `components/FormRepairPanel.tsx`
- Test: `tests/formIntake.test.ts`
- Test: `tests/privacy-no-row-persistence.test.ts`

- [ ] Add or update static tests proving `/demo` remains sample-only and does
  not expose upload, AI, registry, or repair API behavior.
- [ ] Add tests proving client UI does not import server-only DB helpers.
- [ ] Render repair cards only inside protected workflow surfaces.
- [ ] Replace risky action copy such as unqualified "Proceed" with
  review-oriented labels, for example "Continue review", "Generate review
  dashboard", or "Prepare handoff".
- [ ] Keep cards compact: issue, severity, easiest fix, app can help, human
  review note.
- [ ] Run `npm run test -- tests/formIntake.test.ts tests/privacy-no-row-persistence.test.ts`.

## Task 5: Final Verification

- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] If UI changed, run a browser smoke:
  - `/demo` renders deterministic sample-only workflow;
  - `/demo` has no arbitrary upload control;
  - unauthenticated `/app/data` redirects to login;
  - repair guidance is not visible in public demo.

## Subagent Execution Model

Use one parent orchestrator and up to four bounded implementation workers:

- Agent A: type contract and repair action generation.
- Agent B: next-best-action ranking and existing coach compatibility.
- Agent C: protected UI and copy safety.
- Agent D: privacy/demo regression and verification.

Workers must not read `.env`, secrets, account pages, raw uploaded data,
production settings, billing/quota pages, external dashboards, or private
messages. Workers must not deploy, migrate, push, mutate production, change
provider/model config, or expand persistence.

## Stop Conditions

Stop and ask for approval before:

- adding SQL/RLS or metadata adapter persistence;
- adding `app/api/form-registry`, `app/api/form-mappings`, or
  `app/api/form-schema/interpret`;
- adding connector/OCR/geocoding/fuzzy runtime behavior;
- changing public `/demo` behavior;
- changing production environment, deployment, provider/model, quota, admin, or
  retention settings.

## Execution Choice

Ready for long-running local goal work after docs verification. Run the
single-run handoff goal rather than launching each task manually. Later registry
persistence and integration surfaces stay as separate approval-gated goals.
