# T026 — Add privacy guard tests for no uploaded row persistence
Owner: Security/Privacy Reviewer

Goal: Prevent future row persistence regressions.

Target files:
- `tests/privacy-no-row-persistence.test.ts`
- `lib/db/**`
- `lib/llmClient.ts`

Implementation notes:
- `Test DB adapter has no raw row persistence methods.`
- `Test event metadata rejects row-like arrays.`
- `Test LLM payload uses minimized profiles only where feasible.`

Acceptance criteria:
- `Tests fail if rows can be stored.`
- `LLM payload minimization is covered.`
- `Full prompt persistence is covered.`

Tests:
- row array rejected
- prompt body not persisted
- uploaded row fixture not written to DB

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No OCR or data inspection.`

Dependencies: T012, T014

Risk: Medium

Stop condition: Stop if test cannot detect meaningful regressions.
