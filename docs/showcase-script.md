# Dashboard Copilot Showcase Script

Related docs:

- [Digital Public Good Guide](digital-public-good-guide.md)
- [Codex Starter Prompts](codex-starter-prompts.md)

## 3-minute demo script

1. Open `http://localhost:3000` and start on Step 1, `Select Decision Template`.
2. Say: "Dashboard Copilot starts with the decision, not the chart. This template is for response prioritization."
3. Point to the suggested data collection template and download control. Say: "If teams do not have clean data yet, this gives them the fields to collect."
4. Click `Use template and continue`.
5. Click `Use fragmented demo data`.
6. Click `Profile data`.
7. Point to `Evidence coverage`. Say: "The app checks which file and field supports each evidence need: geography, severity, affected population, response gap, and capacity."
8. Click `Harmonize data`.
9. On `Review before combining files`, review the join/combine recommendation and click `Accept recommendation`.
10. On Step 5, point to the readiness panel. Say: "Warnings are soft gates. Analysts can continue, but caveats stay visible."
11. Click `Generate dashboard`.
12. Show dashboard caveats, insights, and charts. Say: "This is not an automatic operational decision; it is a review surface."
13. Click `Export dashboard`.
14. Export prepared CSV, PDF report, PNG dashboard image, and `Decision handoff log`.
15. Return to upload and click `Use risky quality sample`.
16. Profile and proceed until readiness appears. Show `Not safe for action yet` and explain invalid values remain reviewable but not action-ready.

## Exact click path

Main sample path:

`Use template and continue` -> `Use fragmented demo data` -> `Profile data` -> `Harmonize data` -> `Accept recommendation` -> `Generate dashboard` -> `Export dashboard` -> export CSV/PDF/PNG/decision handoff log.

Risky sample path:

`Upload` -> `Use risky quality sample` -> `Profile data` -> `Harmonize data` -> `Prepare dataset` or `Accept recommendation` -> review `Not safe for action yet`.

AI unavailable fallback path:

Turn `AI` off in the header, then run the main sample path. Use this talk track: "AI is optional. Deterministic profiling, evidence coverage, readiness checks, join/combine recommendations, dashboard recommendations, and exports still work."

## What to emphasize

- The app starts from the response decision and required evidence.
- Evidence coverage explains which file and field supports each evidence need.
- Combining files stays human-reviewable.
- Decision readiness is a soft gate, not an automatic approval.
- Caveats carry into dashboard recommendations, PDF, and the decision handoff log.

## Limitations and next steps

- V1 includes only the response-prioritization template.
- Uploaded data remains session-only; there is no persistence or account workflow.
- AI receives minimized profile metadata, not full uploaded rows, and deterministic fallback remains available.
- The local demo uses synthetic sample data only.
- Future work: more decision templates, richer geospatial boundaries, stronger accessibility test automation, and owner-approved operational review gates.
