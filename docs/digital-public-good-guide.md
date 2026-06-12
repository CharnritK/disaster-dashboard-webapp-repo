# Dashboard Copilot Public Good Guide

## Plain-English Summary

Dashboard Copilot helps humanitarian teams turn messy CSV or Excel files into a reviewable decision-support package.

It does not try to replace analysts, operational leads, or accountability processes. Its job is narrower and more useful: start with the response decision, check whether the available data can support that decision, prepare the data safely, recommend a first dashboard, and export the evidence, caveats, and transformation history.

The strongest framing is not "a dashboard generator." It is AI-assisted data standardization and weekly situation reporting for faster, safer operational decisions.

## Who This Is For

This project is useful for teams that need to make sense of fragmented disaster response data, especially when data comes from different partners, spreadsheets, or field reporting formats.

Likely users include:

- Information management officers
- Humanitarian analysts
- DataKind project teams
- Response coordinators preparing weekly updates
- Civic technology teams adapting the workflow to another public-good domain

## What The Project Does

Dashboard Copilot guides a user through a decision-first workflow:

1. Select a response decision template.
2. Review the suggested data collection fields.
3. Upload CSV or Excel files, or load bundled sample data.
4. Profile the data and identify useful fields.
5. Recommend safe joins and cleaning steps.
6. Validate whether the data is ready for the decision.
7. Generate dashboard recommendations and insights.
8. Export prepared data, dashboard images, reports, and handoff logs.

The workflow keeps uncertainty visible. If the data is incomplete, risky, or not ready for action, the app should say so clearly instead of hiding the issue behind a polished chart.

## What Is In Scope

The current prototype supports:

- Session-only file upload and sample data loading.
- CSV and Excel parsing.
- Dataset profiling.
- Decision-context checks for response prioritization.
- Suggested data collection templates.
- Deterministic join and dashboard recommendations.
- Safe, row-preserving cleaning transforms.
- Quality checks and decision-readiness labels.
- Optional AI recommendations with deterministic fallback.
- Exportable CSV, PNG, PDF, transformation log, and decision handoff outputs.

The intended use is a reviewable first pass: a prepared dataset, a dashboard draft, and a clear list of caveats that another person can inspect.

## What Is Not In Scope

The current prototype does not provide:

- User accounts or authentication.
- Saved projects or long-term storage.
- Background jobs or scheduled refreshes.
- Live operational data pipelines.
- Automatic operational approval.
- Automatic row deletion, imputation, fuzzy matching, deduplication, or category recoding.
- A full business intelligence platform.

Those features may be useful later, but adding them changes the product contract. Treat them as deliberate product decisions, not small technical additions.

## How AI Is Used

AI is optional. The app must still work when AI is disabled, unavailable, rate limited, or returns invalid output.

When AI is enabled, the server sends minimized dataset profile, readiness, quality, transformation, and dashboard-fact summaries, not full uploaded rows. The app still relies on deterministic checks for safety-sensitive labels such as data readiness.

The right mental model is: AI can help explain, summarize, and recommend. It should not silently approve unsafe data for action.

## How This Can Be Extended

Good extensions should preserve the decision-first workflow.

Best next extensions:

- Add new decision templates, such as shelter prioritization, public health outreach, or infrastructure damage triage.
- Add more sample datasets for realistic demos.
- Improve the exported handoff package for teams that need a second pass in another dashboard tool.
- Add clearer review language for non-technical stakeholders.
- Strengthen accessibility and browser smoke testing.
- Add more visualization rules for maps, rates, denominators, and uncertainty.

Avoid starting with platform features such as accounts, persistence, or scheduled data sync. Those are larger product moves and should come after the workflow is clearly valuable.

## Starter Codex Prompts

Use these prompts to extend or adapt the project.

### Add A New Decision Template

```text
Read the current Dashboard Copilot workflow and add a new decision template for [use case]. Preserve the session-only contract, deterministic fallback, and soft-gate readiness pattern. Update types, default template data, suggested collection fields, readiness checks, UI copy, and Vitest coverage. Do not add persistence, auth, background jobs, new package managers, or automatic row-deleting transforms.
```

### Adapt The Project To Another Public-Good Domain

```text
Adapt this disaster-response prototype into a decision-support workflow for [domain]. Start by identifying the decision question, action, decision-maker, required evidence, and caveats. Propose the smallest scoped changes needed before editing code. Keep the main workflow decision-first and keep technical details in an appendix or handoff note.
```

### Create A Data Collection Template

