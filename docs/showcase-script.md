# Dashboard Copilot Showcase Script

Related docs:

- [Digital Public Good Guide](digital-public-good-guide.md)
- [AI Mode Configuration](AI_MODE.md)
- [Visualization Policy](visualization-policy.md)
- [Codex Starter Prompts](codex-starter-prompts.md)

This script is for onboarding and proof. It is not a production-readiness checklist.

## 3-minute demo script

1. Open `http://localhost:3000` and start on Step 1, `Select Decision Template`.
2. Say: "Dashboard Copilot starts with the decision, not the chart. Production v1 is a controlled beta for non-sensitive, session-only decision support. Response prioritization is the approved primary workflow; service gap monitoring and preparedness risk screening are beta until domain review."
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
14. Export prepared CSV, PDF report, PNG dashboard image, `Decision handoff log`, and `Project kit`.
15. Return to upload and click `Use risky quality sample`.
16. Profile and proceed until readiness appears. Show `Not safe for action yet` and explain invalid values remain reviewable but not action-ready.

## Exact click path

Main sample path:

`Use template and continue` -> `Use fragmented demo data` -> `Profile data` -> `Harmonize data` -> `Accept recommendation` -> `Generate dashboard` -> `Export dashboard` -> export CSV/PDF/PNG/decision handoff log/project kit.

Risky sample path:

`Upload` -> `Use risky quality sample` -> `Profile data` -> `Harmonize data` -> `Prepare dataset` or `Accept recommendation` -> review `Not safe for action yet`.

AI unavailable fallback path:

Leave `AI` off in the header, then run the main sample path. Use this talk track: "Deterministic mode is the default launch posture. AI is optional and should stay off until safety/privacy review approves it for this environment. Profiling, evidence coverage, readiness checks, join/combine recommendations, dashboard recommendations, and exports still work."

## What to emphasize

- The app starts from the response decision and required evidence.
- Production v1 is controlled beta, not public launch.
- Evidence coverage explains which file and field supports each evidence need.
- Combining files stays human-reviewable.
- Decision readiness is a soft gate, not an automatic approval.
- Caveats carry into dashboard recommendations, PDF, the decision handoff log, and the project kit.

## Limitations and next steps

- Current templates cover response prioritization, service gap monitoring, and preparedness risk screening. Product/domain review is still needed before treating non-default templates as production-approved.
- Uploaded data remains session-only; there is no persistence or account workflow.
- Recommendation AI receives minimized profile metadata; decision handoff AI receives derived summaries only. Full uploaded rows are not sent to either route, deterministic fallback remains available, and AI should remain disabled until safety/privacy review closes or is explicitly deferred.
- The local demo uses synthetic sample data only.
- Public launch remains blocked until product, domain, safety/privacy, export, accessibility, release, and support owners are named and their gates are closed or explicitly deferred.
