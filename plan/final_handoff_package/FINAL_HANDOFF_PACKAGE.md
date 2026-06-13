# Final Handoff Package — Consolidated

# Final Handoff Package — Disaster Dashboard Webapp

Repository: `CharnritK/disaster-dashboard-webapp-repo`
Created: 2026-06-12
Updated: 2026-06-13
Readiness: `PASS_WITH_REVIEW_REQUIRED`

## What this package is

This is the final build and coding handoff package for moving the disaster-management / humanitarian decision-support product toward controlled beta.

Production v1 is a controlled beta for non-sensitive, session-only disaster-response decision support. Response prioritization is the approved primary workflow. Service gap monitoring and preparedness risk screening are beta until domain-reviewed.

It consolidates:

- Current repo-state and target-state synthesis.
- Product and workflow specification.
- Technical build plan.
- P0/P1/P2 roadmap.
- Codex sub-agent execution model.
- Copy-ready Codex prompts.
- Validation and release checklists, including recorded P0 command evidence.
- Safety, privacy, and governance gates.

## What this package is not

This package does not deploy the app or approve operational disaster-response decisions.

Current P0/P1 repo-local implementation evidence is recorded in `08_QA_RELEASE_CLOSEOUT.md`, `09_IMPLEMENTATION_STATUS_TRACKER.md`, and `validation_matrix.json`. Controlled-beta release remains blocked until product, domain, safety/privacy, export, accessibility, release, and support owners are named and their gates are closed or explicitly deferred. Public launch remains blocked.

## Package contents

| File | Purpose |
|---|---|
| `00_EXECUTIVE_HANDOFF.md` | Decision-ready summary and immediate next build scope |
| `01_PRODUCT_WORKFLOW_SPEC.md` | Analyst/non-technical user workflow and product behavior |
| `02_TECHNICAL_BUILD_SPEC.md` | Frontend, backend, AI, data, scaling, and architecture handoff |
| `03_ROADMAP_BACKLOG.md` | P0/P1/P2 roadmap and milestone sequencing |
| `04_CODEX_MASTER_PROMPT.md` | Copy-ready master prompt for Codex orchestration |
| `05_CODEX_SUBAGENT_TASKS.md` | Sub-agent plan, task cards, prompts, and context boundaries |
| `06_TEST_VALIDATION_PLAN.md` | Test matrix, commands, acceptance checks, manual smoke plan |
| `07_SAFETY_GOVERNANCE.md` | Safety, privacy, AI, and human-review guardrails |
| `08_QA_RELEASE_CLOSEOUT.md` | Review gates, stop conditions, release-readiness checklist |
| `09_IMPLEMENTATION_STATUS_TRACKER.md` | Tracker template for builder progress |
| `codex_task_cards.json` | Machine-readable task cards |
| `validation_matrix.json` | Machine-readable validation checklist |
| `source_report.md` | Source repo-state report from this conversation |
| `source_roadmap_spec.md` | Source roadmap/spec from this conversation |

## First use

1. Read `00_EXECUTIVE_HANDOFF.md`.
2. Open `04_CODEX_MASTER_PROMPT.md` and paste it into Codex.
3. Assign one sub-agent task at a time from `05_CODEX_SUBAGENT_TASKS.md`.
4. Require every sub-agent to return the response format specified in the task.
5. Run validation gates in `06_TEST_VALIDATION_PLAN.md` before merging.

## Non-negotiable constraints

- Do not add auth, accounts, persistence, background jobs, scheduled refresh, live pipelines, auto-send, auto-escalation, or auto-approval.
- Do not send full uploaded rows to an LLM route or provider.
- Preserve session-only operation unless the project owner explicitly approves a larger architecture change.
- Preserve deterministic fallback when AI is disabled, unavailable, rate-limited, times out, or returns invalid output.
- Keep deterministic mode as the default launch posture; enable AI only after safety/privacy review.
- Keep caveats and human review gates visible in workflow, dashboard, exports, and handoff summaries.
- Treat AI as explanation/summarization/handoff assistance, not final readiness authority.


---

# 00 — Executive Handoff

## Project

`CharnritK/disaster-dashboard-webapp-repo`

## Product diagnosis

The repo is a disaster-management / humanitarian decision-support product moving from prototype/demo proof into controlled beta. Its strongest product frame is not “generic dashboard generator”; it is a decision-first workflow that helps analysts convert fragmented CSV/XLSX datasets into a reviewable decision-support package.

The product should help a practitioner answer: “Is this data good enough to support a near-term disaster response decision, and what caveats must a human reviewer understand before action?”

## Target state