```text
Create a deterministic data collection template for [decision/use case]. It should include field name, field type, required or optional status, example value, evidence need, and caveat. Reuse the existing suggested-template pattern and CSV export helper. Add tests proving the template changes when the required evidence changes.
```

### Improve The Public Demo

```text
Improve the demo path for Dashboard Copilot so a non-technical colleague can understand the value in under five minutes. Keep the claims honest: this is decision support, not automatic operational approval. Update documentation or sample data only unless code changes are clearly necessary.
```

### Review For Digital Public Good Submission

```text
Review this repository as a digital public good candidate. Identify what is reusable, what is well documented, what may be missing for handoff, and what claims should be softened. Do not modify code. Produce a concise gap list and recommended next steps.
```

### Strengthen AI Safety And Privacy

```text
Audit the AI recommendation and handoff paths. Confirm that browser code never receives the LLM API key, full uploaded rows are not sent to recommendation or handoff routes, invalid model output falls back safely, and user-facing caveats remain visible. Fix only issues directly related to this contract and update tests where needed.
```

## Repo-Local Codex Skills

This repository includes starter Codex skills under `docs/copilot/`.

- `dataviz-disaster-dashboard`: use when creating or reviewing disaster-dashboard charts, maps, titles, annotations, or layout.
- `bootstrap-decision-support-app`: use when adapting this project into a new decision-support dashboard prototype.
- `adapt-decision-template`: use when adding a new decision template, suggested data collection fields, readiness checks, and tests.

These are not a replacement for product judgment. They are guardrails to help future Codex work stay aligned with the project contract.

## Appendix: Technical Details

### Technology

- Framework: Next.js 15 App Router.
- UI: React 19 with TypeScript.
- Package manager: npm only.
- Node version: `26.1.0`, pinned in `.tool-versions`.
- Tests: Vitest.
- Main app entry: `app/page.tsx`.
- Main workflow UI: `components/WorkflowComponents.tsx`.
- Global styles: `app/styles.css`.

### Core Modules

- `lib/fileParsers.ts`: CSV and Excel parsing.
- `lib/profiling.ts`: dataset profiling and field-role inference.
- `lib/decisionContext.ts`: decision templates, default brief, suggested collection template, and readiness checks.
- `lib/harmonization.ts`: joins, cleaning, and transformation logging.
- `lib/cleaningTransforms.ts`: allowed row-preserving cleaning transforms.
- `lib/validation.ts`: quality checks.
- `lib/dashboardRecommendations.ts`: deterministic and reconciled dashboard recommendations.
- `lib/dashboardInsights.ts`: insight facts and caveats.
- `lib/recommendationSchema.ts`: request validation and model-response sanitization.
- `lib/copilotHandoff.ts`: deterministic and sanitized decision handoff summaries.
- `lib/llmClient.ts`: server-side LLM request construction and fallback handling.
- `lib/apiSecurity.ts`: request-size limits, rate limiting, and safety identifiers.

### Current Allowed Cleaning Transforms

Only these automatic cleaning transforms are in scope:

- `trim_whitespace`
- `normalize_empty_strings`
- `convert_numeric_strings`
- `convert_boolean_strings`

These transforms are typed, row-preserving, and explainable.

### Local Commands

Install dependencies:

```bash
npm ci
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run quality gates:

```bash
npm run lint
npm run test
npm run build
```

### Privacy And Runtime Boundaries

- Uploaded data is session-only.
- Browser workflow requests call `/api/recommend` and `/api/copilot`; AI status checks may call `/api/recommend/status`. Provider calls stay server-side.
- `LLM_API_KEY` must never be exposed to browser code.
- `/api/recommend` sends minimized profile metadata and capped sample values; `/api/copilot` sends derived readiness, quality, transformation, dashboard-fact, limitation, and review-notice summaries.
- Full uploaded rows should not be sent to the recommendation or handoff routes; handoff requests use derived readiness, quality, transformation, and dashboard-fact summaries.
- Missing API keys, disabled AI mode, provider errors, timeouts, invalid JSON, and rate limits must fall back cleanly.

### Extension Checklist

Before accepting a major extension, check:

- Does it preserve the decision-first workflow?
- Does it keep quality caveats visible?
- Does it preserve deterministic fallback?
- Does it avoid sending full uploaded rows to AI services?
- Does it avoid new persistence, auth, background jobs, or storage unless explicitly approved?
- Does it include tests for changed pipeline behavior?
- Does the documentation explain the new use case in plain English?
