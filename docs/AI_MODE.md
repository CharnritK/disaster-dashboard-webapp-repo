# AI Mode Configuration

AI mode is server-side. The browser only calls `/api/recommend`; the app route
then calls the configured LLM provider.

## Local Development

Use `.env.local` for local runs:

```bash
LLM_ENABLED=true
LLM_PROVIDER=openai
LLM_MODEL=gpt-5.4-mini
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

## Codex Sites

Local `.env.local` values are not the production runtime configuration for a
Codex Site. In Codex, open Sites, select this project, and add the same values
as hosted environment variables or secrets. Store API keys as secrets.

Required production values:

```bash
LLM_ENABLED=true
LLM_PROVIDER=openai
LLM_MODEL=gpt-5.4-mini
LLM_API_KEY=sk-...
```

After changing hosted environment values, redeploy the approved saved version so
the running site picks up the new runtime configuration.

Then check:

```text
https://<your-codex-site>/api/recommend/status
```

`hasApiKey` must be `true`. If it is `false`, the deployed site cannot use AI
mode yet, even if local `.env.local` is correct.

## Fallback Behavior

If the API key is missing, disabled, rate limited, timed out, or the model
response does not match the required schema, the app falls back to deterministic
recommendations. This is expected safety behavior, not proof that AI mode is
working.
