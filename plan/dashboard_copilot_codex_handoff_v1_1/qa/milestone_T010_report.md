# Milestone T010 / T010A / T011 Checkpoint Report

Date: 2026-06-14

Verdict: `T011_AUTH_FOUNDATION_STAGING_VERIFIED`

This pass completed the safe first implementation milestone through T010/T010A, then continued into the explicitly approved T011 Supabase Auth foundation only. It still stops before persistent database adapters, route split, AI coach work, internal dashboards, production deployment, or production migrations.

## Continuation Update

After the initial T010A stop, the goal continuation proceeded with
credential-free review artifacts, public-route hardening, and then T011 auth
foundation work after confirming the approval flags still explicitly allowed
Supabase Auth provider wiring:

- T006/T006A draft artifacts now exist: `../../../db/schema.sql`,
  `../../../db/rls.sql`, `../../../db/README.md`, and
  `../../../lib/db/serverClient.ts`.
- T025 status endpoint hardening now removes raw provider, model, and API-key
  presence from the public status response.
- T027 deployment smoke artifacts now exist:
  `../../../docs/deployment-smoke-tests.md` and
  `../../../scripts/smoke-vercel.mjs`.
- T011 Supabase Auth foundation now exists:
  `../../../lib/supabase/env.ts`, `../../../lib/supabase/client.ts`,
  `../../../lib/supabase/server.ts`, `../../../lib/supabase/middleware.ts`,
  `../../../middleware.ts`, `../../../app/login/page.tsx`,
  `../../../app/auth/signin/route.ts`,
  `../../../app/auth/callback/route.ts`,
  `../../../app/auth/signout/route.ts`, `../../../app/app/page.tsx`, and
  `../../../app/demo/page.tsx`.
- No production migration was run.
- No production deployment was run.
- No DB adapter, persistent usage ledger, workflow route split, AI coach, or
  internal usage/eval dashboard was implemented.
- Supabase packages were already present in `package.json` before this pass;
  no provider SDK was installed during this continuation.

Current continuation validation:

- `node scripts/smoke-vercel.mjs --dry-run` - passed.
- `git diff --check` - passed with Windows line-ending warnings only.
- `npm run lint` - passed.
- `npm run test` - passed, 9 test files, 111 tests.
- `npm run build` - passed. Build emitted a non-fatal Edge Runtime warning from
  `@supabase/supabase-js` via the official `@supabase/ssr` middleware path.
- Browser smoke passed: `/login` rendered, unauthenticated `/app` redirected to
  `/login?next=%2Fapp`, `/` stayed public, and `/api/usage` returned 401 with
  `fallbackReason: "unauthenticated"`.

## Scope Completed

- Verified repo baseline before feature edits.
- Updated deterministic-safe environment and AI-mode documentation.
- Added current Vercel readiness notes and made Codex Sites post-build handling conditional outside Vercel.
- Added auth and persistence provider decision records.
- Added a test-only auth abstraction that is inactive outside `NODE_ENV=test`.
- Added in-memory entitlement, usage reservation, and safe AI event interfaces.
- Wrapped `/api/recommend` and `/api/copilot` provider attempts behind auth, entitlement, quota, provider-enable, provider-support, and key checks.
- Added `/api/usage` for daily AI usage status through the entitlement adapter.
- Added usage meter plumbing and quota/fallback copy without exposing it in the public deterministic demo path when the browser API switch is off.
- Added route/config/unit coverage for the new governance surfaces.
- Added Supabase Auth SSR helpers, magic-link sign-in route, auth callback,
  signout route, protected `/app` proof route, and middleware protection for
  `/app/**` only.

## Files Changed

Implementation:

- `.env.example`
- `README.md`
- `app/api/copilot/route.ts`
- `app/api/recommend/route.ts`
- `app/api/recommend/status/route.ts`
- `app/api/usage/route.ts`
- `app/app/page.tsx`
- `app/auth/callback/route.ts`
- `app/auth/signin/route.ts`
- `app/auth/signout/route.ts`
- `app/demo/page.tsx`
- `app/login/page.tsx`
- `app/page.tsx`
- `app/styles.css`
- `components/UsageMeter.tsx`
- `components/WorkflowComponents.tsx`
- `lib/auth/redirects.ts`
- `lib/auth/requestAuth.ts`
- `lib/entitlement/index.ts`
- `lib/supabase/client.ts`
- `lib/supabase/env.ts`
- `lib/supabase/middleware.ts`
- `lib/supabase/server.ts`
- `lib/serverConfig.ts`
- `lib/useAiUsage.ts`
- `middleware.ts`
- `next.config.ts`
- `package.json`
- `package-lock.json`
- `scripts/prepare-sites-dist.mjs`
- `types/recommendations.ts`

Docs:

- `docs/AI_MODE.md`
- `docs/decisions/auth-provider.md`
- `docs/decisions/persistence-provider.md`
- `docs/vercel_free_readiness.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/HANDOFF_INDEX.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/qa/challenger_closeout.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/qa/milestone_T010_report.md`

Tests:

- `tests/api-ai-governance.test.ts`
- `tests/auth-context.test.ts`
- `tests/config.test.ts`
- `tests/entitlement.test.ts`
- `tests/db-schema-boundary.test.ts`
- `tests/status-route.test.ts`
- `tests/supabase-auth.test.ts`
- `tests/usage-route.test.ts`

