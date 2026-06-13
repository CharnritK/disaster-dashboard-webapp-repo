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



# GOAL 05 — Accessible No-Code UX Polish

## Objective
Polish copy and accessibility for a low-technical disaster-response user.

## Target files
- `components/WorkflowComponents.tsx`
- `app/styles.css`
- `tests/dataPipeline.test.ts` only for pure label helpers

## Copy rules
Replace or explain technical terms:
- `schema` -> `fields`
- `profile metadata` -> `column summary`
- `join` -> `combine files` or `join/combine`
- `decision_unsafe` -> `Not safe for action yet`

Do not remove technical details; keep them in expandable sections.

## Required UX updates
1. Recommendation step:
   - Make gate explicit: `Review before combining files`
   - Keep buttons: `Accept recommendation`, `Adjust join`
2. Validation step:
   - Ready label: `Ready for review`
   - Review label: `Review needed`
   - Unsafe label: `Not safe for action yet`
3. Export step:
   - Label JSON export as `Decision handoff log`
   - Explain it includes evidence coverage, join review, quality caveats, and transformation history.
4. Privacy/fallback:
   - If AI is off or unavailable, deterministic workflow remains available.
   - Avoid claiming zero data is sent if capped sample values are still included in profile metadata.

## Accessibility rules
- Status labels include text.
- No color-only meaning.
- Use semantic sections/headings.
- Tables have captions or nearby headings.
- Long prose outside table cells.
- Add `aria-live="polite"` or `role="status"` for dynamic status panels when appropriate.
- Keep focus styles visible.

## Tests
If label helpers are created:
- `readinessStatusLabel("decision_unsafe")` -> `Not safe for action yet`
- `evidenceCoverageStatusLabel("ambiguous")` -> `Needs review`

Red-team every helper test.

## Manual QA
Use `qa/ACCESSIBILITY_CHECKLIST.md`.

## Validation
```bash
npm run lint
npm run test
npm run build
```

## Acceptance criteria
- Demo is understandable without SQL/data engineering vocabulary.
- Accessibility basics are improved.
- No new dependencies.
