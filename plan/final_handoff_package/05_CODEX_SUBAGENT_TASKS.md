# 05 — Codex Sub-Agent Tasks

## Sub-agent operating principles

- One sub-agent, one bounded task.
- Read only the files listed in the task plus direct imports needed to understand behavior.
- Do not perform broad refactors.
- Preserve session-only operation and deterministic fallback.
- Return validation commands run and results; do not claim tests passed unless actually run.
- Stop when the task requires secrets, external writes, persistence, auth, production deployment, or scope expansion.

## Context management protocol

1. Master agent assigns one task card.
2. Sub-agent reads `README.md`, task context files, and existing tests relevant to the task.
3. Sub-agent returns a plan before implementation.
4. Sub-agent implements only scoped files.
5. Test/QA agent runs or recommends validation.
6. Master agent integrates changes and resolves conflicts.
7. Product owner completes review gate before merge.

## Task cards

### P0-01 — Surface AI fallback reason and deterministic mode in UI

**Owner:** Frontend UX Agent + Safety/AI Boundary Agent

**Objective:** Make AI-disabled, unavailable, rate-limited, timeout, and invalid-output fallback states clear to analysts without implying failure of the workflow.

**Context files to read:**
- `app/page.tsx`
- `components/WorkflowComponents.tsx`
- `lib/recommendations.ts`
- `types/recommendations.ts`
- `tests/dataPipeline.test.ts`

**Files to modify or verify:**
- `app/page.tsx`
- `components/WorkflowComponents.tsx`
- `tests/dataPipeline.test.ts`

**Constraints:**
- Do not change fallback contract unless needed
- Do not expose secrets
- Do not imply AI approval

**Acceptance criteria:**
- AI-off mode displays deterministic-mode notice
- Provider failure / invalid output displays fallback notice
- Dashboard and handoff flows still work when AI is disabled
- Tests or manual smoke notes cover at least AI-off and invalid-output fallback

**Validation:**
- `npm run test`
- manual: run main sample path with AI off

**Stop conditions:**
- Fallback reason source is unclear
- Need to change API response shape beyond UI consumption

**Expected sub-agent response format:**
```text
Task ID:
Summary:
Files inspected:
Files changed:
Tests added/updated:
Validation commands run:
Results:
Safety/privacy checks:
Risks:
Review gates needed:
```

### P0-02 — Add privacy regression tests for no full-row LLM transmission

**Owner:** Safety/AI Boundary Agent + Test/QA Agent

**Objective:** Ensure recommendation and copilot contexts cannot include full uploaded row payloads.

**Context files to read:**
- `lib/recommendationSchema.ts`
- `lib/copilotHandoff.ts`
- `lib/llmClient.ts`
- `app/api/recommend/route.ts`
- `app/api/copilot/route.ts`
- `tests/dataPipeline.test.ts`

**Files to modify or verify:**
- `tests/dataPipeline.test.ts`
- `lib/recommendationSchema.ts`
- `lib/copilotHandoff.ts`

**Constraints:**
- Use minimized profiles only
- Reject raw row/data arrays in handoff routes
- Keep deterministic fallback intact

**Acceptance criteria:**
- Tests assert profile payload includes only capped metadata/sample values
- Tests reject obvious raw row fields in copilot handoff route
- No route accepts `rows`, `data`, or full dataset payload for AI contexts

**Validation:**
- `npm run test`

**Stop conditions:**
- Current API intentionally accepts a raw row field; request owner review before changing contract

**Expected sub-agent response format:**
```text
Task ID:
Summary:
Files inspected:
Files changed:
Tests added/updated:
Validation commands run:
Results:
Safety/privacy checks:
Risks:
Review gates needed:
```

### P0-03 — Guarantee caveat parity across dashboard, PDF, and handoff JSON

**Owner:** Export/Handoff Agent + Test/QA Agent

**Objective:** Ensure readiness caveats and review-only language carry into all export surfaces.

