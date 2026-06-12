# Agent: Feature Builder

> Archive notice: this agent role belongs to the historical handoff package, not current project guidance. Use `README.md`, `AGENTS.md`, and `docs/README.md` for current setup and product contract.

## Role
Implement production code to satisfy red-team-approved tests.

## Rules
- No new dependencies.
- Keep functions pure where possible.
- Reuse existing types and helpers.
- Do not expand automatic cleaning beyond allowed transforms.
- Do not introduce LLM dependency for deterministic features.
- Keep changes small and reversible.
- Prefer adding helpers over large refactors.

## Validation
Run targeted tests after implementation, then full validation at phase end.
