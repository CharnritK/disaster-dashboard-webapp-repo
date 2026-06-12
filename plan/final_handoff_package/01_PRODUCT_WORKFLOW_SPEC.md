# 01 — Product / Workflow Spec

## Goal

Make Dashboard Copilot a credible humanitarian decision-support prototype that helps analysts turn fragmented CSV/XLSX data into a transparent, reviewable decision package without implying automated operational approval.

## Users and stakeholders

| Role | Need |
|---|---|
| Humanitarian analyst | Profile fragmented data and understand whether it supports a decision |
| Information-management officer | Prepare data, caveats, and handoff outputs |
| Emergency operations lead | Review evidence and caveats before operational action |
| Project owner | Demo a safe, reusable AI-builder prototype |
| Builder/Codex | Implement scoped improvements without breaking safety boundaries |

## Primary workflow

1. Select response-prioritization decision template.
2. Review suggested data collection fields.
3. Upload CSV/XLSX or load synthetic fragmented demo data.
4. Profile data and inspect evidence coverage.
5. Review harmonization/join recommendation.
6. Accept or adjust recommendation manually.
7. Run preparation and quality/readiness checks.
8. Generate dashboard recommendation.
9. Review caveats, insights, and charts.
10. Export prepared CSV, PNG/PDF report, transformation log, and decision handoff JSON.

## Analyst-facing behavior

The workflow should use plain language:

- “This evidence is missing.”
- “This file may support severity.”
- “This join has unmatched rows.”
- “This dashboard is for review, not approval.”
- “AI is unavailable; deterministic checks are still running.”

## Requirements

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| P-WF-01 | Keep decision-first flow | P0 | User starts from decision template before upload |
| P-WF-02 | Keep evidence coverage visible | P0 | Coverage appears before harmonization and in export |
| P-WF-03 | Keep readiness as soft gate | P0 | Users can continue but caveats remain visible |
| P-WF-04 | Make AI fallback visible | P0 | UI explains deterministic fallback when AI off/fails |
| P-WF-05 | Improve export handoff | P0 | Handoff includes caveats, AI mode, lineage, transformation log |
| P-WF-06 | Improve non-technical copy | P1 | All workflow labels use practitioner language |
| P-WF-07 | Add one additional template only after P0 | P1 | New template has tests, sample data, and docs |
| P-WF-08 | Add accessible chart summaries | P1 | Charts include screen-reader summary or text equivalent |

## Rules and edge cases

- If evidence is missing, dashboard generation may continue only as review surface.
- If readiness is unsafe, exports must include a review-only notice.
- If AI returns invalid output, deterministic recommendations must be used.
- If upload is oversized or unsupported, show a plain-language error.
- If join coverage is low, preserve unmatched records and show caveat.
- If output is exported, caveats must carry into exported artifacts.

## Success metrics

| Metric | Target |
|---|---|
| Main demo completion | Analyst can complete in under 5 minutes |
| Safety visibility | Caveats appear in workflow, dashboard, and export |
| Fallback reliability | AI-disabled path produces a usable dashboard |
| Test coverage | P0 safety paths covered by unit or manual tests |
| Non-technical clarity | Reviewer can explain output without code knowledge |

## Non-goals

No auth, accounts, persistence, storage, background processing, scheduled refresh, live feeds, auto-approval, auto-send, or external operational workflow.