## Commands Run

Baseline before edits:

- `npm run lint` - passed.
- `npm run test` - passed, 1 test file, 79 tests.
- `npm run build` - passed.

After implementation:

- `npm run lint` - passed.
- `npm run test` - passed, 9 test files, 111 tests.
- `npm run build` - passed with the non-fatal Supabase middleware Edge Runtime
  warning described above.

Runtime smoke:

- Started `npm run dev -- --hostname 127.0.0.1 --port 3000`.
- Loaded `http://127.0.0.1:3000` through system Chrome headless at desktop `1440x1000` and mobile `390x844`.
- Both renders returned status 200, title `Dashboard Copilot`, first heading `Dashboard Copilot`, and no console or page errors.
- `GET /api/usage` without auth returned 401 with `fallbackReason: "unauthenticated"`.
- Stopped only the repo-local Next dev processes after smoke.

Auth continuation smoke:

- Started `npm run dev -- --port 3000`.
- Loaded `http://localhost:3000/login`; status 200 and heading `Sign in to Dashboard Copilot`.
- Loaded `http://localhost:3000/app`; browser landed on `http://localhost:3000/login?next=%2Fapp`.
- Loaded `http://localhost:3000/`; status 200 and public heading `Dashboard Copilot`.
- `/demo` is a public alias to the existing deterministic workflow. Root
  redirect behavior remains a later T019/T020 decision and was not changed.
- Loaded `http://localhost:3000/api/usage`; status 401 with `fallbackReason: "unauthenticated"`.
- Stopped only the repo-local Next dev server on port 3000.

## Product Contract Checks

- Uploaded row data remains session-only; no file, row, dashboard, or report persistence was added.
- AI remains optional and deterministic fallback remains the safe path.
- Provider attempts are gated before any LLM call.
- Pre-provider fallback for unauthenticated, not-entitled, quota-exceeded, disabled, missing-key, unsupported-provider, invalid-request, request-too-large, and app-rate-limit paths does not reserve quota.
- Provider usage is reserved immediately before a provider call attempt.
- Test identity is accepted only in `NODE_ENV=test`.
- Public demo behavior remains deterministic when `NEXT_PUBLIC_COPILOT_API_ENABLED=false`.
- Supabase Auth is now the real identity source when configured. API auth
  resolution uses verified Supabase claims; it does not trust raw cookie session
  objects.
- `/app/**` is protected; `/`, `/about`, `/demo`, and API fallback routes remain
  public.

## Privacy And Security Checks

- `LLM_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`, `AUTH_SECRET`, and `SUPABASE_SECRET_KEY` remain server-only configuration.
- Browser-exposed settings remain limited to `NEXT_PUBLIC_*` variables.
- `/api/usage` does not reveal another user's usage and rejects unauthenticated requests.
- Safe AI event records use metadata only; no raw uploaded rows or full prompts are persisted.
- No Supabase secret key, service-role key, or production credential was added.
- No database migration or production deployment was run.
- Client auth code uses only `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Import-boundary tests prevent client
  modules from referencing `SUPABASE_SECRET_KEY`, `DATABASE_URL`,
  `AUTH_SECRET`, `LLM_API_KEY`, or `OPENAI_API_KEY`.

## Current External-Docs Findings

- Vercel currently documents Node `24.x` as the default supported runtime, with `22.x` and `20.x` also available: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- Vercel Hobby/function-duration details vary by plan page and function-limit context, so this repo should not hard-code duration assumptions without preview validation: https://vercel.com/docs/plans/hobby and https://vercel.com/docs/limits
- Supabase RLS remains required for exposed-schema tables: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase secret keys are backend-only and bypass RLS; publishable keys are browser-safe but not authorization by themselves: https://supabase.com/docs/guides/getting-started/api-keys
- New Supabase public tables are no longer automatically exposed to Data/GraphQL APIs in current projects; explicit grants must be planned: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically

## Open Approvals

These remain blocked until human review passes this checkpoint:

- Add persistent Postgres/DB adapters.
- Add SQL migrations or run migrations.
- Add provider-specific AI SDKs.
- Split the workflow into `/demo` and `/app`.
- Add AI coach surfaces.
- Add internal eval or usage dashboards.
- Deploy to Vercel or mutate production configuration.

## Rollback Notes

- Revert the auth/entitlement route-gating changes together if the fallback shape becomes incompatible with downstream UI.
- Keep `.env.example` deterministic-safe if reverting route changes.
- If Vercel build behavior regresses, revert `next.config.ts` and `scripts/prepare-sites-dist.mjs` together because they jointly control local Codex Sites `dist` handling versus Vercel standard Next output.
- If the usage UI causes public-demo confusion, remove the `usageSlot` prop and `UsageMeter` mount while keeping `/api/usage` and entitlement tests.

## Follow-On Gate Update

The original T010A stop was satisfied by explicit user approval before T011+
work continued. As of 2026-06-14, the staging Supabase project, redirect URLs,
schema/RLS migration, Vercel preview environment, and approved beta/admin email
magic-link login have been validated for preview-only use.

Production deployment, production Supabase configuration, production
migrations, added beta/admin allowlist entries, anonymous AI, and retention
automation remain blocked until separately approved.
