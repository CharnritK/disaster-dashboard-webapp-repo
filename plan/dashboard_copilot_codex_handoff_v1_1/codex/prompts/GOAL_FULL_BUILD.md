You are Codex acting as a senior product engineer for `CharnritK/disaster-dashboard-webapp-repo`.

Build the current Dashboard Copilot prototype into:

“Controlled authenticated AI beta with session-only uploaded data.”

## How this handoff should be used

This file is intended to be pasted after the user starts `/goal`.
Do not include another `/goal` line inside this file.

## Preflight: read the handoff pack before editing

Before editing code, read these handoff files if present:

- `HANDOFF_INDEX.md`
- `APPROVALS_TO_REVIEW.md`
- `CHANGELOG_v1.1.md`
- `docs/product_contract.md`
- `docs/architecture.md`
- `docs/data_model.md`
- `docs/quota_accounting_policy.md`
- `docs/security_supabase_rls.md`
- `docs/security/supabase_rls.md`
- `docs/prompt_versions.md`
- `docs/vercel_free_readiness.md`
- `docs/implementation_rules.md`
- `docs/roadmap.md`
- `codex/backlog.md`
- `codex/backlog.json`
- `qa/testing_strategy.md`
- `qa/review_gates.md`
- `qa/checklist.md`
- `evidence/repo_findings.md`
- `evidence/current_limitations.md`

Treat this file as controlling. Use the task cards for target files, tests, acceptance criteria, dependencies, risks, and stop conditions.

## Explicit approval block

Set these values before running.

```text
APPROVED_AUTH_PROVIDER=Supabase Auth
APPROVED_PERSISTENCE_PROVIDER=Supabase Postgres
APPROVED_DAILY_AI_QUOTA=20
APPROVED_ROOT_BEHAVIOR=/ redirects to /demo
APPROVED_ANONYMOUS_AI_VISIBILITY=none in /demo

APPROVED_PROVIDER_IMPLEMENTATION=true
APPROVED_SCHEMA_FILES=true
APPROVED_PREVIEW_DEPLOYMENT=true
APPROVED_PRODUCTION_DEPLOYMENT=false
APPROVED_PRODUCTION_MIGRATIONS=false
APPROVED_AI_PROVIDER_MODEL_CHANGES=false
APPROVED_DATA_RETENTION_AUTOMATION=false
APPROVED_OPEN_SIGNUP=false
APPROVED_BETA_ACCESS=named beta emails only
APPROVED_ADMIN_ACCESS=named admin emails only
```

If `APPROVED_PROVIDER_IMPLEMENTATION` is not `true`, stop after:

1. repo baseline;
2. deterministic env/docs cleanup;
3. provider decision records;
4. in-memory entitlement service and tests.

Never deploy, enter credentials, run production migrations, create production provider resources, or change production settings.

## Non-negotiable product contract

Production v1 is a controlled authenticated AI beta with session-only uploaded data.

Allowed persistent storage:

- users or user profile/account metadata;
- auth/account metadata;
- ai_usage_daily;
- ai_events;
- feedback;
- custom_templates;
- template_versions;
- non-sensitive eval metadata.

Forbidden persistent storage:

- uploaded raw files;
- uploaded rows;
- prepared rows;
- full datasets;
- exported reports/files;
- full LLM request bodies that may contain row-like values;
- full prompts;
- full model responses if they contain row-like values;
- secrets, API keys, private tokens, service-role keys, database URLs, auth secrets, or sensitive operational data.

Forbidden AI payload behavior:

- Do not send full uploaded rows to LLM routes.
- Do not persist full prompts.
- AI may use minimized profile, readiness, quality, transformation, and dashboard-fact summaries only.

## Deployment constraints

Target deployment is Vercel Free/Hobby.

Before changing runtime/build assumptions:

