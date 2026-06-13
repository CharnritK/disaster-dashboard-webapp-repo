# 09 — Implementation Status Tracker

Use this file during execution.

| Task ID | Owner | Status | PR/Branch | Tests | Review gate | Notes |
|---|---|---|---|---|---|---|
| P0-01 | Frontend UX + Safety/AI | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, `npm run build`, browser smoke | RG-03 needs reviewer | AI-off deterministic notice visible; fallback mode now takes precedence when later AI calls fall back |
| P0-02 | Safety/AI + Test/QA | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, `npm run build` | RG-03 needs reviewer | `/api/recommend` and `/api/copilot` reject raw `rows`/`data`/`sampleRows` payloads |
| P0-03 | Export/Handoff + QA | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, `npm run build`, browser smoke | RG-04 needs reviewer | Handoff lineage uses `rowCount`/`columnCount`; PDF readiness includes unsafe review-only language; export smoke passed |
| P0-04 | Backend Pipeline + QA | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, `npm run build` | RG-02/RG-04 need reviewer | Risky-quality sample and missing evidence remain decision-unsafe/regression-tested |
| P0-05 | Docs + UX | Done | `001-decision-context-data-quality` | Browser smoke | RG-02 needs reviewer | Main demo click path works on `127.0.0.1:3000`; Continue control hardened with explicit button type |
| P1-01 | Export/Handoff | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, browser smoke | RG-04 needs reviewer | Project kit JSON export includes README text, prepared CSV, schema, dashboard config, handoff log, and transformation log |
| P1-02 | Product + Backend + Docs | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, browser smoke | RG-01/RG-02 need reviewer | Template pack now includes response prioritization, service gap monitoring, preparedness risk screening, and safe synthetic samples |
| P1-03 | UX + QA | Done | `001-decision-context-data-quality` | `npm run test`, `npm run lint`, browser smoke | RG-05 needs reviewer | Chart summaries/mobile behavior are unit-tested; browser smoke used role/label selectors through export |
| P1-04 | Docs | Done | `001-decision-context-data-quality` | `git diff --check` | RG-02/RG-05 need reviewer | Visualization policy doc added for map, rate, denominator, caveat, and accessibility guardrails |

## Status values

- Not started
- Planned
- In progress
- Blocked
- Needs review
- Done
- Deferred

## Blocker format

```text
Blocker:
Impacted task:
Decision needed:
Owner:
Fallback:
```

## Execution evidence — 2026-06-12

- `npm ci`: passed; 108 packages installed, 0 vulnerabilities reported.
- `npm run test`: passed; 1 test file, 73 tests.
- `npm run lint`: passed; TypeScript no-emit gate completed.
- `npm run build`: passed; Next.js production build and `scripts/prepare-sites-dist.mjs` completed.
- Browser smoke: passed on `http://127.0.0.1:3000` with AI off. Verified template continuation, fragmented demo data load, profiling/evidence coverage, harmonization, join acceptance, ready-for-review dashboard, export cards, and deterministic handoff summary.

## Execution evidence — 2026-06-13

- `git diff --check`: passed.
- `npm ci`: passed; 108 packages installed, 0 vulnerabilities reported.
- `npm run test`: passed; 1 test file, 81 tests after adding deterministic-default AI env coverage.
- `npm run lint`: passed; TypeScript no-emit gate completed.
- `npm run build`: passed on rerun after stopping a hung local Next build process; Next.js production build and `scripts/prepare-sites-dist.mjs` completed.
- P1 targeted validation: `npm run test -- tests/dataPipeline.test.ts` passed; 1 test file, 80 tests.
- P1 browser smoke: passed on `http://127.0.0.1:3000` through service gap template selection, service gap sample data, profile, harmonize, prepare dataset, dashboard, export, and `dashboard-copilot-project-kit.json` download.
- Production-v1 contract refresh: `npm run lint`, `npm run test`, and `npm run build` passed after changing AI defaults to deterministic unless explicitly enabled. Short-lived production HTTP smoke returned 200 for `/` and `/api/recommend/status`; local `.env.local` now has `LLM_ENABLED=false` and `NEXT_PUBLIC_COPILOT_API_ENABLED=false`, so the status endpoint reports `llmEnabled=false` while preserving the local key.

## Review gates still required

- RG-01 Product owner: confirm controlled-beta scope, response-prioritization primary workflow, and beta status for service gap/preparedness workflows.
- RG-02 Domain/practitioner: confirm disaster-response language, caveats, and workflow assumptions.
- RG-03 Safety/privacy: confirm deterministic-default posture, AI-off launch mode, no-row AI boundary, and fallback behavior.
- RG-04 Export/handoff: confirm PDF/JSON/project-kit semantics do not imply operational approval.
- RG-05 Accessibility/no-code: human smoke tester should confirm keyboard and assistive-technology usability.
- RG-06 Release: repo maintainer/release owner should approve controlled-beta merge/release.
- RG-07 Support: name owner for beta support intake, triage, and escalation before controlled-beta users are invited.
