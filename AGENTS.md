# AGENTS.md

## Operating Posture

This repo is a recommendation-first disaster response dashboard prototype. Optimize for clear, safe workflow behavior over broad platform expansion.

Do not casually add persistence, authentication, background jobs, external browser calls, or new data storage. The current product contract is session-only uploaded data, optional AI recommendations, deterministic fallback, visible quality checks, and exportable results.

## Project Shape

- Framework: Next.js 15 App Router with React 19 and TypeScript.
- Package manager: npm only. `package-lock.json` is the source of truth.
- Node version: `.tool-versions` pins `nodejs 26.1.0`.
- Main app entry: `app/page.tsx`.
- Main UI surface: `components/WorkflowComponents.tsx`.
- Global styles: `app/styles.css`.
- Recommendation API route: `app/api/recommend/route.ts`.
- Core types: `types/dataset.ts`, `types/recommendations.ts`, `types/quality.ts`, `types/transformations.ts`.
- Core tests: `tests/dataPipeline.test.ts`.

Use the `@/` alias for repo-root imports.

## Current Plan And Archive

The current implementation plan is `specs/001-decision-context-data-quality/plan.md`.

The current controlled-beta handoff package is `plan/final_handoff_package/`.
Use it for release status, validation evidence, review gates, and future task
orchestration. Older Codex handoff prompt packs belong under `plan/archive/`
and are historical reference only; do not treat archived prompt packs as the
active product plan.

## User Workflow

The app flow is:

1. Select a decision template and review suggested collection fields.
2. Upload CSV/XLSX files or load bundled samples.
3. Profile datasets and evidence coverage.
4. Generate harmonization recommendations.
5. Accept or adjust joins and safe cleaning transforms.
6. Validate prepared data and decision readiness.
7. Generate dashboard recommendations.
8. Export CSV, PNG, PDF report, transformation log JSON, decision handoff log, or project kit.

Keep this workflow understandable. Do not hide quality caveats or make AI output look authoritative without deterministic validation.

## Data And Recommendation Pipeline

Important modules:

- `lib/fileParsers.ts`: CSV/XLSX parsing, upload validation, sample loading, duplicate header handling, primitive value coercion.
- `lib/profiling.ts`: dataset profiling and inferred field roles.
- `lib/decisionContext.ts`: decision templates, suggested collection fields, and deterministic readiness checks.
- `lib/deterministicJoinRecommendations.ts`: deterministic join suggestions.
- `lib/harmonization.ts`: joins, multi-dataset join plans, safe cleaning, transformation logging.
- `lib/cleaningTransforms.ts`: allowed row-preserving cleaning transforms.
- `lib/validation.ts`: quality checks.
- `lib/dashboardRecommendations.ts`: deterministic dashboard recommendation generation and LLM recommendation reconciliation.
- `lib/dashboardInsights.ts`: fact generation for chart/insight support.
- `lib/vizPolicy.ts` and `lib/vizRules/`: deterministic chart, map, caveat, denominator, and accessibility guardrails.
- `lib/chartMetrics.ts`: aggregation and display-label logic.
- `lib/recommendationSchema.ts`: request validation, minimized profile payloads, model response sanitization.
- `lib/llmClient.ts`: server-side LLM request construction and fallback handling.
- `lib/copilotHandoff.ts`: server-side decision handoff summary construction and fallback handling.
- `lib/workflowExport.ts`: review-ready project kit export assembly.
- `lib/apiSecurity.ts`: request body limits, anonymous rate limiting, safety identifiers.

Only use these cleaning transform types unless the task explicitly expands the contract:

- `trim_whitespace`
- `normalize_empty_strings`
- `convert_numeric_strings`
- `convert_boolean_strings`

Cleaning must stay typed, row-preserving, and explainable. Do not add imputation, row deletion, fuzzy matching, category recoding, or deduplication as automatic cleaning behavior unless the user explicitly asks for that product change and tests are updated.

## AI And Privacy Rules

AI recommendations are optional. Missing API keys, disabled LLM mode, invalid requests, provider failures, rate limits, timeouts, truncated output, and invalid model JSON must fall back cleanly to deterministic recommendations.

