# Common Codex Operating Contract

> Archive notice: this is a historical handoff goal, not current project guidance. Use `README.md`, `AGENTS.md`, and `docs/README.md` for current setup and product contract.

You are working in repository `CharnritK/disaster-dashboard-webapp-repo` on branch `001-decision-context-data-quality`.

## Mission
Extend the existing Dashboard Copilot branch for tomorrow’s disaster-response showcase. Do **not** build a new app.

## User and problem
Primary user: disaster response data analyst or information management officer with low-to-moderate technical skill.

Core problem: disaster-response data is fragmented across organizations, formats, geographic identifiers, quality levels, and schemas. Analysts need to understand datasets, determine relationships, harmonize, validate, document transformations, and create dashboards faster without losing transparency.

## Hard constraints
- No new dependencies unless a goal explicitly authorizes and justifies them. Default: no new dependencies.
- No new storage, login, database, background jobs, API integrations, deployments, or external writes.
- Keep data session-only.
- Do not ask for or handle secrets.
- Do not auto-send, auto-publish, auto-approve, or auto-escalate operational decisions.
- Keep joins and risky outputs human-reviewable.
- LLM is optional; deterministic fallback must work.
- Do not send full uploaded rows to the LLM.
- Do not add automatic imputation, row deletion, fuzzy matching, category recoding, or deduplication.
- Preserve existing CSV/XLSX upload behavior.
- Preserve existing tests unless a deliberate product change requires updating them.
- Keep UI no-code and accessible: clear headings, semantic buttons, readable status labels, no color-only meaning, keyboard-friendly controls, and plain language.
- Do not edit `.agents/` or large generated/governance directories unless a goal explicitly asks.
- Avoid reading huge unrelated files. Optimize context by reading only the files for the current phase.

## Mandatory red-team rule
After each new or modified test:
1. Run the test in RED state when feasible.
2. Invoke the Test Red-Team checklist in `codex_handoff/qa/RED_TEAM_PROTOCOL.md`.
3. Fix weak/tautological/implementation-only tests before writing production code.
4. After the test passes, run the red-team checklist again for false-positive risk.
5. Record the result in `codex_handoff/runtime/PHASE_LOG.md` or the current phase notes.

## Validation commands
Run at least:
```bash
npm run test -- tests/dataPipeline.test.ts
npm run lint
npm run test
npm run build
```

## Final response from Codex
Return:
1. Files changed
2. Tests added/updated
3. Red-team findings and fixes
4. Validation command results
5. Manual demo steps verified
6. Known limitations / review gates



# GOAL 01 — Evidence Coverage Map Core

## Objective
Add deterministic evidence coverage mapping for fragmented disaster-response data.

## Why
The app must help low-technical users answer: "Which uploaded files and columns cover the evidence required for this decision?"

## Target files
- `types/decision.ts`
- `lib/decisionContext.ts`
- `tests/dataPipeline.test.ts`

## New types
Add these or equivalent names:

```ts
export type EvidenceCoverageStatus = "covered" | "ambiguous" | "missing";

export type EvidenceCoverageCandidate = {
  datasetId: string;
  datasetName: string;
  columnName: string;
  inferredType: string;
  missingPercentage: number;
  confidence: number;
  rationale: string;
};

export type EvidenceCoverageItem = {
  evidenceNeed: string;
  status: EvidenceCoverageStatus;
  candidates: EvidenceCoverageCandidate[];
  caveat: string;
  nextAction: string;
};

export type EvidenceCoverageSummary = {
  coveredCount: number;
  ambiguousCount: number;
  missingCount: number;
  items: EvidenceCoverageItem[];
};
```

## New function
```ts
buildEvidenceCoverageSummary(
  datasets: Dataset[],
  decisionBrief: DecisionBrief
): EvidenceCoverageSummary
```

## Behavior
For each `decisionBrief.requiredEvidence` item:
- Find candidate columns across all profiled datasets.
- Use existing evidence patterns/rules where possible.
- Prefer lower missingness, semantic match, useful inferred type, and decision relevance.
- Status:
  - `covered`: one strong candidate or clear best candidate.
  - `ambiguous`: multiple similarly plausible candidates.
  - `missing`: no plausible candidate.
- Include caveat and nextAction in plain language.
- No LLM, network, or full-row external calls.
- Use profile metadata and column names. If you inspect row values locally for confidence, do not send them anywhere and keep it minimal.

## Suggested evidence matching
- Admin geography: district, admin, region, province, county, pcode, code
- Need severity: need, severity, score, priority, insecurity, damage, access
- Affected population: population, people, household, assessed, affected, cases
- Response gap: gap, coverage, unmet, access, service, facility, center
- Capacity signal: capacity, facility, clinic, center, service, market, staff, stock
- Source quality: source, agency, partner, organization
- Timeframe/date: date, time, period, month, week

## Tests to write first
Add tests one at a time and red-team each:

1. `maps fragmented sample datasets to response-prioritization evidence`
2. `marks missing required evidence with plain next actions`
3. `marks ambiguous evidence when multiple candidates are similarly plausible`
4. `builds evidence coverage without AI or recommendation state`

Use these fixtures in tests:

```ts
const needs = withProfile(createTabularDataset(
  "demo_needs_assessment.csv",
  "csv",
  "sample",
  parseCsv("admin_pcode,district_name,people_assessed,need_severity_score,response_gap_percent\nADM001,North,642,78,46\nADM002,Central,792,74,41\n")
));

const capacity = withProfile(createTabularDataset(
  "demo_service_capacity.csv",
  "csv",
  "sample",
  parseCsv("district_id,district_name,health_facility_count,evacuation_center_count\nADM001,North,5,7\nADM002,Central,8,9\n")
));
```

## Red-team protocol
After each test:
- Run targeted RED if feasible.
- Use `qa/RED_TEAM_PROTOCOL.md`.
- Fix weak tests before production code.
- After GREEN, run red-team again.

## Validation
```bash
npm run test -- tests/dataPipeline.test.ts
npm run lint
```

## Acceptance criteria
- Existing tests still pass.
- New coverage function is pure/deterministic.
- No new dependencies.
- No broad refactor.
