# AI Mode Configuration

## Route Surface

The AI workflow uses `/api/recommend` for workflow and dashboard recommendations and `/api/copilot` for decision handoff summaries. Status checks use `/api/recommend/status`. Provider calls remain server-side for all AI routes.

Deterministic mode is the default launch posture. Unset `LLM_ENABLED` and `NEXT_PUBLIC_COPILOT_API_ENABLED` values keep AI mode off. Set both to `true` only after the target environment has passed safety/privacy review or that gate has been explicitly deferred by the named owner.

AI mode is server-side. The browser calls the app's own routes, then those
routes call the configured LLM provider:

- `/api/recommend` for workflow harmonization and dashboard recommendations.
- `/api/copilot` for decision handoff summaries.

The browser must never receive `LLM_API_KEY` or provider credentials.

## Local Development

Use `.env.local` for reviewed AI-mode local runs:

```bash
LLM_ENABLED=true
NEXT_PUBLIC_COPILOT_API_ENABLED=true
LLM_PROVIDER=openai
LLM_WORKFLOW_MODEL=gpt-5.4-mini
LLM_DASHBOARD_MODEL=gpt-5.5
LLM_QUALITY_GUIDANCE_MODEL=gpt-5.4-mini
LLM_HANDOFF_MODEL=gpt-5.5
LLM_API_KEY=sk-...
```

`OPENAI_API_KEY` is also accepted. If both are set, `LLM_API_KEY` takes
precedence.

Run the app locally with:

```bash
npm run dev
```

Then check:

```text
http://localhost:3000/api/recommend/status
```

Expected result:

```json
{
  "llmEnabled": true,
  "provider": "openai",
  "model": "gpt-5.4-mini",
  "hasApiKey": true
}
```

The status endpoint reports the base fallback model. Task-specific model
variables can still route individual workflow, dashboard, quality-guidance, and
handoff tasks to different models.

## Codex Sites

Local `.env.local` values are not the production runtime configuration for a
Codex Site. In Codex, open Sites, select this project, and add the same values
as hosted environment variables or secrets. Store API keys as secrets.

Production values when enabling AI after safety/privacy review:

```bash
LLM_ENABLED=true
NEXT_PUBLIC_COPILOT_API_ENABLED=true
LLM_PROVIDER=openai
LLM_WORKFLOW_MODEL=gpt-5.4-mini
LLM_DASHBOARD_MODEL=gpt-5.5
LLM_QUALITY_GUIDANCE_MODEL=gpt-5.4-mini
LLM_HANDOFF_MODEL=gpt-5.5
LLM_API_KEY=sk-...
```

For controlled-beta production deployments, keep `LLM_ENABLED=false` and `NEXT_PUBLIC_COPILOT_API_ENABLED=false` unless AI has been explicitly approved for that environment.

For static Codex Sites builds without runtime API routes, keep
`NEXT_PUBLIC_COPILOT_API_ENABLED=false` so the browser uses deterministic
in-page recommendations instead of calling unavailable app routes.

After changing hosted environment values, redeploy the approved saved version so
the running site picks up the new runtime configuration.

Then check:

```text
https://your-codex-site.example/api/recommend/status
```

`hasApiKey` must be `true`. If it is `false`, the deployed site cannot use AI
mode yet, even if local `.env.local` is correct.

## Fallback Behavior

If the API key is missing, AI is disabled, a request is rate limited, a provider
times out, or the model response does not match the required schema, the app
falls back to deterministic recommendations or deterministic handoff summaries.
This is expected safety behavior, not proof that AI mode is working.

LLM requests use minimized profile, readiness, quality, transformation, and
dashboard-fact summaries. Full uploaded rows must not be sent to the
recommendation or handoff routes.
