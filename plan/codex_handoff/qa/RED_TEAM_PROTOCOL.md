# Red-Team Protocol for Tests

> Archive notice: this protocol belongs to the historical handoff package, not current project governance. Use `AGENTS.md` and `docs/README.md` for current repo guidance.

## When to call this
Call after **every** new or modified test:
- Once before implementation, after confirming RED failure when feasible.
- Once after implementation, after GREEN pass.

## Test red-team worksheet

For each test, record:

```text
Test name:
Purpose:
RED result:
Expected failure reason:
Red-team verdict: PASS / PASS_WITH_FIXES / BLOCK
Issues found:
Fixes applied:
GREEN result:
Post-green false-positive check:
```

## Red-team criteria

A test is acceptable only if:
- It fails before implementation for the intended reason.
- It validates product behavior, not just implementation shape.
- It cannot be passed by returning a static empty object or hardcoded happy path.
- It covers edge cases when risk is high.
- It has meaningful assertions.
- It does not require external network, LLM, private data, or secrets.
- It avoids overfitting to incidental CSS or exact prose unless the prose is part of the UX requirement.
- It is deterministic.

## Lightweight mutation check
For P0 tests, do one if practical:
- Temporarily break the matching rule, status label, export field, or sample key.
- Confirm the test fails.
- Revert immediately.

Do not leave intentional breakage in the repo.

## Blocking examples
- Test passes without the new feature.
- Test only checks that a function exists.
- Test asserts an object snapshot with no meaningful behavior.
- Test requires real API/LLM calls.
- Test depends on current date/time without control.
- Test adds real PII or secrets.
