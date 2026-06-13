# Common Codex Operating Contract

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



# GOAL 04 — Decision Handoff Packet and Fallback Handling

## Objective
Export a transparent decision handoff packet and improve fallback copy.

## Why
Information management officers need to explain workflows and outputs. The export must carry evidence coverage, readiness, quality, join review, and transformations.

## Target files
- `app/page.tsx`
- `lib/decisionContext.ts`
- `lib/workflowExport.ts` if useful
- `components/WorkflowComponents.tsx`
- `tests/dataPipeline.test.ts`

## New pure helper
Add a pure helper, preferably in `lib/workflowExport.ts` or `lib/decisionContext.ts`:

```ts
buildDecisionHandoffPacket(input): object
```

Suggested input:
```ts
{
  decisionBrief,
  evidenceCoverage,
  decisionReadiness,
  datasets,
  selectedJoinRecommendations,
  qualityResults,
  transformationLog,
  aiMode
}
```

`aiMode` values:
- `llm`
- `deterministic`
- `disabled`
- `fallback`

Suggested output:
```ts
{
  generatedAt,
  decisionContext,
  evidenceCoverage,
  decisionReadiness,
  datasetLineage,
  joinReview,
  qualitySummary,
  transformations,
  aiAssistance,
  limitations,
  reviewNotice
}
```

## Export behavior
Update `exportLog()` to export the handoff packet.

Filename:
`dashboard-copilot-decision-handoff-log.json`

UI label:
`Export decision handoff log`

## Fallback copy
Add visible plain-language copy:
- AI off: `AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard recommendations remain available.`
- LLM unavailable: `AI recommendations were unavailable. The app used deterministic recommendations. Review joins and caveats before action.`
- Decision unsafe: `Dashboard generation is allowed for review, not for automatic action.`

## Tests
Add and red-team:
1. `builds a decision handoff packet with evidence coverage and lineage`
2. `handoff packet records deterministic fallback mode`
3. `decision unsafe packet includes review-only language`

## Validation
```bash
npm run test -- tests/dataPipeline.test.ts
npm run lint
npm run build
```

## Acceptance criteria
- JSON export is understandable to a non-engineering information management officer.
- Export includes evidence coverage.
- Export includes join review and transformation history.
- Unsafe outputs are marked review-only.
- No hard block added.
