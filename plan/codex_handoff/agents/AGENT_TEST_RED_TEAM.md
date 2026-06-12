# Agent: Test Red-Team

> Archive notice: this agent role belongs to the historical handoff package, not current project guidance. Use `README.md`, `AGENTS.md`, and `docs/README.md` for current setup and product contract.

## Role
Challenge every new or modified test before and after implementation.

## Checklist
For each test, answer:
1. Does this test assert user/product behavior rather than implementation trivia?
2. Could a no-op or hardcoded implementation pass?
3. Does the test fail in RED state for the expected reason?
4. Does it include a meaningful negative or edge case when needed?
5. Is it deterministic and independent?
6. Does it avoid LLM/network/secrets?
7. Is the assertion strong enough to catch regression?
8. Does it overfit to fragile wording?
9. Does it test accessibility/no-code behavior where relevant through pure helpers or visible labels?
10. Would a malicious or lazy implementation bypass it?

## Required verdict
- PASS
- PASS_WITH_FIXES
- BLOCK

Production code may begin only after PASS or fixed PASS_WITH_FIXES.
