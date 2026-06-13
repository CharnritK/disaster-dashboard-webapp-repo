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



# GOAL 03 — Simulated Fragmented Disaster Data

## Objective
Add synthetic demo data and sample buttons that showcase fragmented disaster-management data from multiple organizations.

## Target files
- `public/samples/demo_needs_assessment.csv`
- `public/samples/demo_population_baseline.csv`
- `public/samples/demo_service_capacity.csv`
- `public/samples/demo_quality_risk.csv`
- `lib/fileParsers.ts`
- `components/WorkflowComponents.tsx`
- `tests/dataPipeline.test.ts`

## New sample files

### demo_needs_assessment.csv
Use synthetic rows only. Include:
`assessment_id,assessment_date,admin_pcode,district_name,partner_org,site_type,people_assessed,households_assessed,priority_need,need_severity_score,response_gap_percent,latitude,longitude,notes`

### demo_population_baseline.csv
Include:
`admin_code,admin_name,total_population,children_under_18,older_adults,poverty_rate`

### demo_service_capacity.csv
Include:
`district_id,district_name,health_facility_count,evacuation_center_count,current_staff_capacity,market_functionality_score`

### demo_quality_risk.csv
Include:
`district_code,needs_score,response_gap_percent,affected_population`

Risky sample must include:
- response_gap_percent > 100
- negative affected_population
- duplicate row
- missing district_code

## fileParsers behavior
Update `loadSampleDatasets` to support:
- existing `single`
- existing `multi`
- new `fragmented`
- new `quality-risk`

Preserve current behavior.

## UploadStep UI
Add buttons:
- `Use fragmented demo data`
- `Use risky quality sample`

Plain helper copy:
- Fragmented demo: `needs + population + capacity`
- Risky sample: `invalid values and missing evidence`

## Tests
Add and red-team:
1. `loads fragmented demo sample data`
2. `fragmented demo data produces multi-source evidence coverage`
3. `quality-risk sample triggers invalid decision values and decision unsafe readiness`

If testing browser `fetch` is cumbersome, unit-test parsing and profiles using equivalent inline strings, then manually verify buttons.

## Privacy
- Synthetic data only.
- No names, emails, phone numbers, IDs of real people, or real coordinates that identify individuals.
- Notes must be generic.

## Validation
```bash
npm run test -- tests/dataPipeline.test.ts
npm run lint
npm run build
```

## Acceptance criteria
- Fragmented sample shows different geographic identifier names.
- Evidence Coverage Map covers required evidence across multiple files.
- Risky sample shows fallback/decision-unsafe behavior.
