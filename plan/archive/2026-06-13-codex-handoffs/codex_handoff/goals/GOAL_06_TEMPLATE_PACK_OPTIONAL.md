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



# GOAL 06 — Optional Disaster Decision Template Pack

## Run only if
Goals 01–05 pass and the main demo path is stable.

## Objective
Expand decision templates from one response-prioritization template to a small disaster-management template pack.

## Target files
- `types/decision.ts`
- `lib/decisionContext.ts`
- `lib/recommendationSchema.ts`
- `components/WorkflowComponents.tsx`
- `tests/dataPipeline.test.ts`

## Template IDs
```ts
"response_prioritization" | "service_gap_monitoring" | "preparedness_risk_screening"
```

## Templates
1. Response prioritization: keep current defaults.
2. Service gap monitoring:
   - Decision question: `Where are service gaps largest for affected communities?`
   - Required evidence: Admin geography, Need severity, Service availability, Response gap, Capacity signal
3. Preparedness risk screening:
   - Decision question: `Which areas need preparedness attention before the next hazard event?`
   - Required evidence: Admin geography, Hazard exposure, Vulnerability, Population denominator, Preparedness capacity

## Requirements
- Response prioritization remains default.
- Template selector shows all three.
- Changing template resets brief to that template’s defaults.
- Suggested collection template updates by template.
- Recommendation context sanitization accepts all supported template IDs.
- Unknown template IDs are safely omitted or rejected. Choose one behavior and test it.

## Tests
Add and red-team:
1. `supports all disaster decision templates with valid defaults`
2. `updates collection fields by disaster decision template`
3. `recommendation request sanitizes all supported template IDs`
4. `response prioritization remains default`

## Stop if
- Existing response-prioritization happy path breaks.
- This requires broad refactor.
- Build fails after two fix attempts.

## Validation
```bash
npm run test -- tests/dataPipeline.test.ts
npm run lint
npm run build
```
