# Dashboard Copilot

Recommendation-first prototype for turning humanitarian and disaster response datasets into transparent dashboards.

## Project Documentation

Start with these documents if you are reviewing, submitting, or adapting the project:

- [Digital Public Good Guide](docs/digital-public-good-guide.md): plain-English overview, scope, extension guidance, starter prompts, and technical appendix.
- [Codex Starter Prompts](docs/codex-starter-prompts.md): copy-ready prompts for adapting the project to new decision-support contexts.
- [Showcase Script](docs/showcase-script.md): short demo path for explaining the workflow to a non-technical audience.
- [Repo-local Codex Skills](docs/copilot/): skills for visualization standards, bootstrapping another decision-support app, and adapting decision templates.

## Run Locally

Use Node.js `26.1.0` as pinned in `.tool-versions`, then install from the
lockfile:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

Run verification:

```bash
npm run lint
npm run test
npm run build
```

## Configuration

Upload limits and supported file types live in `lib/config.ts`.

Copy `.env.example` to `.env.local` for local development. The checked-in example defaults to deterministic-safe mode with `LLM_ENABLED=false`; set `LLM_ENABLED=true` and provide `LLM_API_KEY` only when you want server-side OpenAI calls enabled.

Optional server-only environment variables:

```bash
LLM_ENABLED=false
NEXT_PUBLIC_COPILOT_API_ENABLED=false
LLM_API_KEY=
LLM_PROVIDER=openai
LLM_MODEL=
LLM_WORKFLOW_MODEL=gpt-5.4-mini
LLM_DASHBOARD_MODEL=gpt-5.5
LLM_QUALITY_GUIDANCE_MODEL=gpt-5.4-mini
LLM_HANDOFF_MODEL=gpt-5.5
LLM_REQUEST_TIMEOUT_MS=15000
LLM_WORKFLOW_REQUEST_TIMEOUT_MS=15000
LLM_DASHBOARD_REQUEST_TIMEOUT_MS=45000
LLM_HANDOFF_REQUEST_TIMEOUT_MS=30000
LLM_MAX_COMPLETION_TOKENS=3200
MAX_UPLOAD_SIZE_MB=1
RECOMMEND_REQUEST_MAX_BYTES=200000
RECOMMEND_RATE_LIMIT_MAX_REQUESTS=20
RECOMMEND_RATE_LIMIT_WINDOW_MS=60000
RECOMMEND_MAX_PROFILES=4
RECOMMEND_MAX_COLUMNS_PER_PROFILE=80
RECOMMEND_MAX_SAMPLE_VALUES_PER_COLUMN=5
RECOMMEND_MAX_STRING_LENGTH=240
RECOMMEND_MAX_DASHBOARD_FACTS=14
RECOMMEND_MAX_SUMMARY_ITEMS=8
```

The browser never reads `LLM_API_KEY`. If the recommendation route cannot call an LLM, if `LLM_ENABLED=false`, or if a request exceeds the configured limits, the app falls back to deterministic recommendations. Static Codex Sites builds should keep `NEXT_PUBLIC_COPILOT_API_ENABLED=false` so the browser uses deterministic in-page recommendations instead of calling unavailable API routes.

AI copilot calls are routed server-side by task. Workflow harmonization and quality repair guidance default to the mini model because those tasks are bounded and schema-heavy. Dashboard synthesis and decision handoff summaries default to the full-size model because they require more judgment across readiness, caveats, and stakeholder-facing narrative. `LLM_MODEL` is still supported as a backward-compatible fallback when a task-specific model variable is omitted; task-specific variables take precedence.

`LLM_MAX_COMPLETION_TOKENS` controls the Responses API output-token budget for workflow harmonization, quality guidance, dashboard synthesis, and handoff summaries. Increase it if the app reports that the model response was truncated before the structured JSON finished.

`/api/recommend` and `/api/copilot` rate limits are anonymous and configurable. By default, each client IP bucket can make 20 recommendation or copilot requests per 60 seconds. Set `RECOMMEND_RATE_LIMIT_MAX_REQUESTS=0` to disable the in-memory limiter. For production deployments with multiple server instances, pair these settings with a hosting firewall or edge rate limit.

When LLM recommendations are on, the app sends minimized dataset profile metadata to the configured provider. This includes column names, inferred types, missingness, unique counts, and capped column sample values. Full uploaded rows are not sent to the LLM recommendation or handoff routes.

## Current Prototype Scope

- CSV and XLSX upload validation with a 1MB default limit.
- Bundled multi-dataset sample with needs assessment, population baseline, join coverage, trend, demographic, and quality-review signals.
- Deterministic profiling, join recommendations, dashboard recommendations, combined preparation/quality checks, and scoped preparation transformation logging.
- Vercel-compatible `/api/recommend` and `/api/copilot` routes for AI-assisted recommendations and export handoff summaries with configurable request limits and deterministic fallback.
- Workflow export page for CSV, PNG, PDF report, scoped transformation log JSON, and review-ready decision handoff exports.
- Vitest coverage for the core parsing, profiling, joining, dashboard, and recommendation-schema logic.
- Session-only operation with no login or project persistence.