**Context files to read:**
- `lib/exportPdf.ts`
- `lib/workflowExport.ts`
- `lib/copilotHandoff.ts`
- `components/WorkflowComponents.tsx`
- `tests/dataPipeline.test.ts`

**Files to modify or verify:**
- `lib/exportPdf.ts`
- `lib/workflowExport.ts`
- `tests/dataPipeline.test.ts`

**Constraints:**
- Do not make export sound like approval
- Do not add server storage
- Do not add external sending

**Acceptance criteria:**
- Decision handoff JSON includes readiness status, caveats, review notice, AI mode
- PDF includes decision readiness and caveats
- Unsafe status includes review-only language
- Tests cover unsafe packet and PDF quality lines

**Validation:**
- `npm run test`
- manual: export from risky quality sample

**Stop conditions:**
- PDF library cannot support requested accessibility content without new dependency

**Expected sub-agent response format:**
```text
Task ID:
Summary:
Files inspected:
Files changed:
Tests added/updated:
Validation commands run:
Results:
Safety/privacy checks:
Risks:
Review gates needed:
```

### P0-04 — Strengthen unsafe readiness and data-quality regression tests

**Owner:** Backend Pipeline Agent + Test/QA Agent

**Objective:** Ensure risky quality sample and missing evidence do not appear action-ready.

**Context files to read:**
- `lib/validation.ts`
- `lib/decisionContext.ts`
- `public/samples/demo_quality_risk.csv`
- `tests/dataPipeline.test.ts`

**Files to modify or verify:**
- `lib/validation.ts`
- `lib/decisionContext.ts`
- `tests/dataPipeline.test.ts`

**Constraints:**
- Row-preserving checks only
- No automatic row deletion/imputation
- No hidden correction

**Acceptance criteria:**
- Negative counts and >100 percentages are warning/fail as appropriate
- Missing admin/evidence fields downgrade readiness
- Readiness remains deterministic
- Tests cover missing evidence and risky quality sample

**Validation:**
- `npm run test`

**Stop conditions:**
- Business rule thresholds are ambiguous and materially affect readiness

**Expected sub-agent response format:**
```text
Task ID:
Summary:
Files inspected:
Files changed:
Tests added/updated:
Validation commands run:
Results:
Safety/privacy checks:
Risks:
Review gates needed:
```

### P1-01 — Create client-side dashboard project kit export

**Owner:** Export/Handoff Agent

**Objective:** Improve second-pass handoff by exporting prepared CSV, handoff JSON, transformation log, schema/config JSON, and README text.

**Context files to read:**
- `lib/exportCsv.ts`
- `lib/workflowExport.ts`
- `components/WorkflowComponents.tsx`

**Files to modify or verify:**
- `lib/workflowExport.ts`
- `components/WorkflowComponents.tsx`
- `tests/dataPipeline.test.ts`

**Constraints:**
- Client-side only
- No persistence
- No auto-send
- No external upload

**Acceptance criteria:**
- Project kit can be downloaded from export step
- Kit includes README text with caveats and review requirements
- Prepared data export preserves formula neutralization
- Tests cover project kit JSON structure

**Validation:**
- `npm run test`
- manual: download project kit

**Stop conditions:**
- Zip dependency needed; request approval before adding dependency

**Expected sub-agent response format:**
```text
Task ID:
Summary:
Files inspected:
Files changed:
Tests added/updated:
Validation commands run:
Results:
Safety/privacy checks:
Risks:
Review gates needed:
```

### P1-02 — Add one additional decision template with synthetic sample data

**Owner:** Product/Safety Agent + Backend Pipeline Agent + Docs Agent

**Objective:** Demonstrate reusable template pattern without broad platform expansion.

**Context files to read:**
- `types/decision.ts`
- `lib/decisionContext.ts`
- `components/WorkflowComponents.tsx`
- `public/samples/`
- `docs/showcase-script.md`
- `tests/dataPipeline.test.ts`

**Files to modify or verify:**
- `types/decision.ts`
- `lib/decisionContext.ts`
- `components/WorkflowComponents.tsx`
- `public/samples/<new-sample>.csv`
- `docs/showcase-script.md`
- `tests/dataPipeline.test.ts`