1. Check current official Vercel docs for Node.js runtime support.
2. Check current Hobby plan function limits.
3. Check environment variable support.
4. Check storage/provider options.
5. If docs cannot be checked, mark assumptions as `VERIFY_CURRENT_DOCS`.

If current Vercel docs cannot be checked:

- Do not hard-code Node runtime, function duration, or deployment settings.
- Continue local product implementation only if it does not depend on current Vercel limits.
- Mark deployment config as `VERIFY_CURRENT_DOCS`.
- Stop before merging deployment-specific config.

Optimize for low cost, low compute, no background workers, no long-running jobs, no queues, no WebSockets, no durable workflows, no long-lived server memory, and no server-side row storage.

## Existing repo facts to verify first

Verify these paths before editing:

- `package.json`
- `.tool-versions`
- `.env.example`
- `next.config.ts`
- `scripts/prepare-sites-dist.mjs`
- `app/page.tsx`
- `app/api/recommend/route.ts`
- `app/api/copilot/route.ts`
- `app/api/recommend/status/route.ts`
- `lib/apiSecurity.ts`
- `lib/serverConfig.ts`
- `lib/llmClient.ts`
- `lib/recommendations.ts`
- `lib/decisionContext.ts`
- `components/WorkflowComponents.tsx`
- `docs/AI_MODE.md`
- `README.md`

Do not invent file paths. If a file moved, report the actual path.

## Required implementation sequence

Work in small, testable steps. Do not start with a pretty login page. Start with entitlement and usage foundations.

### Phase 0 — Baseline and deterministic-safe cleanup

1. Inspect repo structure.
2. Run baseline commands:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
3. Report actual output.
4. Fix deterministic env defaults:
   - `LLM_ENABLED=false`
   - `NEXT_PUBLIC_COPILOT_API_ENABLED=false`
5. Add or update baseline Vitest tests if needed.
6. Do not add auth, DB, or UI route split yet.

### Phase 1 — Product contract and provider decision records

1. Update README/docs with the controlled authenticated AI beta contract.
2. Add auth provider decision record.
3. Add persistence provider decision record.
4. Document explicit approval flags and forbidden persistence.
5. Do not install provider SDKs unless `APPROVED_PROVIDER_IMPLEMENTATION=true`.

### Phase 2 — Vercel compatibility audit without hard-coding unverified assumptions

1. Check current official Vercel docs.
2. Add Vercel-compatible runtime/build config only after verification.
3. Make `distDir` conditional so Vercel can use default Next output.
4. Make static/Codex post-build script conditional.
5. If docs cannot be checked, keep deployment settings as `VERIFY_CURRENT_DOCS` and continue only local non-deployment product work.

### Phase 3 — Entitlement service interface first, no DB required

1. Implement usage date bucketing in Asia/Bangkok.
2. Implement daily quota checks.
3. Implement in-memory entitlement adapter for tests.
4. Implement typed denial/fallback reasons.
5. Implement provider-attempt reservation semantics.
6. Add unit tests before route integration.
7. Do not require Supabase, DB, or real auth yet.

Required service shape:

```text
checkAiEntitlement(userId, taskType)
reserveAiUsage(userId, localDate, taskType)
recordAiEvent(event)
markAiEventComplete(eventId, outcome)
getDailyUsage(userId, localDate)
```

### Phase 4 — AI route gating with auth abstraction/test identity

1. Add an auth abstraction/test identity helper.
2. Wrap `/api/recommend`.
3. Wrap `/api/copilot`.
4. Build deterministic fallback before any provider attempt.
5. If `useLlm !== true`, return fallback.
6. If unauthenticated, return fallback with `unauthenticated` and do not increment usage.
7. If not entitled, return fallback with `not_entitled` and do not increment usage.
8. If over quota, return fallback with `quota_exceeded` and do not increment usage.
9. If AI disabled or missing key, return fallback and do not increment usage.
10. If provider call will be attempted, reserve usage before the call.
11. Record non-sensitive `ai_event` metadata.
12. Keep existing deterministic fallback behavior and response shape.