A narrow, credible production v1 should support one excellent practitioner workflow before platform expansion:

- One analyst.
- One decision-first flow.
- Non-sensitive CSV/XLSX upload or synthetic sample data.
- Evidence coverage and readiness checks.
- Human-reviewable join and preparation steps.
- Dashboard recommendation with visible caveats.
- Exportable handoff package for second-pass review.
- Deterministic mode by default; optional AI only after safety/privacy review.

Service gap monitoring and preparedness risk screening are implemented as beta workflows. They should not be treated as approved production workflows until domain review closes or is explicitly deferred.

## Recommended vNext

| Field | Recommendation |
|---|---|
| User | Humanitarian analyst or information-management officer |
| Workflow | Response-prioritization decision support |
| Input | CSV/XLSX upload or synthetic sample datasets |
| Output | Dashboard, prepared CSV, PDF/PNG, transformation log, decision handoff JSON |
| Decision | Which affected areas/groups should receive first response |
| Safety gate | Human review required before operational action |
| Launch posture | Controlled beta; deterministic mode default |
| AI role | Summarization, explanation, harmonization guidance, handoff language |
| AI non-role | Final readiness authority, operational approval, or launch prerequisite |

## Build priorities

1. Make the current response-prioritization workflow fully credible for controlled beta.
2. Strengthen safety-critical tests: fallback, no full-row LLM transmission, export caveats, unsafe readiness, visualization policy.
3. Improve handoff exports and non-technical user clarity.
4. Keep service gap and preparedness workflows beta until domain-reviewed.

## Explicit non-goals

Do not build next:

- Auth/accounts.
- Saved projects or persistence.
- Background jobs.
- Scheduled refresh.
- Live operational pipelines.
- Auto-approval.
- Auto-send or auto-escalation.
- Full BI platform features.
- LLM routes that receive raw uploaded rows.
- PII or partner-private data examples.

## Readiness Verdict

`PASS_WITH_REVIEW_REQUIRED`

P0/P1 repo-local implementation evidence and local validation gates are recorded. Controlled-beta release remains blocked until named product, domain/practitioner, safety/privacy, export, accessibility, release, and support owners close or explicitly defer their gates. Public launch remains blocked.

## Immediate next action

Name the required gate owners, then have each owner review the completed P0/P1 scope in `09_IMPLEMENTATION_STATUS_TRACKER.md`. Close or explicitly defer the remaining gates before controlled-beta release; do not treat the demo as public-launch approval.


---

# 01 — Product / Workflow Spec

## Goal

Make Dashboard Copilot a credible humanitarian decision-support prototype that helps analysts turn fragmented CSV/XLSX data into a transparent, reviewable decision package without implying automated operational approval.

## Users and stakeholders

| Role | Need |
|---|---|
| Humanitarian analyst | Profile fragmented data and understand whether it supports a decision |
| Information-management officer | Prepare data, caveats, and handoff outputs |
| Emergency operations lead | Review evidence and caveats before operational action |
| Project owner | Demo a safe, reusable AI-builder prototype |
| Builder/Codex | Implement scoped improvements without breaking safety boundaries |

## Primary workflow

1. Select response-prioritization decision template.
2. Review suggested data collection fields.
3. Upload CSV/XLSX or load synthetic fragmented demo data.
4. Profile data and inspect evidence coverage.
5. Review harmonization/join recommendation.
6. Accept or adjust recommendation manually.
7. Run preparation and quality/readiness checks.
8. Generate dashboard recommendation.
9. Review caveats, insights, and charts.
10. Export prepared CSV, PNG/PDF report, transformation log, and decision handoff JSON.

## Analyst-facing behavior

The workflow should use plain language:

- “This evidence is missing.”
- “This file may support severity.”
- “This join has unmatched rows.”
- “This dashboard is for review, not approval.”
- “AI is unavailable; deterministic checks are still running.”

## Requirements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| P-WF-01 | Keep decision-first flow | P0 | User starts from decision template before upload |
| P-WF-02 | Keep evidence coverage visible | P0 | Coverage appears before harmonization and in export |
| P-WF-03 | Keep readiness as soft gate | P0 | Users can continue but caveats remain visible |
| P-WF-04 | Make AI fallback visible | P0 | UI explains deterministic fallback when AI off/fails |
| P-WF-05 | Improve export handoff | P0 | Handoff includes caveats, AI mode, lineage, transformation log |
| P-WF-06 | Improve non-technical copy | P1 | All workflow labels use practitioner language |
| P-WF-07 | Add one additional template only after P0 | P1 | New template has tests, sample data, and docs |
| P-WF-08 | Add accessible chart summaries | P1 | Charts include screen-reader summary or text equivalent |

