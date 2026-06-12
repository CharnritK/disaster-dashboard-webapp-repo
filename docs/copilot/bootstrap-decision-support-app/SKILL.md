---
name: bootstrap-decision-support-app
description: Bootstrap a new decision-support dashboard prototype from Dashboard Copilot. Use when adapting this project to another humanitarian, public-health, civic-tech, or public-good workflow while preserving the decision-first flow, session-only data handling, deterministic fallback, visible caveats, and scoped prototype contract.
---

# Bootstrap Decision Support App

## Overview

Use this skill to adapt Dashboard Copilot into another scoped decision-support app. The goal is a reviewable first-pass workflow, not a full BI platform.

## Operating Contract

- Start with the decision, not the chart.
- Keep uploaded data session-only unless the user explicitly approves a larger architecture change.
- Preserve deterministic fallback when AI is disabled, unavailable, rate limited, or returns invalid output.
- Keep data quality caveats visible in the workflow and exports.
- Avoid adding auth, persistence, background jobs, new storage, browser-side provider calls, or new package managers by default.
- Treat the output as decision support, not operational approval.

## Workflow

1. Identify the new decision context:
   - What question is the user trying to answer?
   - What action will be taken?
   - Who decides or acts?
   - What evidence is required?
   - What caveats make the answer unsafe?

2. Map the current product pattern:
   - Decision template and default brief.
   - Suggested data collection fields.
   - Upload or bundled samples.
   - Profiling and evidence coverage.
   - Safe harmonization and cleaning.
   - Readiness status and caveats.
   - Dashboard and handoff exports.

3. Propose the smallest useful adaptation before editing code:
   - New copy and domain terms.
   - New sample data.
   - New decision template.
   - New readiness checks.
   - New dashboard recommendation rules.
   - New export or handoff wording.

4. Implement in the existing repo style:
   - Use TypeScript types in `types/`.
   - Put deterministic logic in `lib/`.
   - Keep UI changes in `components/WorkflowComponents.tsx` and related route files unless a new route is clearly needed.
   - Use `@/` imports.
   - Add Vitest coverage for pipeline behavior.

5. Verify with the right gate:
   - Docs-only: `git diff --check`.
   - Pipeline behavior: `npm run lint` and `npm run test`.
   - UI, route, CSS, config, or runtime behavior: `npm run lint`, `npm run test`, and `npm run build`.

## Good Adaptation Targets

- Shelter prioritization after flooding.
- Clinic outreach prioritization during an outbreak.
- Infrastructure damage triage after storms.
- Food assistance gap tracking.
- Weekly nonprofit service delivery reporting.

## Avoid

- Rebranding the app before confirming the new decision workflow.
- Adding storage or accounts as a shortcut for demo continuity.
- Making AI output look authoritative without deterministic validation.
- Hiding missing evidence, weak joins, or unsafe fields from exports.
- Creating a broad platform when one decision workflow would prove the value faster.
