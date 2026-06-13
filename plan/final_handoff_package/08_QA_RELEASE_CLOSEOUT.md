# 08 — QA / Release Closeout

## Current verdict

`PASS_WITH_REVIEW_REQUIRED` for documentation handoff.

`PASS_WITH_REVIEW_REQUIRED` for P0 implementation evidence recorded on 2026-06-12 and P1 repo-local evidence refreshed on 2026-06-13.

`NOT_READY_FOR_RELEASE` until product, domain, safety/privacy, export, accessibility, release, and support owner gates are completed or explicitly deferred.

## Scope reviewed

This closeout covers the build handoff package and recorded P0/P1 repository execution evidence. It does not assert that external product, domain, safety/privacy, export, accessibility, release, or support approvals are complete.

Production v1 is a controlled beta for non-sensitive, session-only disaster-response decision support. Response prioritization is the approved primary workflow. Service gap monitoring and preparedness risk screening remain beta until domain review closes or is explicitly deferred. Deterministic mode is the default launch posture; AI should remain disabled until safety/privacy review approves it for the target environment.

## Critical issues to resolve before merge/release

| ID | Issue | Severity | Why it matters | Required fix |
|---|---|---|---|---|
| Q-01 | Test results not recorded in package | High | Cannot prove implementation safety | Resolved 2026-06-12; see execution evidence |
| Q-02 | AI fallback visibility may need UI improvement | Medium | Analysts need transparency | Resolved 2026-06-12; AI-off notice browser-smoked and fallback mode precedence patched |
| Q-03 | Full-row LLM regression tests need confirmation | High | Privacy boundary is core contract | Resolved 2026-06-12; recommendation and copilot routes reject raw row arrays |
| Q-04 | Export caveat parity must be verified | High | Handoff can imply false confidence | Resolved 2026-06-12; JSON/PDF tests and export smoke updated |
| Q-05 | Accessibility baseline is incomplete | Medium | Public-good reuse and usability | Resolved for repo-local baseline 2026-06-13; RG-05 human accessibility review still required |

## Release readiness checklist

- [ ] P0 scope approved by product owner.
- [ ] Response-prioritization workflow approved for controlled beta by product owner.
- [ ] Service gap and preparedness beta status accepted by product/domain owner.
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
- [x] README/docs updated.
- [ ] Safety/privacy review passed.
- [ ] Export/handoff semantics review passed.
- [ ] Accessibility/no-code review passed.
- [ ] Domain/practitioner review passed.
- [ ] Release owner approved controlled-beta release.
- [ ] Support owner named and beta support path documented.

## Execution evidence

Recorded on 2026-06-12:

- `npm ci`: passed; 108 packages installed, 0 vulnerabilities reported.
- `npm run test`: passed; 1 test file, 73 tests.
- `npm run lint`: passed; TypeScript no-emit gate completed.
- `npm run build`: passed; Next.js production build and `scripts/prepare-sites-dist.mjs` completed.
- Browser smoke: passed on `http://127.0.0.1:3000` with AI off through template, fragmented sample load, profile, harmonize, accept recommendation, dashboard, export cards, and deterministic handoff summary.

Refreshed on 2026-06-13:

- `git diff --check`: passed.
- `npm ci`: passed; 108 packages installed, 0 vulnerabilities reported.
- `npm run test`: passed; 1 test file, 79 tests after resolving onto current `main`.
- `npm run lint`: passed; TypeScript no-emit gate completed.
- `npm run build`: passed on rerun after stopping a hung local Next build process; Next.js production build and `scripts/prepare-sites-dist.mjs` completed.
- P1 targeted validation: `npm run test -- tests/dataPipeline.test.ts` passed; 1 test file, 79 tests.
- P1 browser smoke: passed on `http://127.0.0.1:3000` through service gap template selection, service gap sample data, profile, harmonize, prepare dataset, dashboard, export, and `dashboard-copilot-project-kit.json` download.
- Production-v1 contract refresh: `npm run lint`, `npm run test`, and `npm run build` passed after changing AI defaults to deterministic unless explicitly enabled. Short-lived production HTTP smoke returned 200 for `/` and `/api/recommend/status`; local `.env.local` now has `LLM_ENABLED=false` and `NEXT_PUBLIC_COPILOT_API_ENABLED=false`, so the status endpoint reports `llmEnabled=false` while preserving the local key.

## Open questions

| ID | Question | Owner | Needed by | Impact if unresolved |
|---|---|---|---|---|
| OQ-01 | Is one additional template approved for vNext or deferred? | Product owner | Before release review | Implemented as repo-local template pack; product owner still needs to approve final scope |
| OQ-02 | Which exact sample data should be demo default? | Product owner / analyst | Before demo | Keeps story coherent |
| OQ-03 | Is accessibility tooling dependency allowed? | Repo maintainer | Before future automated a11y | No dependency added; baseline uses existing unit/browser checks |
| OQ-04 | Should project kit export be zip or multi-file downloads? | Product owner / frontend | Before release review | Implemented as dependency-free JSON kit; owner can request zip later |
| OQ-05 | Who owns beta support intake, triage, and escalation? | Support owner / product owner | Before controlled beta | Public or partner beta should not start without a named support path |

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