## Rules and edge cases

- If evidence is missing, dashboard generation may continue only as review surface.
- If readiness is unsafe, exports must include a review-only notice.
- If AI returns invalid output, deterministic recommendations must be used.
- If upload is oversized or unsupported, show a plain-language error.
- If join coverage is low, preserve unmatched records and show caveat.
- If output is exported, caveats must carry into exported artifacts.

## Success metrics

| Metric | Target |
|---|---|
| Main demo completion | Analyst can complete in under 5 minutes |
| Safety visibility | Caveats appear in workflow, dashboard, and export |
| Fallback reliability | AI-disabled path produces a usable dashboard |
| Test coverage | P0 safety paths covered by unit or manual tests |
| Non-technical clarity | Reviewer can explain output without code knowledge |

## Non-goals

No auth, accounts, persistence, storage, background processing, scheduled refresh, live feeds, auto-approval, auto-send, or external operational workflow.


---

# 02 — Technical Build Spec

## Architecture stance

Preserve current architecture:

- Next.js / React / TypeScript.
- npm package manager.
- Vitest for tests.
- Client/session-local workflow state.
- Server-side AI provider calls only.
- Deterministic fallback in `lib/`.
- Decision and data types in `types/`.
- UI workflow localized to `app/` and `components/`.

## Target files / areas to verify

These are target areas to inspect and potentially modify; this package does not claim they have been changed.

| Area | Target files |
|---|---|
| App shell | `app/page.tsx` |
| Workflow UI | `components/WorkflowComponents.tsx` |
| API routes | `app/api/recommend/route.ts`, `app/api/copilot/route.ts` |
| Config | `lib/config.ts`, `.env.example` |
| Parsing | `lib/fileParsers.ts` |
| Profiling | `lib/profiling.ts` |
| Decision context | `lib/decisionContext.ts`, `types/decision.ts` |
| Harmonization | `lib/harmonization.ts`, `lib/cleaningTransforms.ts` |
| Validation | `lib/validation.ts`, `types/quality.ts` |
| Dashboard | `lib/dashboardRecommendations.ts`, `lib/dashboardInsights.ts`, `lib/vizPolicy.ts` |
| AI safety | `lib/recommendationSchema.ts`, `lib/llmClient.ts`, `lib/copilotHandoff.ts`, `lib/apiSecurity.ts` |
| Export | `lib/exportCsv.ts`, `lib/exportPdf.ts`, `lib/workflowExport.ts` |
| Tests | `tests/dataPipeline.test.ts` |
| Samples | `public/samples/`, `data/samples/` |
| Docs | `README.md`, `docs/` |

## Frontend requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FE-01 | Fallback notice | When AI is disabled/unavailable, user sees a clear deterministic fallback message |
| FE-02 | Non-technical labels | Workflow copy avoids developer jargon |
| FE-03 | Readiness visibility | Status, caveats, and blockers remain visible through dashboard/export |
| FE-04 | Accessible controls | Buttons, file inputs, alerts, dialogs have labels and keyboard support |
| FE-05 | Chart summaries | Charts expose title, axes, caveats, and screen-reader summary |
| FE-06 | Upload guardrails | PII/sensitive-data warning appears before upload |

## Backend / library requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| BE-01 | Deterministic fallback | All AI failures return deterministic recommendations or handoff |
| BE-02 | No raw rows to AI | AI request builders include profiles/summaries only |
| BE-03 | Request limits | API routes enforce size and rate limits |
| BE-04 | Response sanitization | Invalid model output is sanitized or rejected into fallback |
| BE-05 | Quality checks | Missingness, duplicates, type issues, join coverage, unsafe ranges covered |
| BE-06 | Export safety | CSV formula neutralization remains tested |

## AI usage contract

AI may:

- Summarize workflow context.
- Suggest harmonization guidance.
- Suggest dashboard language.
- Draft handoff narrative.

AI must not:

- Decide final readiness.
- Approve operational action.
- Receive full uploaded rows.
- Perform hidden actions.
- Persist user data.

## Scaling and performance constraints

This is a browser/session prototype. Scaling means “larger local samples and smoother browser performance,” not production multi-user architecture.

| Concern | Guardrail |
|---|---|
| Large uploads | Keep file size limit; reject oversized files clearly |
| Heavy tables | Prefer summaries and capped previews |
| PDF export | Keep report bounded and caveated |
| AI cost/timeouts | Keep limits and deterministic fallback |
| Multi-user scaling | Out of scope unless architecture approved |

## Implementation style constraints

