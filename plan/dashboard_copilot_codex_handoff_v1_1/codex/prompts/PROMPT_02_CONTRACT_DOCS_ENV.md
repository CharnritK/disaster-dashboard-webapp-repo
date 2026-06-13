# Prompt 2 — Product Contract, Docs, and Env Cleanup

Use this prompt after baseline is stable.

## Copy-ready prompt

You are Codex working in `CharnritK/disaster-dashboard-webapp-repo`.

Goal: update docs and env defaults for the new product contract.

Contract:

Production v1 is a controlled authenticated AI beta with session-only uploaded data.

Allowed persistence:

- users or user_profiles
- auth/account metadata
- ai_usage_daily
- ai_events
- feedback
- custom_templates
- template_versions
- non-sensitive eval metadata

Forbidden persistence:

- uploaded files
- uploaded rows
- prepared rows
- full datasets
- exported reports/files
- full LLM request bodies with row-like values
- full prompts
- secrets, API keys, service-role keys, private tokens, or sensitive operational data

Tasks:

1. Update `README.md` with:
   - product contract
   - persistence boundary
   - AI governance
   - Supabase security boundary if approved
   - Vercel deployment boundary
2. Update `docs/AI_MODE.md` with authenticated AI beta behavior.
3. Update `.env.example`:
   - `LLM_ENABLED=false`
   - `NEXT_PUBLIC_COPILOT_API_ENABLED=false`
   - add empty placeholders for auth and DB variables
4. Add docs for review gates and decisions requiring approval.
5. Add quota policy language:
   - provider attempts count;
   - atomic reserve before provider call;
   - deterministic denial/fallback before provider call does not consume quota.
6. Run:
   - `npm run lint`
   - `npm run test`
   - `npm run build`

Do not implement auth, DB, route changes, provider SDKs, or migrations.