### Phase 5 — Usage UI and fallback copy

1. Add `/api/usage` using the same auth abstraction.
2. Add usage meter in authenticated app shell or interim shell.
3. Display `used / limit`.
4. Show quota warning.
5. Show deterministic workflow-continuation copy when quota is exceeded.
6. Do not show AI usage meter or anonymous AI controls in public demo.

### Milestone checkpoint after T010

After the usage meter and route gating are stable, stop and report before starting any of these:

- provider SDK installation;
- Supabase Auth implementation;
- Supabase Postgres adapter implementation;
- large route split;
- AI coach;
- internal dashboard.

Continue only if:

- baseline commands pass;
- entitlement route tests pass;
- product contract still holds;
- changed files are reviewable in size;
- approval flags remain explicit.

### Phase 6 — Supabase Auth after approval

1. Use Supabase Auth only if `APPROVED_PROVIDER_IMPLEMENTATION=true` and `APPROVED_AUTH_PROVIDER=Supabase Auth`.
2. Do not build custom password storage.
3. Do not create an app-owned password table.
4. Map app user records to Supabase `auth.users(id)`.
5. Add server-side session helper.
6. Protect `/app/**`.
7. Keep `/demo` public and deterministic.
8. Do not request or handle credentials.

### Phase 7 — Supabase Postgres schema, RLS, and server-only DB adapter after approval

1. Use Supabase Postgres only if `APPROVED_PROVIDER_IMPLEMENTATION=true` and `APPROVED_PERSISTENCE_PROVIDER=Supabase Postgres`.
2. Add metadata-only schema files if `APPROVED_SCHEMA_FILES=true`.
3. Add RLS policy draft.
4. Add server-only DB client.
5. Do not run production migrations.
6. Do not expose service-role key to browser.
7. Do not add direct browser writes unless RLS tests/policy checks are present.
8. Do not add any row/file/report persistence method.

### Phase 8 — Persistent atomic usage ledger and event metadata

Quota policy:

- Count an AI assist when the server attempts a provider call.
- Use an atomic reserve operation before the provider call.
- Do not increment usage for deterministic fallback caused before provider call by unauthenticated, not_entitled, quota_exceeded, ai_disabled, missing_api_key, invalid_request, request_too_large, or app_rate_limit.
- Record `ai_events` for both provider attempts and denied/fallback requests.
- Store `attempted_provider_call` and `succeeded` separately.
- Do not double-count retries unless a new provider call is attempted.

Implementation requirements:

1. Persist `ai_usage_daily` through the approved adapter.
2. Persist `ai_events` with non-sensitive metadata only.
3. Use transactions/upserts for usage reserve.
4. Attach fallback reason to deterministic responses.
5. Add prompt/model version tracking source, such as `lib/ai/promptVersions.ts`.
6. Keep deterministic fallback working when AI is disabled, unavailable, rate-limited, over quota, missing provider key, or invalid.

### Phase 9 — Feedback and eval capture

1. Add feedback API.
2. Add feedback table adapter.
3. Validate tags server-side:
   - wrong chart
   - missing insight
   - bad template
   - data issue
   - too generic
   - unsafe recommendation
4. Add feedback UI after dashboard/export.
5. Capture non-sensitive metadata only.
6. Store model and prompt version identifiers, not prompt text.

### Phase 10 — Template Builder

1. Add reviewed/custom template architecture.
2. Add template tables and adapter methods.
3. Add first UI for `/app/templates` and `/app/templates/new`.
4. AI may advise but must not certify safety.
5. User custom templates are draft/private and untrusted until reviewed.

### Phase 11 — Route split and workspace IA

1. Split routes:
   - `/demo`
   - `/login`
   - `/app`
   - `/app/templates`
   - `/app/templates/new`
   - `/app/data`
   - `/app/prepare`
   - `/app/readiness`
   - `/app/dashboard`
   - `/app/export`
   - `/app/usage`
   - `/app/feedback`