**Constraints:**
- One template only
- Synthetic data only
- No PII
- Add tests and docs

**Acceptance criteria:**
- Template appears in selector
- Suggested collection fields reflect new decision
- Evidence coverage and readiness checks work
- Demo sample loads and completes profile/harmonization path
- Docs explain scope and caveats

**Validation:**
- `npm run test`
- manual: run new sample workflow

**Stop conditions:**
- Template requires new architecture or persistence

**Expected sub-agent response format:**
```text
Task ID:
Summary:
Files inspected:
Files changed:
Tests added/updated:
Validation commands run:
Results:
Safety/privacy checks:
Risks:
Review gates needed:
```

### P1-03 — Accessibility baseline for workflow and chart outputs

**Owner:** Frontend UX Agent + Test/QA Agent

**Objective:** Improve non-technical and accessibility readiness without rewriting UI architecture.

**Context files to read:**
- `components/WorkflowComponents.tsx`
- `components/charts/`
- `lib/dashboardRecommendations.ts`
- `lib/exportPdf.ts`
- `tests/`

**Files to modify or verify:**
- `components/WorkflowComponents.tsx`
- `components/charts/*`
- `lib/dashboardRecommendations.ts`
- `tests/dataPipeline.test.ts`

**Constraints:**
- No large visual redesign
- No dependency unless justified
- Keep charts deterministic

**Acceptance criteria:**
- Buttons/inputs/alerts have accessible labels
- Charts include screenReaderSummary where recommended
- Manual keyboard smoke test documented
- Unit tests validate chart summaries where feasible

**Validation:**
- `npm run test`
- manual: keyboard navigation and screen-reader spot check

**Stop conditions:**
- Accessibility tooling dependency requested; owner approval needed

**Expected sub-agent response format:**
```text
Task ID:
Summary:
Files inspected:
Files changed:
Tests added/updated:
Validation commands run:
Results:
Safety/privacy checks:
Risks:
Review gates needed:
```

### DOC-01 — Create repo-local final handoff docs

**Owner:** Docs Agent

**Objective:** Add concise handoff docs to the repository after owner approval.

**Context files to read:**
- `README.md`
- `docs/digital-public-good-guide.md`
- `docs/codex-starter-prompts.md`
- `docs/showcase-script.md`

**Files to modify or verify:**
- `docs/current-state-and-target-state.md`
- `docs/vnext-build-handoff.md`
- `docs/safety-privacy-note.md`
- `docs/test-evidence.md`

**Constraints:**
- Docs only
- No marketing claims
- No test-passed claims unless evidence provided

**Acceptance criteria:**
- Docs distinguish implemented, claimed, aspirational, and out-of-scope
- Docs include safety and privacy boundaries
- Docs include validation commands and review gates
- Docs link to demo script and codex prompts

**Validation:**
- manual: docs review
- `npm run lint if markdown/type checks apply`

**Stop conditions:**
- Docs conflict with current code behavior; ask owner to verify

**Expected sub-agent response format:**
```text
Task ID:
Summary:
Files inspected:
Files changed:
Tests added/updated:
Validation commands run:
Results:
Safety/privacy checks:
Risks:
Review gates needed:
```

## Copy-ready sub-agent prompt shell

```text
You are a Codex sub-agent assigned one bounded task in CharnritK/disaster-dashboard-webapp-repo.

Task ID: [TASK_ID]
Task title: [TASK_TITLE]

Read only the context files listed in the task unless direct imports are necessary.
Do not broaden scope.
Do not add auth, persistence, background jobs, live pipelines, auto-send, auto-escalation, or auto-approval.
Do not send full uploaded rows to LLM routes.
Preserve deterministic fallback.
Add/update tests for behavior you change.
Run recommended validation commands when possible.
Do not claim tests passed unless you ran them.

Return:
1. Implementation plan.
2. Files inspected.
3. Files changed.
4. Tests added/updated.
5. Commands run and results.
6. Remaining risks.
7. Stop/review conditions.
```
