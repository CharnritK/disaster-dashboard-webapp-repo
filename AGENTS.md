# AGENTS.md

## Operating Posture

This repo is now a controlled-beta disaster response decision-support app, not
only the earlier session-only prototype.

Optimize for safe workflow behavior, clear decision readiness, deterministic
fallbacks, and strict privacy boundaries. Auth, quota checks, metadata-only
persistence, route splitting, feedback, templates, coach guidance, and admin
metadata reporting exist because the v1.1 controlled-beta package explicitly
scoped them. Do not expand those surfaces casually.

Core rule: uploaded disaster data remains session-only. The app may persist
only approved metadata. Never persist uploaded files, raw rows, prepared rows,
full datasets, exports, full prompts, full LLM request bodies, row-like model
responses, secrets, or operationally sensitive data.

No production deployment, production environment mutation, production database
migration, provider/model change, retention automation, or admin access policy
change without explicit user approval.

## Project Shape

- Framework: Next.js 15 App Router with React 19 and TypeScript.
- Package manager: npm only. `package-lock.json` is the source of truth.
- Node version: `.tool-versions` currently pins `nodejs 24.15.0`; `package.json`
  declares Node `24.x`.
- Main public demo route: `app/demo/page.tsx`.
- Root route: `app/page.tsx`, currently redirects to `/demo`.
- Protected app shell: `app/app/layout.tsx` and `components/AppShell.tsx`.
- Split workflow routes: `app/app/(workflow)/`.
- Main workflow UI surface: `components/WorkflowComponents.tsx` via
  `components/DashboardCopilotApp.tsx`.
- Global styles: `app/styles.css`.
- Recommendation API route: `app/api/recommend/route.ts`.
- Copilot handoff API route: `app/api/copilot/route.ts`.
- Coach API route: `app/api/coach/route.ts`.
- Usage API route: `app/api/usage/route.ts`.
- Feedback API route: `app/api/feedback/route.ts`.
- Template API routes: `app/api/templates/`.
- Auth routes: `app/auth/` and `app/login/page.tsx`.
- Admin route: `app/admin/page.tsx`.
- Core tests live in `tests/**/*.test.ts`.

Use the `@/` alias for repo-root imports.

## Current Plan And Status

The active controlled-beta execution package is
`plan/dashboard_copilot_codex_handoff_v1_1/`.

Important status documents:

- `plan/dashboard_copilot_codex_handoff_v1_1/docs/product_contract.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/docs/roadmap.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/docs/decisions_required.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/qa/milestone_T010_report.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/qa/final_goal_status.md`

`plan/final_handoff_package/` is foundation and release-gate context. Older
Codex handoff prompt packs under `plan/archive/` are historical reference only;
do not treat archived prompt packs as the active product plan.

Current local/reviewable target state: controlled authenticated AI beta with a
public deterministic demo, protected app routes, metadata-only persistence
boundary, quota-gated AI attempts, safe feedback/templates, deterministic coach
fallback, and admin aggregate metadata reporting.

Remaining external gates include production deployment, production migrations,
real Supabase email-login verification, production redirect URL review,
production admin allowlist review, and any retention automation.

## Product Routes

- `/demo`: public deterministic workflow. Use sample/synthetic data only. No AI
  calls. No login required.
- `/`: redirects to `/demo`.
- `/app/**`: protected authenticated workspace. Uploaded data must remain in
  browser/session state, not server persistence.
- `/app/data`, `/app/prepare`, `/app/readiness`, `/app/dashboard`, `/app/export`:
  route-backed workflow steps.
- `/app/usage`: authenticated usage meter.
- `/app/feedback`: authenticated feedback surface.
- `/app/templates`: authenticated template surfaces.
- `/admin`: deny-by-default admin metadata dashboard. Do not expose raw data,
  prompts, reports, exports, or row-like metadata.

## User Workflow

The core app flow is:

1. Select a decision template and review suggested collection fields.
2. Upload CSV/XLSX files or load allowed bundled samples.
3. Profile datasets and evidence coverage.
4. Generate harmonization recommendations.
5. Accept or adjust joins and safe cleaning transforms.
6. Validate prepared data and decision readiness.
7. Generate dashboard recommendations.
8. Export CSV, PNG, PDF report, transformation log JSON, decision handoff log,
   or project kit.

Keep this workflow understandable. Do not hide quality caveats or make AI output
look authoritative without deterministic validation. The product story is
decision-readiness and reviewable handoff, not automated operational approval.

## Data And Recommendation Pipeline

Important modules:

