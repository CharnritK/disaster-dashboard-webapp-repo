# Agent: Feature Builder

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
