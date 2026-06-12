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



# GOAL 02 — Evidence Coverage UI

## Objective
Render the Evidence Coverage Map in the Profile step as a no-code, accessible panel.

## Target files
- `components/WorkflowComponents.tsx`
- `app/styles.css`
- `tests/dataPipeline.test.ts` only if adding pure label helpers

## Implementation
`ProfileStep` already receives `datasets` and `decisionBrief`. Use `buildEvidenceCoverageSummary(datasets, decisionBrief)`.

Add `EvidenceCoveragePanel` before the generic quality panel.

## UI requirements
- Heading: `Evidence coverage`
- Helper text: `This checks whether your uploaded files contain the evidence needed for the selected decision.`
- Summary chips:
  - `[coveredCount] covered`
  - `[ambiguousCount] need review`
  - `[missingCount] missing`
- For each evidence item show:
  - Evidence need
  - Status text: `Covered`, `Needs review`, or `Missing`
  - Where found: dataset name + inline code column
  - Missing percentage
  - Confidence percentage
  - Caveat
  - Next action
- Missing/ambiguous evidence is a warning, not a blocker.
- Keep cells/cards short; place long caveats outside table cells.
- No color-only status.
- Semantic HTML.

## Step numbering fix
Ensure visible copy matches:
- Template: Step 1
- Upload: Step 2
- Profile: Step 3
- Harmonize: Step 4
- Dataset review: Step 5

## Tests
If helper functions are added:
- `evidenceCoverageStatusLabel("covered")` returns `Covered`
- `evidenceCoverageStatusLabel("ambiguous")` returns `Needs review`
- `evidenceCoverageStatusLabel("missing")` returns `Missing`

Red-team every helper test.

## Manual check
- Load sample/fragmented data.
- Profile data.
- Confirm Evidence Coverage Map appears before quality checks.
- Confirm keyboard tab path still works.
- Confirm statuses include text.

## Validation
```bash
npm run test -- tests/dataPipeline.test.ts
npm run lint
npm run build
```

## Acceptance criteria
- No-code user can see what evidence each file contributes.
- Profile step stays readable.
- Build passes.