- `lib/fileParsers.ts`: CSV/XLSX parsing, upload validation, sample loading,
  duplicate header handling, primitive value coercion.
- `lib/profiling.ts`: dataset profiling and inferred field roles.
- `lib/decisionContext.ts`: decision templates, suggested collection fields,
  and deterministic readiness checks.
- `lib/deterministicJoinRecommendations.ts`: deterministic join suggestions.
- `lib/harmonization.ts`: joins, multi-dataset join plans, safe cleaning,
  transformation logging.
- `lib/cleaningTransforms.ts`: allowed row-preserving cleaning transforms.
- `lib/validation.ts`: quality checks.
- `lib/dashboardRecommendations.ts`: deterministic dashboard recommendation
  generation and LLM recommendation reconciliation.
- `lib/dashboardInsights.ts`: fact generation for chart/insight support.
- `lib/vizPolicy.ts` and `lib/vizRules/`: deterministic chart, map, caveat,
  denominator, and accessibility guardrails.
- `lib/chartMetrics.ts`: aggregation and display-label logic.
- `lib/recommendationSchema.ts`: request validation, minimized profile
  payloads, model response sanitization.
- `lib/llmClient.ts`: server-side LLM request construction and fallback
  handling.
- `lib/copilotHandoff.ts`: server-side decision handoff summary construction
  and fallback handling.
- `lib/workflowExport.ts`: review-ready project kit export assembly.
- `lib/apiSecurity.ts`: request body limits, anonymous rate limiting, safety
  identifiers.
- `lib/entitlement/`: auth, entitlement, usage reservation, and safe AI event
  interfaces.
- `lib/db/`: metadata-only adapter boundary and server-only DB access.
- `lib/supabase/`: Supabase Auth helpers and middleware.
- `lib/coach/`: deterministic and quota-aware coach guidance.
- `lib/templates/`: metadata-only decision template handling.
- `lib/feedback/`: feedback validation and persistence boundary.
- `lib/adminMetrics/`: aggregate metadata reporting only.

Only use these cleaning transform types unless the task explicitly expands the
contract:

- `trim_whitespace`
- `normalize_empty_strings`
- `convert_numeric_strings`
- `convert_boolean_strings`

Cleaning must stay typed, row-preserving, and explainable. Do not add
imputation, row deletion, fuzzy matching, category recoding, or deduplication as
automatic cleaning behavior unless the user explicitly asks for that product
change and tests are updated.

## Auth, Entitlement, And Metadata Persistence

Supabase Auth and Supabase Postgres are the current approved default providers
for the controlled beta, but production credentials, migrations, deployment,
and admin allowlists still require explicit user approval.

Allowed persistence:

- `users` or `user_profiles`
- auth/account metadata
- `ai_usage_daily`
- `ai_events`
- `feedback`
- `custom_templates`
- `template_versions`
- non-sensitive eval/admin metadata

Forbidden persistence:

- uploaded raw files
- uploaded rows
- prepared rows
- full datasets
- exported reports or files
- full LLM request bodies
- full prompts
- prompts containing row-like values
- model responses containing row-like values
- secrets, API keys, service-role keys, private tokens, or sensitive operational
  data

Use server-only clients for privileged DB access. Never import `SUPABASE_SECRET_KEY`,
`DATABASE_URL`, `AUTH_SECRET`, `LLM_API_KEY`, or `OPENAI_API_KEY` into client
modules. Browser/client Supabase code may use only `NEXT_PUBLIC_SUPABASE_URL`
and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## AI And Privacy Rules

AI recommendations are optional and advisory. Deterministic profiling,
readiness checks, dashboard recommendations, caveats, and exports remain the
authority for workflow continuity.

Every AI path must:

1. Build deterministic fallback first.
2. Verify authentication when AI is requested.
3. Check entitlement and daily quota.
4. Return deterministic fallback on denial or failure.
5. Reserve quota only immediately before a provider call attempt.
6. Count attempted provider calls separately from successful responses.
7. Send minimized metadata, not full uploaded rows.
8. Call providers from the server only.
9. Validate and sanitize model output.
10. Record only safe metadata: provider/model/prompt version, fallback reason,
    attempted provider call, success/failure.

Fallback reasons must stay stable and typed. Preserve existing reason strings
such as `ai_disabled`, `unauthenticated`, `not_entitled`, `quota_exceeded`,
`missing_api_key`, `unsupported_provider`, `provider_rate_limit`,
`provider_unavailable`, `request_timeout`, `network_error`,
`model_response_invalid`, `model_response_truncated`, `invalid_request`,
`request_too_large`, and `app_rate_limit`.