- Keep changes small and targeted.
- Do not introduce persistence, auth, or database dependencies.
- Do not add new package managers.
- Do not broaden to generic BI platform.
- Add or update tests with each logic change.
- Any new dependency requires explicit justification and review.


---

# 03 — Roadmap & Backlog

## Roadmap principle

Make one practitioner workflow trustworthy before adding platform features.

## Milestone 0 — Preflight and baseline

| Task | Owner | Output |
|---|---|---|
| Confirm current commands | Builder | Report results for `npm ci`, lint, test, build |
| Verify target files | Builder | File map and no-surprises summary |
| Confirm AI env defaults | Builder | `LLM_ENABLED=false` safe local default |
| Confirm no secrets/PII | Builder | Sample-data and docs scan |

## Milestone 1 — P0 credibility and safety

| ID | Work item | User value | Target areas | Acceptance criteria |
|---|---|---|---|---|
| P0-01 | Show AI fallback reason | Analyst understands when deterministic mode is active | `app/page.tsx`, `components/WorkflowComponents.tsx`, `lib/recommendations.ts` | AI-off, timeout, invalid output, and rate-limit states show clear fallback notice |
| P0-02 | Strengthen no-full-row AI tests | Privacy trust | `lib/recommendationSchema.ts`, `lib/copilotHandoff.ts`, `tests/dataPipeline.test.ts` | Tests fail if raw `data`, `rows`, or full sample row payload reaches AI route |
| P0-03 | Export caveat parity | Handoff trust | `lib/exportPdf.ts`, `lib/workflowExport.ts` | PDF and JSON handoff include readiness, caveats, AI mode, transformation log |
| P0-04 | Unsafe readiness regression tests | Prevent unsafe approval | `lib/decisionContext.ts`, `lib/validation.ts`, tests | Risky quality sample produces review/unsafe status and review-only export language |
| P0-05 | Demo copy cleanup | Non-technical clarity | `components/WorkflowComponents.tsx`, `docs/showcase-script.md` | Main demo can be narrated in 3–5 minutes without developer explanation |

## Milestone 2 — P1 leverage

| ID | Work item | User value | Target areas | Acceptance criteria |
|---|---|---|---|---|
| P1-01 | Add dashboard project kit README/config export | Easier second-pass handoff | `lib/workflowExport.ts`, export UI | Export includes data schema/config and README-style instructions |
| P1-02 | Improve accessibility baseline | Public-good readiness | UI components, chart summaries, tests | Keyboard navigation and chart summaries pass agreed checks |
| P1-03 | Add one additional decision template | Reuse proof | `types/decision.ts`, `lib/decisionContext.ts`, samples, tests | New template has samples, evidence map, readiness checks, docs |
| P1-04 | Visualization policy documentation | Chart trust | `docs/`, `lib/vizPolicy.ts` | Docs explain map/rate/denominator/caveat rules |

## Milestone 3 — P2 later enhancements

| ID | Work item | Reason deferred |
|---|---|---|
| P2-01 | More templates | Only after response-prioritization is credible |
| P2-02 | Richer geospatial boundaries | Requires map safety and denominator review |
| P2-03 | Playwright E2E suite | Useful after UI stabilizes |
| P2-04 | Local project kit zip | Useful after export content is stable |
| P2-05 | i18n | Later user research needed |

## P0 exit criteria

- Recommended validation commands run and results recorded.
- No new persistence/auth/background jobs added.
- AI-disabled path works.
- Invalid model output falls back.
- Export contains caveats.
- No full uploaded rows sent to LLM route.
- Demo script matches UI.
- Product owner and safety reviewer pass review gates.


---

# 04 — Codex Master Handoff Prompt

Copy and paste this into Codex as the master orchestration prompt.

