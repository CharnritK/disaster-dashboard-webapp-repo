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



# GOAL 00 — Preflight and Branch Guard

## Objective
Verify repo state, branch, package scripts, and current feature context before making code changes.

## Target files / areas
Read only:
- `package.json`
- `specs/001-decision-context-data-quality/spec.md`
- `specs/001-decision-context-data-quality/tasks.md`
- `app/page.tsx`
- `components/WorkflowComponents.tsx`
- `lib/decisionContext.ts`
- `types/decision.ts`
- `tests/dataPipeline.test.ts`

## Commands
```bash
git status --short --branch
node --version
npm --version
cat package.json
```

## Tasks
1. Confirm current branch is `001-decision-context-data-quality`.
2. Confirm package scripts include lint/test/build.
3. Summarize current workflow in `codex_handoff/runtime/PHASE_LOG.md`.
4. Confirm there are no unexpected dirty files.
5. Do not edit source files yet.

## Acceptance criteria
- Branch verified.
- Target files exist.
- Existing constraints understood.
- Phase log initialized.

## Red team
No test changes in this phase. Run Repo Cartographer review instead.

## Stop if
Wrong branch, missing files, or dirty working tree contains unknown user changes.
