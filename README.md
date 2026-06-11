# Dashboard Copilot

Recommendation-first prototype for turning humanitarian and disaster response datasets into transparent dashboards.

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

Optional server-only environment variables:

```bash
LLM_ENABLED=true
LLM_API_KEY=
LLM_PROVIDER=openai
LLM_MODEL=gpt-5.4-mini
LLM_REQUEST_TIMEOUT_MS=15000
LLM_WORKFLOW_REQUEST_TIMEOUT_MS=15000
LLM_DASHBOARD_REQUEST_TIMEOUT_MS=45000
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

The browser never reads `LLM_API_KEY`. If the recommendation route cannot call an LLM, if `LLM_ENABLED=false`, or if a request exceeds the configured limits, the app falls back to deterministic recommendations.

`LLM_MAX_COMPLETION_TOKENS` controls the completion budget for both workflow harmonization recommendations and dashboard visualization recommendations. Increase it if the app reports that the LLM response was truncated before the structured JSON finished.

`/api/recommend` rate limits are anonymous and configurable. By default, each client IP bucket can make 20 recommendation requests per 60 seconds. Set `RECOMMEND_RATE_LIMIT_MAX_REQUESTS=0` to disable the in-memory limiter. For production deployments with multiple server instances, pair these settings with a hosting firewall or edge rate limit.

When LLM recommendations are on, the app sends minimized dataset profile metadata to the configured provider. This includes column names, inferred types, missingness, unique counts, and capped column sample values. Full uploaded rows are not sent to the LLM recommendation route.

## Current Prototype Scope

- CSV and XLSX upload validation with a 1MB default limit.
- Bundled multi-dataset sample with needs assessment, population baseline, join coverage, trend, demographic, and quality-review signals.
- Deterministic profiling, join recommendations, dashboard recommendations, combined preparation/quality checks, and scoped preparation transformation logging.
- Vercel-compatible `/api/recommend` route for AI-assisted recommendations with configurable request limits and deterministic fallback.
- Workflow export page for CSV, PNG, PDF report, and scoped transformation log JSON exports.
- Vitest coverage for the core parsing, profiling, joining, dashboard, and recommendation-schema logic.
- Session-only operation with no login or project persistence.