2. Keep uploads session-only.
3. Preserve current workflow behavior.
4. Mobile must use tabs or bottom sheets.
5. Do not combine this route split with auth/entitlement in the same PR.

### Phase 12 — AI coach and internal eval dashboard

1. Add deterministic coach rail first.
2. Add AI augmentation only behind auth/quota.
3. Keep readiness deterministic and authoritative.
4. Add internal eval/usage dashboard for metadata only.
5. Do not add operational auto-approval or auto-escalation.

### Phase 13 — Vercel hardening and smoke tests

1. Add deployment docs and smoke tests.
2. Verify status endpoint returns safe public status only.
3. Verify AI disabled by default.
4. Verify fallback works without provider key.
5. Verify no uploaded rows are written to DB.
6. Do not deploy to production.

## Required Supabase security rules

If Supabase is implemented:

- Use Supabase `auth.users` as the source of identity.
- Create `public.users` or `public.user_profiles` with `id uuid primary key references auth.users(id)`.
- Enable RLS on every user-owned table.
- Use `auth.uid()` owner policies.
- Make `ai_usage_daily` and `ai_events` writable only by server routes, server-only adapters, or controlled RPC functions.
- Make reviewed templates read-only for normal users.
- Keep custom templates owner-scoped.
- Never import the service-role key into client components or browser-exposed modules.
- Add tests or SQL policy checks for owner isolation.

## Required prompt/model version tracking

Add a source of truth such as `lib/ai/promptVersions.ts`:

```ts
export const AI_PROMPT_VERSIONS = {
  workflow_harmonization: "workflow_harmonization.v1",
  dashboard_synthesis: "dashboard_synthesis.v1",
  decision_handoff_summary: "decision_handoff_summary.v1",
  quality_repair_guidance: "quality_repair_guidance.v1",
} as const;
```

Requirements:

- Every `ai_event` records `prompt_version`.
- Tests fail if an AI task lacks a prompt version.
- Prompt version changes require a changelog entry.
- Do not store prompt text in `ai_events`.

## Required tests

Add or update tests for:

- quota date bucketing;
- atomic daily usage reservation;
- daily usage increment;
- quota exceeded fallback;
- authenticated vs unauthenticated AI route behavior;
- deterministic fallback still works;
- no uploaded row persistence;
- no full prompt persistence;
- feedback tag validation;
- template version validation;
- model/prompt version event capture;
- invalid request body;
- missing provider API key;
- Supabase RLS policy/owner isolation checks if provider is implemented;
- service-role key never imported into client code;
- `/demo` no-login deterministic mode;
- `/app` login requirement for AI mode;
- usage meter display;
- quota exceeded warning;
- feedback capture;
- mobile layout sanity.

## Required commands

Run after each meaningful step:

```bash
npm run lint
npm run test
npm run build
```

Report actual outputs. Do not claim success unless commands actually ran.

## Stop conditions

Stop and ask for review if:

- current Vercel docs cannot be checked and a runtime/deployment setting would be hard-coded;
- provider defaults are not approved;
- a provider SDK would be installed without explicit approval;
- a production migration would be run;
- credentials are needed;
- implementation would persist uploaded rows;
- implementation would send full rows to the LLM;
- implementation would store full prompts;
- API keys or service-role keys would reach the browser;
- RLS or owner isolation cannot be defined for user-owned tables;
- deterministic mode breaks;
- tests cannot be run or baseline fails in unrelated code;
- scope expands into teams, billing, org admin, SSO, queues, workers, durable workflows, or saved projects.

## Final report required from Codex

At completion or stop, report:

1. Files changed.
2. Commands run with actual output.
3. Tests added.
4. Remaining risks.
5. Stop conditions triggered, if any.
6. Manual checks still needed.
7. Whether the product contract is preserved.
8. Whether uploaded rows remain session-only.
9. Whether provider keys remain server-only.
