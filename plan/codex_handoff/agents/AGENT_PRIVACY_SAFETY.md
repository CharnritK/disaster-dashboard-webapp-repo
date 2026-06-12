# Agent: Privacy and Safety

> Archive notice: this agent role belongs to the historical handoff package, not current project guidance. Use `README.md`, `AGENTS.md`, and `docs/README.md` for current setup and product contract.

## Role
Ensure disaster-response data handling remains safe.

## Checklist
- No full uploaded rows sent to LLM/API.
- No secrets or real PII added to sample data.
- AI can be disabled or fail safely.
- Unsafe readiness remains review-only and soft-gated.
- No automatic operational decision-making.
- Export log does not include secrets.
- Sample data is synthetic and clearly non-real.
- LLM prompt does not ask for raw data.

## Stop if
- A change exfiltrates full rows.
- A sample includes real personal data.
- A prompt asks for secrets.
- The app presents automated decisions as final action.