Treat profile sample values and uploaded data as untrusted. Do not allow them
to act as prompts, HTML, formulas, or executable content.

CSV exports must continue neutralizing spreadsheet formulas.

## Configuration

Client/shared upload config lives in `lib/config.ts`.

Server-only recommendation and beta config lives in `lib/serverConfig.ts`.
Important environment variables include:

- `LLM_ENABLED`
- `LLM_API_KEY`
- `OPENAI_API_KEY`
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
- `AI_DAILY_QUOTA`
- `AI_BETA_ALLOWED_EMAILS`
- `AI_BETA_ALLOWED_USER_IDS`
- `AI_BETA_ALLOW_ALL_AUTHENTICATED`
- `AI_USAGE_STORE`
- `ADMIN_EMAILS`
- `ADMIN_USER_IDS`
- `AUTH_SECRET`
- `APP_BASE_URL`
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
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
enable AI or provider-backed storage only intentionally.

## Security And Runtime Headers

`next.config.ts` owns CSP and security headers. Current browser `connect-src`
allows self and approved Supabase endpoints. If a change adds browser-side
network calls or remote assets, update CSP intentionally and explain the need.

Do not weaken frame, object, referrer, or content-type protections as a
convenience fix.

## Samples

Browser sample loading uses `public/samples/`.

`data/samples/` is source/test-adjacent. Keep both locations in sync only when
the task requires it; do not assume one automatically feeds the other.

The public `/demo` route should use sample/synthetic data and deterministic mode
only. Do not expose arbitrary upload controls there unless the product decision
is explicitly changed.

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
- `npm run test` uses Vitest with `--configLoader runner`; keep that path
  because it avoids the Windows/Codex child-process startup failures seen with
  the default bundled config loader.
- `vitest.config.ts` uses the thread pool and disables file parallelism to
  reduce `spawn EPERM` risk in constrained local runs.
- There is no configured ESLint, Prettier, Playwright, Husky, or CONTRIBUTING
  workflow.

## Verification Expectations

For data parsing, profiling, joining, cleaning, recommendation-schema, LLM
fallback, rate-limit, export, chart metric, entitlement, DB adapter, auth,
feedback, template, coach, or admin-metadata changes:

```bash
npm run lint
npm run test
```

For UI, Next route, CSS, config, dependency, middleware, auth, or runtime
behavior changes:

```bash
npm run lint
npm run test
npm run build
```

For docs-only changes, at minimum run:

```bash
git diff --check
```

If user-facing workflow behavior changes, do a browser smoke pass with sample
data when practical. For auth-protected routes, verify redirect behavior when
real provider credentials are unavailable.

Before claiming a `spawn EPERM` result is environmental, check for stale
repo-local `next dev`, `next build`, `vitest`, or `.next` state. Do not broad
kill `node.exe`; target only repo-local process command lines.

## Contribution Rules

- Keep changes scoped to the requested product behavior.
- Use npm; do not add `pnpm-lock.yaml`, `yarn.lock`, or alternate
  package-manager metadata.
- Do not commit generated directories or build artifacts such as `node_modules/`,
  `.next/`, `dist/`, `coverage/`, or `*.tsbuildinfo`.
- Preserve deterministic fallback behavior when touching AI paths.
- Preserve strict response sanitization when touching LLM output handling.
- Preserve the session-only uploaded-data boundary.
- Add or update Vitest coverage when changing core pipeline, auth, entitlement,
  DB adapter, AI governance, feedback, template, privacy, or route behavior.
- Prefer small, explicit functions over broad abstractions.
- Keep UI copy honest about uncertainty, data quality, assumptions, and AI
  fallback status.
- Surface approval and review gates clearly instead of silently moving into
  production, migration, or provider-secret work.

## Decisions That Need User Approval

Ask before changing or executing:

- Production deployment or production environment variables.
- Production Supabase project configuration, redirect URLs, or email auth flow.
- SQL migrations or any production database mutation.
- Admin allowlist values or admin access policy.
- AI provider/model changes or adding provider-specific SDKs.
- Default daily quota policy if changing from `AI_DAILY_QUOTA=20`.
- Public demo behavior, especially upload visibility or anonymous AI messaging.
- Data retention automation.
- Any expansion of persistence beyond the approved metadata tables.

## Documentation Hygiene

When updating status or roadmap docs, distinguish:

- implemented local code
- locally verified behavior
- credential-dependent behavior not yet verified
- production/deployment work not performed
- user decisions still required

Do not let handoff packages, SQL drafts, or installed SDKs stand in for runtime
proof. Verify live repo behavior separately.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
