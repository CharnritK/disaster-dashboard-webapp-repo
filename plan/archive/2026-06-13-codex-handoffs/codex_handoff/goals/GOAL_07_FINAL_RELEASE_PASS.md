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



# GOAL 07 — Final Showcase Readiness Pass

## Objective
Verify the app is ready for tomorrow’s showcase. Do not add new features unless required to fix blocking issues.

## Commands
```bash
npm run lint
npm run test
npm run build
```

## Manual smoke test
Run local dev server:
```bash
npm run dev
```

Smoke path:
1. Open app.
2. Select default Response prioritization template.
3. Confirm suggested collection template is visible.
4. Download CSV template.
5. Load fragmented demo data.
6. Profile data.
7. Confirm Evidence Coverage Map appears.
8. Confirm coverage spans multiple datasets.
9. Harmonize data.
10. Review join/combine recommendation.
11. Accept recommendation.
12. Confirm decision readiness panel appears.
13. Generate dashboard.
14. Confirm caveats show where relevant.
15. Export harmonized CSV.
16. Export PDF report.
17. Export dashboard PNG.
18. Export decision handoff log.
19. Load risky quality sample.
20. Confirm invalid values create `Not safe for action yet` / `decision_unsafe`.
21. Confirm dashboard generation remains available for review.

## Create/update
Create or update:
- `docs/showcase-script.md`

Include:
- 3-minute demo script
- exact click path
- main sample path
- risky sample path
- AI unavailable fallback path
- limitations and next steps

## Fix only
- TypeScript errors
- broken imports
- failing tests
- broken demo path
- broken export
- obvious UX copy mistakes

## Final report
Use `templates/FINAL_CODEX_REPORT_TEMPLATE.md`.

## Readiness gate
Do not mark ready unless lint, test, build, and manual smoke pass or the user explicitly accepts a fallback demo path.