```text
You are Codex acting as a senior TypeScript/Next.js builder and repo-safe implementation agent.

Repository:
CharnritK/disaster-dashboard-webapp-repo

Mission:
Move the Dashboard Copilot disaster-management decision-support product toward the approved production v1 controlled-beta target state. Implement only the assigned task. Preserve safety, privacy, deterministic fallback, and session-only operation.

Primary product frame:
This is a humanitarian / disaster-management decision-support product for controlled beta, not a demo showcase. Production v1 is non-sensitive, session-only disaster-response decision support. Response prioritization is the approved primary workflow. Service gap monitoring and preparedness risk screening are beta workflows until domain-reviewed. The workflow starts from a decision, keeps uncertainty visible, preserves deterministic fallback, and must never make AI appear to approve operational decisions.

Non-negotiable constraints:
- Do not add auth, accounts, project persistence, background jobs, scheduled refresh, storage, or live operational pipelines.
- Do not add auto-send, auto-escalation, or auto-approval.
- Do not send full uploaded rows to LLM routes or providers.
- Preserve session-only operation unless explicitly approved.
- Keep deterministic mode as the default launch posture.
- Enable AI only after safety/privacy review closes or is explicitly deferred by the named owner.
- Preserve deterministic fallback when AI is disabled, unavailable, rate-limited, times out, or returns invalid output.
- Keep visible caveats and review gates in workflow, dashboard, exports, and handoff summaries.
- Treat AI as assistance for explanation, summarization, harmonization guidance, and handoff language only.
- Prefer synthetic/public data. Do not add PII, credentials, partner-private data, or sensitive operational data.
- Treat the demo path as onboarding/proof, not production readiness.
- Keep public launch blocked until product, domain, safety/privacy, export, accessibility, release, and support owners are named and their gates are closed or explicitly deferred.
- Do not introduce a new package manager.
- Keep deterministic logic in `lib/`; keep decision types in `types/`; keep tests in Vitest.

Before editing:
1. Read README.md, docs/digital-public-good-guide.md, docs/showcase-script.md, docs/codex-starter-prompts.md, app/page.tsx, components/WorkflowComponents.tsx, relevant lib/types files, and tests/dataPipeline.test.ts.
2. Produce a short implementation plan.
3. Confirm target files and tests.
4. Stop if the task scope conflicts with constraints.

Validation commands to run when environment supports them:
- npm ci
- npm run lint
- npm run test
- npm run build

Do not claim tests passed unless you actually ran them and include the output summary.

Sub-agent operating model:
Use focused sub-agents to reduce context load:
1. Repo Cartographer — confirms files and existing flow.
2. Safety/AI Boundary Agent — reviews AI, privacy, fallback, no-row transmission.
3. Frontend UX Agent — handles workflow copy, UI state, accessibility.
4. Backend Pipeline Agent — handles parsing/profiling/validation/harmonization logic.
5. Export/Handoff Agent — handles CSV/PDF/JSON handoff outputs.
6. Test/QA Agent — adds or updates tests and records validation results.
7. Docs Agent — updates README/docs/showcase only after code behavior is clear.

Each sub-agent should:
- Read only the files needed for its task.
- Return files inspected, proposed changes, risks, tests to add/run, and stop conditions.
- Avoid broad refactors.
- Ask for handoff review if scope expands.

Final response format:
1. Summary of changes.
2. Files changed.
3. Tests added/updated.
4. Validation commands run and results.
5. Safety/privacy checks.
6. Remaining risks or follow-up.
7. Any review gates needed before merge.
```


---

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


---

# 06 — Test & Validation Plan

## Validation command protocol

Run these commands when the environment supports them. Report exact command, result, and failure classification.

| Command | Purpose | Failure classification |
|---|---|---|
| `npm ci` | Install from lockfile | Environmental/dependency |
| `npm run lint` | Type/lint gate | Type/lint |
| `npm run test` | Vitest regression suite | Test/application |
| `npm run build` | Build/static packaging | Build/application/environment |

Do not write “tests passed” unless the command actually ran and produced passing output.

## P0 automated tests to add or confirm

| ID | Test | Input | Expected result | Safety condition |
|---|---|---|---|---|
| T-01 | Good fragmented demo path | Bundled fragmented sample | Profile, join, readiness, dashboard, export work | Caveats visible |
| T-02 | Risky quality sample | Quality-risk sample | Unsafe/review-needed readiness | No action approval |
| T-03 | AI disabled fallback | `LLM_ENABLED=false` or UI toggle off | Deterministic recommendations shown | Fallback visible |
| T-04 | Invalid model output fallback | Mock invalid JSON/schema | Fallback response | AI not trusted blindly |
| T-05 | Oversized upload | File > max limit | Clear rejection | Upload limit enforced |
| T-06 | Unsupported file type | Non-CSV/XLSX | Clear rejection | Parser boundary |
| T-07 | Missing evidence | Dataset lacking required fields | Missing coverage and caveat | Decision not action-ready |
| T-08 | Export caveats | Unsafe/review path | PDF/JSON contain caveats | Handoff safe |
| T-09 | No full-row LLM payload | Mock dataset with row marker | AI request lacks rows/data | Privacy boundary |
| T-10 | Viz policy | Problematic chart specs | Enforced or rejected | Avoid misleading visuals |

## Manual smoke test

