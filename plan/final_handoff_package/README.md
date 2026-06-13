# Final Handoff Package — Disaster Dashboard Webapp

Repository: `CharnritK/disaster-dashboard-webapp-repo`
Created: 2026-06-12
Updated: 2026-06-13
Readiness: `PASS_WITH_REVIEW_REQUIRED`

## What this package is

This is the final build and coding handoff package for moving the disaster-management / humanitarian decision-support product toward controlled beta.

Production v1 is a controlled beta for non-sensitive, session-only disaster-response decision support. Response prioritization is the approved primary workflow. Service gap monitoring and preparedness risk screening are beta until domain-reviewed.

It consolidates:

- Current repo-state and target-state synthesis.
- Product and workflow specification.
- Technical build plan.
- P0/P1/P2 roadmap.
- Codex sub-agent execution model.
- Copy-ready Codex prompts.
- Validation and release checklists, including recorded P0 command evidence.
- Safety, privacy, and governance gates.

## What this package is not

This package does not deploy the app or approve operational disaster-response decisions.

Current P0/P1 repo-local implementation evidence is recorded in `08_QA_RELEASE_CLOSEOUT.md`, `09_IMPLEMENTATION_STATUS_TRACKER.md`, and `validation_matrix.json`. Controlled-beta release remains blocked until product, domain, safety/privacy, export, accessibility, release, and support owners are named and their gates are closed or explicitly deferred. Public launch remains blocked.

## Package contents

| File | Purpose |
|---|---|
| `00_EXECUTIVE_HANDOFF.md` | Decision-ready summary and immediate next build scope |
| `04_CODEX_MASTER_PROMPT.md` | Copy-ready master prompt for Codex orchestration |
| `08_QA_RELEASE_CLOSEOUT.md` | Review gates, stop conditions, release-readiness checklist |
| `09_IMPLEMENTATION_STATUS_TRACKER.md` | Tracker template for builder progress |
| `validation_matrix.json` | Machine-readable validation checklist |
| `manifest.json` | Machine-readable package status and production-v1 contract |
| `FINAL_HANDOFF_PACKAGE.md` | Consolidated full package, including product/workflow spec, technical build spec, roadmap, validation plan, safety governance, and sub-agent task guidance |

## Assimilated archive inputs

The older root-level prompt packs have been assimilated into the current docs,
code, tests, and handoff package. They are archived for audit/history only:

| Archived source | Current authoritative surface |
|---|---|
| `codex_handoff/` | `plan/final_handoff_package/08_QA_RELEASE_CLOSEOUT.md`, `plan/final_handoff_package/09_IMPLEMENTATION_STATUS_TRACKER.md`, `validation_matrix.json`, `docs/showcase-script.md`, `docs/digital-public-good-guide.md`, and the implemented app/tests |
| `codex_final_handoffs_disaster_dashboard/` | `docs/visualization-policy.md`, `docs/copilot/dataviz-disaster-dashboard/`, `lib/vizPolicy.ts`, `lib/vizRules/`, `components/charts/ChartFrame.ts`, public synthetic samples, and Vitest coverage |

Archive location: `plan/archive/2026-06-13-codex-handoffs/`.

## First use

1. Read `00_EXECUTIVE_HANDOFF.md`.
2. Check `08_QA_RELEASE_CLOSEOUT.md`, `09_IMPLEMENTATION_STATUS_TRACKER.md`,
   and `validation_matrix.json` for current evidence and open review gates.
3. Use `04_CODEX_MASTER_PROMPT.md` for future bounded Codex work.
4. Use `FINAL_HANDOFF_PACKAGE.md` when you need the consolidated product,
   technical, roadmap, validation, safety, and orchestration sections.
5. Re-run the relevant validation gates before merging or releasing.

## Non-negotiable constraints

- Do not add auth, accounts, persistence, background jobs, scheduled refresh, live pipelines, auto-send, auto-escalation, or auto-approval.
- Do not send full uploaded rows to an LLM route or provider.
- Preserve session-only operation unless the project owner explicitly approves a larger architecture change.
- Preserve deterministic fallback when AI is disabled, unavailable, rate-limited, times out, or returns invalid output.
- Keep deterministic mode as the default launch posture; enable AI only after safety/privacy review.
- Keep caveats and human review gates visible in workflow, dashboard, exports, and handoff summaries.
- Treat AI as explanation/summarization/handoff assistance, not final readiness authority.
