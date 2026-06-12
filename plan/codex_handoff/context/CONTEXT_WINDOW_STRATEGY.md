# Context Window Strategy for Codex

> Archive notice: this context strategy belongs to the historical handoff package, not current project guidance. Use `README.md`, `AGENTS.md`, and `docs/README.md` for current setup and product contract.

## Principle
Use small, phase-scoped context. Do not load the entire repository repeatedly.

## Before each phase
1. Read the current goal file.
2. Read only listed target files.
3. Read `runtime/PHASE_LOG.md` for prior decisions.
4. Inspect relevant diffs with `git diff -- <file>`.

## After each phase
Write a compact note to `codex_handoff/runtime/PHASE_LOG.md`:
- Phase completed
- Files changed
- Tests added
- Red-team result
- Validation command and result
- Open issue, if any

## Avoid
- Reading `.agents/`
- Reading all of `components/WorkflowComponents.tsx` when only one component is needed
- Rereading package lock unless dependency issue arises
- Large refactors
- Architecture additions not needed for tomorrow

## Sub-agent conflict control
If sub-agents are available:
- Do not let two agents edit the same file simultaneously.
- Test Author can edit tests first.
- Feature Builder edits production files after test red-team approval.
- UX/A11y edits UI/CSS after feature API is stable.
- Release Manager only fixes validation blockers.