1. Start local app.
2. Open `http://localhost:3000`.
3. Select response-prioritization template.
4. Use fragmented demo data.
5. Profile data.
6. Review evidence coverage.
7. Harmonize data.
8. Accept join recommendation.
9. Review readiness panel.
10. Generate dashboard.
11. Confirm caveats and insights are visible.
12. Export CSV, PDF/PNG, transformation log, and decision handoff.
13. Return to upload and run risky quality sample.
14. Confirm unsafe/review-only language appears.
15. Disable AI and repeat main path.
16. Confirm deterministic path still works.

## Failure reporting format

```text
Command:
Status:
Failure summary:
Likely cause:
Classification: environmental / dependency / type-test / application / unknown
Recommended fix:
Blocking? yes/no
```

## Release gate

A release candidate is not ready until:

- P0 tests exist or are manually validated.
- `npm run lint`, `npm run test`, and `npm run build` results are recorded.
- Manual smoke test passes.
- No secrets, PII, or partner-private data are included.
- Human review gate approves safety posture.


---

# 07 — Safety, Privacy & Governance

## Safety posture

This product supports human review. It does not approve disaster-response decisions.

## Non-negotiable safety rules

| Rule | Implementation expectation |
|---|---|
| Human review required | Readiness, dashboard, export and handoff preserve caveats |
| AI cannot approve | Deterministic readiness remains authoritative |
| No full rows to LLM | Recommendation/copilot requests use minimized profiles and summaries |
| Session-only | No auth, accounts, persistence, background jobs, or live pipelines |
| Deterministic fallback | AI disabled/unavailable/invalid/rate-limited returns safe fallback |
| Export caveats | PDF/JSON/CSV handoff include limitations and review notice |
| Synthetic/public data | Samples contain no PII or partner-private data |

## AI boundary

AI may assist with:

- Explaining quality issues.
- Suggesting harmonization language.
- Summarizing caveats.
- Drafting handoff narrative.

AI must not:

- Determine final readiness alone.
- Mark data safe for action.
- Send messages or alerts.
- Escalate cases.
- Approve operational decisions.
- Receive raw uploaded rows.

## Privacy checks

- Review API request builders for row fields.
- Search for raw dataset `data` / `rows` in LLM request payload construction.
- Confirm `LLM_API_KEY` is never referenced in client-visible code.
- Confirm sample datasets do not include real names, contacts, IDs, or sensitive operational data.
- Confirm exports do not add hidden persistence.

## Review gates

| Gate | Reviewer | Scope | Pass condition | Fallback |
|---|---|---|---|---|
| RG-01 Product scope | Product owner | vNext scope and non-goals | P0/P1 approved; platform features excluded | Reduce scope to P0 only |
| RG-02 Humanitarian workflow | Analyst / domain reviewer | Decision language and caveats | Workflow is understandable and review-safe | Rewrite copy and caveats |
| RG-03 AI/privacy | Safety reviewer | No-row AI, fallback, API key boundary | No raw rows/secrets; fallback proven | Block merge until fixed |
| RG-04 Export safety | QA/product reviewer | PDF/CSV/JSON handoff | Caveats, readiness, transformation log present | Block export changes |
| RG-05 Accessibility | Accessibility reviewer | UI, chart summaries, exports | No critical issues in agreed checks | Fix before release/demo |
| RG-06 Release | Repo maintainer | Tests/build/manual smoke | Commands recorded and P0 gate passed | Do not merge/release |

## Stop conditions

Stop and request review if:

- A task requires credentials.
- A task requires persistence or database changes.
- A task sends rows to AI routes.
- A task changes readiness semantics materially.
- Tests cannot be defined.
- The scope expands beyond approved P0/P1.
- The implementation would enable operational auto-approval/send/escalation.


---

# 08 — QA / Release Closeout

## Current verdict

`PASS_WITH_REVIEW_REQUIRED` for documentation handoff.

`PASS_WITH_REVIEW_REQUIRED` for P0 implementation evidence recorded on 2026-06-12 and P1 repo-local evidence refreshed on 2026-06-13.

`NOT_READY_FOR_RELEASE` until product, domain, safety/privacy, export, accessibility, release, and support owner gates are completed or explicitly deferred.

## Scope reviewed

This closeout covers the build handoff package and recorded P0/P1 repository execution evidence. It does not assert that external product, domain, safety/privacy, export, accessibility, release, or support approvals are complete.

Production v1 is a controlled beta for non-sensitive, session-only disaster-response decision support. Response prioritization is the approved primary workflow. Service gap monitoring and preparedness risk screening remain beta until domain review closes or is explicitly deferred. Deterministic mode is the default launch posture; AI should remain disabled until safety/privacy review approves it for the target environment.

## Critical issues to resolve before merge/release

