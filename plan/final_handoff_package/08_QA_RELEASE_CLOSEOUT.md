# 08 — QA / Release Closeout

## Current verdict

`PASS_WITH_REVIEW_REQUIRED` for documentation handoff.

`PASS_WITH_REVIEW_REQUIRED` for P0 implementation evidence recorded on 2026-06-12.

`NOT_READY_FOR_RELEASE` until owner/safety/export/release review gates are completed.

## Scope reviewed

This closeout covers the build handoff package, not repository execution. It does not assert that code was changed or tests passed.

## Critical issues to resolve before merge/release

| ID | Issue | Severity | Why it matters | Required fix |
|---|---|---|---|---|
| Q-01 | Test results not recorded in package | High | Cannot prove implementation safety | Resolved 2026-06-12; see execution evidence |
| Q-02 | AI fallback visibility may need UI improvement | Medium | Analysts need transparency | Resolved 2026-06-12; AI-off notice browser-smoked and fallback mode precedence patched |
| Q-03 | Full-row LLM regression tests need confirmation | High | Privacy boundary is core contract | Resolved 2026-06-12; recommendation and copilot routes reject raw row arrays |
| Q-04 | Export caveat parity must be verified | High | Handoff can imply false confidence | Resolved 2026-06-12; JSON/PDF tests and export smoke updated |
| Q-05 | Accessibility baseline is incomplete | Medium | Public-good reuse and usability | Implement P1-03 or manual baseline |

## Release readiness checklist

- [ ] P0 scope approved by product owner.
- [x] No new auth/persistence/background/live-pipeline features.
- [x] No operational auto-approval/send/escalation.
- [x] No full uploaded rows sent to LLM.
- [x] Deterministic fallback works.
- [x] AI disabled path works.
- [x] Invalid model output fallback works.
- [x] Risky quality sample produces review/unsafe language.
- [x] Export contains caveats and AI mode.
- [x] Formula injection protection still tested.
- [x] Visualization policy still tested.
- [x] Manual browser smoke test passed.
- [x] `npm run lint` recorded.
- [x] `npm run test` recorded.
- [x] `npm run build` recorded.
- [ ] README/docs updated.
- [ ] Safety/privacy review passed.
- [ ] Domain/practitioner review passed.

## Execution evidence

Recorded on 2026-06-12:

- `npm ci`: passed; 108 packages installed, 0 vulnerabilities reported.
- `npm run test`: passed; 1 test file, 73 tests.
- `npm run lint`: passed; TypeScript no-emit gate completed.
- `npm run build`: passed; Next.js production build and `scripts/prepare-sites-dist.mjs` completed.
- Browser smoke: passed on `http://127.0.0.1:3000` with AI off through template, fragmented sample load, profile, harmonize, accept recommendation, dashboard, export cards, and deterministic handoff summary.

## Open questions

| ID | Question | Owner | Needed by | Impact if unresolved |
|---|---|---|---|---|
| OQ-01 | Is one additional template approved for vNext or deferred? | Product owner | Before P1 | Prevents scope creep |
| OQ-02 | Which exact sample data should be demo default? | Product owner / analyst | Before demo | Keeps story coherent |
| OQ-03 | Is accessibility tooling dependency allowed? | Repo maintainer | Before P1-03 | Determines test approach |
| OQ-04 | Should project kit export be zip or multi-file downloads? | Product owner / frontend | Before P1-01 | Affects dependencies and UX |

## Final response format for builders

```text
Summary:
Files changed:
Behavior changed:
Tests added:
Commands run:
Results:
Safety/privacy checks:
Risks:
Review gates:
Next recommended task:
```