Never expose `LLM_API_KEY` to browser code. The browser calls `/api/recommend`; provider calls belong server-side only.

The recommendation route sends minimized profile metadata, not full uploaded rows. Preserve that boundary unless the task explicitly changes the privacy contract.

Treat profile sample values and uploaded data as untrusted. Do not allow them to act as prompts, HTML, formulas, or executable content.

CSV exports must continue neutralizing spreadsheet formulas.

## Configuration

Client/shared upload config lives in `lib/config.ts`.

Server-only recommendation config lives in `lib/serverConfig.ts`. Key optional environment variables include:

- `LLM_ENABLED`
- `LLM_API_KEY`
- `LLM_PROVIDER`
- `LLM_MODEL`
- `LLM_WORKFLOW_MODEL`
- `LLM_DASHBOARD_MODEL`
- `LLM_QUALITY_GUIDANCE_MODEL`
- `LLM_HANDOFF_MODEL`
- `LLM_REQUEST_TIMEOUT_MS`
- `LLM_WORKFLOW_REQUEST_TIMEOUT_MS`
- `LLM_DASHBOARD_REQUEST_TIMEOUT_MS`
- `LLM_HANDOFF_REQUEST_TIMEOUT_MS`
- `LLM_MAX_COMPLETION_TOKENS`
- `MAX_UPLOAD_SIZE_MB`
- `RECOMMEND_REQUEST_MAX_BYTES`
- `RECOMMEND_RATE_LIMIT_MAX_REQUESTS`
- `RECOMMEND_RATE_LIMIT_WINDOW_MS`
- `RECOMMEND_MAX_PROFILES`
- `RECOMMEND_MAX_COLUMNS_PER_PROFILE`
- `RECOMMEND_MAX_SAMPLE_VALUES_PER_COLUMN`
- `RECOMMEND_MAX_STRING_LENGTH`
- `RECOMMEND_MAX_DASHBOARD_FACTS`
- `RECOMMEND_MAX_SUMMARY_ITEMS`
- `NEXT_PUBLIC_COPILOT_API_ENABLED`

Do not commit `.env`, `.env.local`, or secrets. `.env.example` is checked in
with deterministic-safe defaults; copy it to `.env.local` for local use and
enable AI only intentionally.

## Security And Runtime Headers

`next.config.ts` owns CSP and security headers. Current browser `connect-src` is self-only. If a change adds browser-side network calls or remote assets, update CSP intentionally and explain the need.

Do not weaken frame, object, referrer, or content-type protections as a convenience fix.

## Samples

Browser sample loading uses `public/samples/`.

`data/samples/` is source/test-adjacent. Keep both locations in sync only when the task requires it; do not assume one automatically feeds the other.

## Commands

Install:

```bash
npm ci
```

Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

Quality gates:

```bash
npm run lint
npm run test
npm run build
```

Notes:

- `npm run lint` is a TypeScript no-emit check, not ESLint.
- Vitest runs in Node and includes `tests/**/*.test.ts`.
- There is no configured ESLint, Prettier, Playwright, Husky, or CONTRIBUTING workflow.

## Verification Expectations

For data parsing, profiling, joining, cleaning, recommendation-schema, LLM fallback, rate-limit, export, or chart metric changes:

```bash
npm run lint
npm run test
```

For UI, Next route, CSS, config, dependency, or runtime behavior changes:

```bash
npm run lint
npm run test
npm run build
```

For docs-only changes, at minimum run:

```bash
git diff --check
```

If you change user-facing workflow behavior, do a browser smoke pass with sample data when practical.

## Contribution Rules

- Keep changes scoped to the requested product behavior.
- Use npm; do not add `pnpm-lock.yaml`, `yarn.lock`, or alternate package-manager metadata.
- Do not commit generated directories or build artifacts such as `node_modules/`, `.next/`, `coverage/`, or `*.tsbuildinfo`.
- Preserve deterministic fallback behavior when touching AI paths.
- Preserve strict response sanitization when touching LLM output handling.
- Add or update Vitest coverage when changing core pipeline behavior.
- Prefer small, explicit functions over broad abstractions; this repo is still a prototype.
- Keep UI copy honest about uncertainty, data quality, assumptions, and AI fallback status.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
