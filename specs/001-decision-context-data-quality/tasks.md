# Tasks: Decision-Context Data Quality

> Historical/non-authoritative task ledger: this predates the current `/api/copilot` handoff route, task-specific LLM model variables, and current handoff privacy boundaries. Use `AGENTS.md`, `README.md`, and `docs/AI_MODE.md` for current implementation guidance.

> Historical task ledger: this records the implementation and validation checklist for the decision-context feature package. It is not the current setup guide. For current project behavior, start with `docs/README.md`, `README.md`, and `AGENTS.md`.

**Input**: Design documents from `specs/001-decision-context-data-quality/`

**Prerequisites**: `plan.md`, `spec.md`

**Tests**: Required. Follow TDD: write each listed test first, run it, confirm it fails for the expected reason, then implement the matching production task.

**Organization**: Tasks are grouped by independently testable user story.

## Phase 1: Setup and Guardrails

**Purpose**: Preserve scope and establish TDD checkpoints.

- [x] T001 Confirm current working tree and note pre-existing untracked governance files with `git status --short --branch`
- [x] T002 [P] Verify no package-manager or dependency changes are needed in `package.json` and `package-lock.json`
- [x] T003 [P] Confirm `.specify/extensions.yml` has no `before_tasks`, `after_tasks`, `before_implement`, or `after_implement` hooks requiring execution

---

## Phase 2: Foundational Types and Test Harness

**Purpose**: Shared contracts needed by all stories.

- [x] T004 [P] Add failing decision-context sanitization test in `tests/dataPipeline.test.ts`
- [x] T005 [P] Add failing deterministic readiness test for missing response-prioritization evidence in `tests/dataPipeline.test.ts`
- [x] T006 [P] Add failing dashboard caveat propagation test in `tests/dataPipeline.test.ts`
- [x] T007 Run `npm run test -- tests/dataPipeline.test.ts` and record the expected RED failures
- [x] T008 Add `DecisionBrief`, `UseCaseTemplate`, and `DecisionReadinessResult` contracts in `types/decision.ts`
- [x] T009 Extend `QualityCheckResult` decision metadata in `types/quality.ts`
- [x] T010 Extend `WorkflowContext` with optional sanitized `decisionContext` in `types/recommendations.ts`

**Checkpoint**: Tests exist and fail before production behavior is implemented.

---

## Phase 3: User Story 1 - Capture Decision Context First (Priority: P1) MVP

**Goal**: A response analyst completes a response-prioritization decision brief before data workflow actions can progress.

**Independent Test**: Required brief fields gate recommendation flow and sanitized decision context reaches request parsing.

### Tests for User Story 1

- [x] T011 [US1] Keep the decision-context sanitization test failing until `parseWorkflowContext` returns truncated `decisionContext`
- [x] T012 [US1] Add failing UI-adjacent pure validation test for missing decision brief fields in `tests/dataPipeline.test.ts`

### Implementation for User Story 1

- [x] T013 [US1] Implement response-prioritization template defaults and brief validation in `lib/decisionContext.ts`
- [x] T014 [US1] Parse and sanitize `decisionContext` in `lib/recommendationSchema.ts`
- [x] T015 [US1] Include sanitized decision context in `buildRecommendationRequestBody` in `lib/llmClient.ts`
- [x] T016 [US1] Add `DecisionBriefStep` and missing-field guidance in `components/WorkflowComponents.tsx`
- [x] T017 [US1] Add `brief` workflow step and gate upload/profile/recommend navigation in `lib/config.ts` and `app/page.tsx`
- [x] T018 [US1] Run `npm run test -- tests/dataPipeline.test.ts` and confirm US1 tests pass

**Checkpoint**: Decision context is collected and minimized before data recommendations.

---

## Phase 4: User Story 2 - Assess Decision Readiness (Priority: P1)

**Goal**: Deterministic checks classify data as `ready`, `review_needed`, or `decision_unsafe` for response prioritization.

**Independent Test**: Missing required evidence, severe missingness, invalid values, and weak joins generate decision metadata and soft-gate status.

### Tests for User Story 2

- [x] T019 [US2] Keep the missing-evidence readiness test failing until deterministic readiness emits decision metadata
- [x] T020 [US2] Add failing test for weak join completeness marking readiness `decision_unsafe` while preserving output flow in `tests/dataPipeline.test.ts`
- [x] T021 [US2] Add failing test for invalid response-prioritization values: negative counts and percentage values outside 0-100 in `tests/dataPipeline.test.ts`

### Implementation for User Story 2

- [x] T022 [US2] Implement response-prioritization field-role matching in `lib/decisionContext.ts`
- [x] T023 [US2] Implement `assessDecisionReadiness` in `lib/decisionContext.ts`
- [x] T024 [US2] Feed decision readiness checks into validation/profile quality results from `app/page.tsx` and `components/WorkflowComponents.tsx`
- [x] T025 [US2] Add a readiness summary panel and soft-gate copy in `components/WorkflowComponents.tsx`
- [x] T026 [US2] Run `npm run test -- tests/dataPipeline.test.ts` and confirm US2 tests pass

**Checkpoint**: Readiness is deterministic, visible, and non-blocking after the brief is complete.

---

## Phase 5: User Story 3 - Carry Caveats Into Outputs (Priority: P2)

**Goal**: Readiness caveats stay attached to charts, insights, exports, and review context.

**Independent Test**: Risky chart fields include caveats and PDF/export metadata includes readiness summary.

### Tests for User Story 3

- [x] T027 [US3] Keep the dashboard caveat propagation test failing until risky chart fields include caveat text
- [x] T028 [US3] Add failing test that readiness facts become dashboard insights in `tests/dataPipeline.test.ts`
- [x] T029 [US3] Add failing test for PDF quality lines including readiness caveat text via a pure formatting helper in `lib/exportPdf.ts`

