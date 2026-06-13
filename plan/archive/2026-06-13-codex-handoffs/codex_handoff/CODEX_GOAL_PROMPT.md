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


# One-Shot Codex Goal

You are Codex receiving a handoff zip at `codex_handoff/`.

## Objective

Execute the goals in order and prepare the Dashboard Copilot branch for tomorrow’s showcase.

The build must solve the problem better than a generic dashboard generator by making fragmented data understandable to non-technical disaster-response staff.

## Sub-agent maximization

If your environment supports multiple agents/sub-agents, use them as follows:

- **Orchestrator Agent**: owns sequencing, phase logs, conflict control, final validation.
- **Repo Cartographer Agent**: verifies current files and branch context with minimal reading.
- **Test Author Agent**: writes unit tests first.
- **Test Red-Team Agent**: challenges every new/modified test before and after implementation.
- **Feature Builder Agent**: implements production code only after tests are red-team approved.
- **UX/A11y Agent**: reviews no-code copy, keyboard usability, semantic HTML, and status labels.
- **Privacy/Safety Agent**: checks LLM minimization, no full-row exfiltration, no secrets, no PII samples.
- **Release Manager Agent**: runs full validation and prepares demo script.

If sub-agents are unavailable, emulate them sequentially by following the agent prompt files under `codex_handoff/agents/`.

## Context-window optimization

- Read `codex_handoff/context/CONTEXT_WINDOW_STRATEGY.md` first.
- Read only the current goal file and target source files.
- Avoid `.agents/` and unrelated generated files.
- Keep phase notes short in `codex_handoff/runtime/PHASE_LOG.md`.
- After each phase, summarize what changed in 5–10 bullets before proceeding.
- Prefer diff-centric inspection over reading large files repeatedly.
- Use the red-team checklist as a focused review, not a broad rewrite.

## Goal sequence

Run these goals sequentially:

1. `codex_handoff/goals/GOAL_00_PREFLIGHT.md`
2. `codex_handoff/goals/GOAL_01_EVIDENCE_COVERAGE_CORE.md`
3. `codex_handoff/goals/GOAL_02_EVIDENCE_COVERAGE_UI.md`
4. `codex_handoff/goals/GOAL_03_SIMULATED_DEMO_DATA.md`
5. `codex_handoff/goals/GOAL_04_HANDOFF_PACKET_FALLBACKS.md`
6. `codex_handoff/goals/GOAL_05_ACCESSIBLE_NO_CODE_UX.md`
7. `codex_handoff/goals/GOAL_07_FINAL_RELEASE_PASS.md`

Optional only after the above pass:
- `codex_handoff/goals/GOAL_06_TEMPLATE_PACK_OPTIONAL.md`

## Stop conditions

Stop and report if:

- You are not on branch `001-decision-context-data-quality`.
- The repo has unexpected user changes that would be overwritten.
- Required tests cannot be written.
- A requested change requires new dependencies.
- A change would send full uploaded rows to an LLM or external service.
- You encounter secrets or real PII in committed files.
- `npm run build` fails after two fix attempts.
- A red-team review finds a critical test weakness that cannot be fixed quickly.

## Begin

Start with `GOAL_00_PREFLIGHT.md`.