| ID | Issue | Severity | Why it matters | Required fix |
|---|---|---|---|---|
| Q-01 | Test results not recorded in package | High | Cannot prove implementation safety | Resolved 2026-06-12; see execution evidence |
| Q-02 | AI fallback visibility may need UI improvement | Medium | Analysts need transparency | Resolved 2026-06-12; AI-off notice browser-smoked and fallback mode precedence patched |
| Q-03 | Full-row LLM regression tests need confirmation | High | Privacy boundary is core contract | Resolved 2026-06-12; recommendation and copilot routes reject raw row arrays |
| Q-04 | Export caveat parity must be verified | High | Handoff can imply false confidence | Resolved 2026-06-12; JSON/PDF tests and export smoke updated |
| Q-05 | Accessibility baseline is incomplete | Medium | Public-good reuse and usability | Resolved for repo-local baseline 2026-06-13; RG-05 human accessibility review still required |

## Release readiness checklist

- [ ] P0 scope approved by product owner.
- [ ] Response-prioritization workflow approved for controlled beta by product owner.
- [ ] Service gap and preparedness beta status accepted by product/domain owner.
- [x] No new auth/persistence/background/live-pipeline features.
- [x] No operational auto-approval/send/escalation.
- [x] No full uploaded rows sent to LLM.
- [x] Deterministic fallback works.
- [x] AI disabled path works.
- [x] Invalid model output fallback works.
- [x] Risky quality sample produces review/unsafe language.
- [x] Export contains caveats and AI mode.
- [x] Formula injection protection still tested.
- [x] Visualization policy still tested.
- [x] Manual browser smoke test passed.
- [x] `npm run lint` recorded.
- [x] `npm run test` recorded.
- [x] `npm run build` recorded.
- [x] README/docs updated.
- [ ] Safety/privacy review passed.
- [ ] Export/handoff semantics review passed.
- [ ] Accessibility/no-code review passed.
- [ ] Domain/practitioner review passed.
- [ ] Release owner approved controlled-beta release.
- [ ] Support owner named and beta support path documented.

## Execution evidence

Recorded on 2026-06-12:

- `npm ci`: passed; 108 packages installed, 0 vulnerabilities reported.
- `npm run test`: passed; 1 test file, 73 tests.
- `npm run lint`: passed; TypeScript no-emit gate completed.
- `npm run build`: passed; Next.js production build and `scripts/prepare-sites-dist.mjs` completed.
- Browser smoke: passed on `http://127.0.0.1:3000` with AI off through template, fragmented sample load, profile, harmonize, accept recommendation, dashboard, export cards, and deterministic handoff summary.

Refreshed on 2026-06-13:

- `git diff --check`: passed.
- `npm ci`: passed; 108 packages installed, 0 vulnerabilities reported.
- `npm run test`: passed; 1 test file, 79 tests after resolving onto current `main`.
- `npm run lint`: passed; TypeScript no-emit gate completed.
- `npm run build`: passed on rerun after stopping a hung local Next build process; Next.js production build and `scripts/prepare-sites-dist.mjs` completed.
- P1 targeted validation: `npm run test -- tests/dataPipeline.test.ts` passed; 1 test file, 79 tests.
- P1 browser smoke: passed on `http://127.0.0.1:3000` through service gap template selection, service gap sample data, profile, harmonize, prepare dataset, dashboard, export, and `dashboard-copilot-project-kit.json` download.
- Production-v1 contract refresh: `npm run lint`, `npm run test`, and `npm run build` passed after changing AI defaults to deterministic unless explicitly enabled. Short-lived production HTTP smoke returned 200 for `/` and `/api/recommend/status`; local `.env.local` now has `LLM_ENABLED=false` and `NEXT_PUBLIC_COPILOT_API_ENABLED=false`, so the status endpoint reports `llmEnabled=false` while preserving the local key.

## Open questions

| ID | Question | Owner | Needed by | Impact if unresolved |
|---|---|---|---|---|
| OQ-01 | Is one additional template approved for vNext or deferred? | Product owner | Before release review | Implemented as repo-local template pack; product owner still needs to approve final scope |
| OQ-02 | Which exact sample data should be demo default? | Product owner / analyst | Before demo | Keeps story coherent |
| OQ-03 | Is accessibility tooling dependency allowed? | Repo maintainer | Before future automated a11y | No dependency added; baseline uses existing unit/browser checks |
| OQ-04 | Should project kit export be zip or multi-file downloads? | Product owner / frontend | Before release review | Implemented as dependency-free JSON kit; owner can request zip later |
| OQ-05 | Who owns beta support intake, triage, and escalation? | Support owner / product owner | Before controlled beta | Public or partner beta should not start without a named support path |