### Implementation for User Story 3

- [x] T030 [US3] Add readiness facts to `computeDashboardInsightFacts` in `lib/dashboardInsights.ts`
- [x] T031 [US3] Add caveat-aware chart rationale/title handling in `lib/dashboardRecommendations.ts`
- [x] T032 [US3] Render chart caveats and dashboard readiness banner in `components/WorkflowComponents.tsx`
- [x] T033 [US3] Include readiness status and caveats in PDF export options in `lib/exportPdf.ts` and `app/page.tsx`
- [x] T034 [US3] Include readiness/caveat details in exported transformation-review context without modifying cleaning transforms in `app/page.tsx`
- [x] T035 [US3] Run `npm run test -- tests/dataPipeline.test.ts` and confirm US3 tests pass

**Checkpoint**: Caveats survive dashboard and export workflows.

---

## Final Phase: Validation and Closeout

**Purpose**: Verify the feature without expanding scope.

- [x] T036 Run `npm run lint`
- [x] T037 Run `npm run test`
- [x] T038 Run `npm run build`
- [ ] T039 If build succeeds, run `npm run dev` and perform a browser smoke pass with bundled samples
- [x] T040 Verify no `.env`, `.env.local`, package-manager alternates, build artifacts, or generated directories were added
- [x] T041 Run `git diff --check`
- [x] T042 Run `git status --short --branch`

**T039 note**: Interactive browser tooling was unavailable in this thread. HTTP smoke against `http://127.0.0.1:3001` returned 200 and included `Dashboard Copilot`.

---

## Template-First Adjustment

**Goal**: Make the first workflow step a low-barrier template selection with editable defaults, not a blank decision brief form.

- [x] T043 Add failing test that `createDefaultDecisionBrief()` pre-fills a valid `Response prioritization` brief in `tests/dataPipeline.test.ts`
- [x] T044 Run `npm run test -- tests/dataPipeline.test.ts` and record expected RED failure for missing default brief fields
- [x] T045 Update `createDefaultDecisionBrief()` with valid response-prioritization defaults in `lib/decisionContext.ts`
- [x] T046 Update `DecisionBriefStep` to foreground template selection and editable defaults in `components/WorkflowComponents.tsx` and `app/styles.css`
- [x] T047 Run `npm run test -- tests/dataPipeline.test.ts` and confirm the template-prefill test passes
- [x] T048 Rerun `npm run lint`, `npm run test`, and `npm run build`
- [x] T049 Run `git diff --check` and `git status --short --branch`

**Template-first validation note**: `npm run lint`, `npm run test`, and `npm run build` passed. Fresh dev-server HTTP smoke against `http://127.0.0.1:3001` returned 200 and included `Select Decision Template`, `Use template and continue`, and the default response-prioritization decision question.

---

## Suggested Collection Template Adjustment

**Goal**: From the clarify/template page, populate a suggested data collection template and provide a wireframe for the intended product shape.

- [x] T050 Generate a wireframe with ChatGPT image generation for the clarify/template page plus suggested collection-template preview
- [x] T051 Add failing tests that a decision brief populates deterministic suggested collection fields in `tests/dataPipeline.test.ts`
- [x] T052 Run `npm run test -- tests/dataPipeline.test.ts` and record expected RED failure for missing `buildSuggestedDataCollectionTemplate`
- [x] T053 Add `SuggestedDataCollectionTemplate` and field contracts in `types/decision.ts`
- [x] T054 Implement `buildSuggestedDataCollectionTemplate` in `lib/decisionContext.ts`
- [x] T055 Render the suggested collection-template preview in `components/WorkflowComponents.tsx` and style it in `app/styles.css`
- [x] T056 Add failing test for CSV-ready collection-template rows in `tests/dataPipeline.test.ts`
- [x] T057 Implement `buildSuggestedCollectionTemplateRows` and a `Download CSV template` button
- [x] T058 Run `npm run test -- tests/dataPipeline.test.ts` and confirm collection-template tests pass
- [x] T059 Rerun `npm run lint`, `npm run test`, and `npm run build`
- [x] T060 Run HTTP smoke against `http://127.0.0.1:3001` for collection-template copy and download control
- [x] T061 Run `git diff --check` and `git status --short --branch`

**Wireframe artifact**: `C:\Users\point\.codex\generated_images\019eb5d1-c7e6-71f1-9082-e0e7f293e048\ig_0350a4f6500e41c7016a2a820e520c81918e074de58dbe7d07.png`

**Suggested-template validation note**: `npm run lint`, `npm run test`, and `npm run build` passed. Fresh dev-server HTTP smoke against `http://127.0.0.1:3001` returned 200 and included `Suggested data collection template`, `response_gap_percent`, `current_capacity`, and `Download CSV template`.

---

## Dependencies & Execution Order

- Phase 1 before all feature work.
- Phase 2 before user-story implementation.
- US1 and US2 are both P1, but US1 should land first because readiness requires a brief.
- US3 depends on US2 readiness output.
- Final validation depends on all implemented stories.

## Parallel Opportunities

- T002 and T003 can run in parallel.
- T004, T005, and T006 can be written in parallel because they only touch tests.
- Once foundational contracts exist, pure module tests and UI wiring can be split by file, but any edits to `app/page.tsx` and `components/WorkflowComponents.tsx` should be serialized.

## Implementation Strategy

1. MVP: T001-T018, so the app captures decision context and sends only minimized context.
2. Core readiness: T019-T026, so the app evaluates fit-for-decision data quality.
3. Output trust: T027-T035, so caveats persist into charts and exports.
4. Close with T036-T042.