## Final response format for builders

```text
Summary:
Files changed:
Behavior changed:
Tests added:
Commands run:
Results:
Safety/privacy checks:
Risks:
Review gates:
Next recommended task:
```


---

# 09 — Implementation Status Tracker

Use this file during execution.

| Task ID | Owner | Status | PR/Branch | Tests | Review gate | Notes |
|---|---|---|---|---|---|---|
| P0-01 | Frontend UX + Safety/AI | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, `npm run build`, browser smoke | RG-03 needs reviewer | AI-off deterministic notice visible; fallback mode now takes precedence when later AI calls fall back |
| P0-02 | Safety/AI + Test/QA | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, `npm run build` | RG-03 needs reviewer | `/api/recommend` and `/api/copilot` reject raw `rows`/`data`/`sampleRows` payloads |
| P0-03 | Export/Handoff + QA | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, `npm run build`, browser smoke | RG-04 needs reviewer | Handoff lineage uses `rowCount`/`columnCount`; PDF readiness includes unsafe review-only language; export smoke passed |
| P0-04 | Backend Pipeline + QA | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, `npm run build` | RG-02/RG-04 need reviewer | Risky-quality sample and missing evidence remain decision-unsafe/regression-tested |
| P0-05 | Docs + UX | Done | `001-decision-context-data-quality` | Browser smoke | RG-02 needs reviewer | Main demo click path works on `127.0.0.1:3000`; Continue control hardened with explicit button type |
| P1-01 | Export/Handoff | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, browser smoke | RG-04 needs reviewer | Project kit JSON export includes README text, prepared CSV, schema, dashboard config, handoff log, and transformation log |
| P1-02 | Product + Backend + Docs | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, browser smoke | RG-01/RG-02 need reviewer | Template pack now includes response prioritization, service gap monitoring, preparedness risk screening, and safe synthetic samples |
| P1-03 | UX + QA | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, browser smoke | RG-05 needs reviewer | Chart summaries/mobile behavior are unit-tested; browser smoke used role/label selectors through export |
| P1-04 | Docs | Done | `001-decision-context-data-quality` | `git diff --check` | RG-02/RG-05 need reviewer | Visualization policy doc added for map, rate, denominator, caveat, and accessibility guardrails |

## Status values

- Not started
- Planned
- In progress
- Blocked
- Needs review
- Done
- Deferred

## Execution evidence — 2026-06-12

- `npm ci`: passed; 108 packages installed, 0 vulnerabilities reported.
- `npm run test`: passed; 1 test file, 73 tests.
- `npm run lint`: passed; TypeScript no-emit gate completed.
- `npm run build`: passed; Next.js production build and `scripts/prepare-sites-dist.mjs` completed.
- Browser smoke: passed on `http://127.0.0.1:3000` with AI off. Verified template continuation, fragmented demo data load, profiling/evidence coverage, harmonization, join acceptance, ready-for-review dashboard, export cards, and deterministic handoff summary.

## Execution evidence — 2026-06-13

- `git diff --check`: passed.
- `npm ci`: passed; 108 packages installed, 0 vulnerabilities reported.
- `npm run test`: passed; 1 test file, 79 tests.
- `npm run lint`: passed; TypeScript no-emit gate completed.
- `npm run build`: passed on rerun after stopping a hung local Next build process; Next.js production build and `scripts/prepare-sites-dist.mjs` completed.
- P1 targeted validation: `npm run test -- tests/dataPipeline.test.ts` passed; 1 test file, 79 tests.
- P1 browser smoke: passed on `http://127.0.0.1:3000` through service gap template selection, service gap sample data, profile, harmonize, prepare dataset, dashboard, export, and `dashboard-copilot-project-kit.json` download.

## Review gates still required

- RG-01 Product owner: confirm controlled-beta scope, response-prioritization primary workflow, and beta status for service gap/preparedness workflows.
- RG-02 Domain/practitioner: confirm disaster-response language, caveats, and workflow assumptions.
- RG-03 Safety/privacy: confirm deterministic-default posture, AI-off launch mode, no-row AI boundary, and fallback behavior.
- RG-04 Export/handoff: confirm PDF/JSON/project-kit semantics do not imply operational approval.
- RG-05 Accessibility/no-code: human smoke tester should confirm keyboard and assistive-technology usability.
- RG-06 Release: repo maintainer/release owner should approve controlled-beta merge/release.
- RG-07 Support: name owner for beta support intake, triage, and escalation before controlled-beta users are invited.

## Blocker format

```text
Blocker:
Impacted task:
Decision needed:
Owner:
Fallback:
```
