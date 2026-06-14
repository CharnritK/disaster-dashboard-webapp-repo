# Codex Task Backlog v1.1

Status as of 2026-06-14: this is the historical execution backlog for the
controlled-beta build. T001-T030 are implemented for local/reviewable paths,
and staging Supabase-backed magic-link login was previously user-confirmed.
Current T031 recheck blocks at `error=auth_failed`. Do not use this file as
the next active task list without first checking
`../qa/final_goal_status.md` and
`../qa/t031_staging_beta_validation_2026-06-14.md`.

Original execution rule: use tasks in order. The first milestone ends after
T010A so a human can review before provider SDKs, route split, AI coach,
internal dashboard work, or deployment-specific config.

---

## T001 — Verify repo, build, and test baseline
Owner: Repo Cartographer

Goal: Confirm current repo structure and command baseline before feature work.

Target files:
- `package.json`
- `.tool-versions`
- `.env.example`
- `next.config.ts`
- `app/page.tsx`
- `app/api/**`
- `lib/**`
- `components/**`

Implementation notes:
- `List actual paths before editing.`
- `Run baseline commands and capture actual output.`
- `Do not start feature work in this task.`
- `Add a baseline Vitest smoke test only if the runner has no tests and test command otherwise fails due no tests.`

Acceptance criteria:
- `Repo map is documented.`
- `Actual command output is captured.`
- `No auth/DB/UI feature work is started.`

Tests:
- `No feature tests.`
- `Baseline smoke test only if needed.`

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No auth.`
- `No DB.`
- `No route split.`

Dependencies: None

Risk: Low

Stop condition: Stop if repo files differ materially from handoff or baseline fails for unrelated reasons.

---

## T002 — Fix deterministic env defaults and docs mismatch
Owner: Product Contract Editor

Goal: Make checked-in defaults deterministic-safe.

Target files:
- `.env.example`
- `README.md`
- `docs/AI_MODE.md`

Implementation notes:
- `Set LLM_ENABLED=false and NEXT_PUBLIC_COPILOT_API_ENABLED=false in examples.`
- `Add placeholders for DATABASE_URL, AUTH_SECRET/SUPABASE env vars only as empty placeholders.`
- `Document that secrets are server-side only.`

Acceptance criteria:
- `Defaults disable AI.`
- `Docs match env file.`
- `Provider keys are not present or suggested as literal values.`

Tests:
- `Existing tests only.`

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No provider SDK install.`
- `No auth implementation.`

Dependencies: T001

Risk: Low

Stop condition: Stop if docs contradict the product contract.

---

## T003 — Add Vercel-compatible runtime and build config
Owner: Vercel Deployment Auditor

Goal: Remove repo-level build blockers for Vercel Free/Hobby without inventing current Vercel facts.

Target files:
- `package.json`
- `.tool-versions`
- `next.config.ts`
- `scripts/prepare-sites-dist.mjs`
- `README.md`
- `docs/vercel_free_readiness.md`

Implementation notes:
- `Verify current official Vercel docs before hard-coding Node/runtime/function settings.`
- `If docs cannot be checked, mark settings VERIFY_CURRENT_DOCS and continue only non-deployment-dependent local work.`
- `Make Vercel path use standard Next output.`
- `Make static/Codex post-build script conditional.`

Acceptance criteria:
- `Vercel-specific assumptions are either verified or marked VERIFY_CURRENT_DOCS.`
- `Static/Codex build path remains conditional.`
- `Local build passes.`

Tests:
- `Add config test only if repo already has config tests.`

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No production deployment.`
- `No production setting changes.`

Dependencies: T001, T002

Risk: Medium

Stop condition: Stop before merging deployment-specific config if current Vercel docs cannot be checked.

---

## T004 — Add auth provider decision record
Owner: Auth & Entitlement Engineer

Goal: Document provider choice before implementation.

Target files:
- `docs/decisions/auth-provider.md`

Implementation notes:
- `Compare Supabase Auth default with at least one alternative.`
- `State explicit approval flags.`
- `Document no custom password storage if Supabase Auth is used.`

Acceptance criteria:
- `Decision record exists.`
- `Provider default is clear.`
- `Approval gate is explicit.`

Tests:
- `No code tests.`

Commands:
- None

Non-goals:
- `No provider SDK install.`
- `No login UI.`

Dependencies: T002

Risk: Low

Stop condition: Stop before provider SDK install if approval missing.

---

## T005 — Add persistence provider decision record
Owner: Persistence Engineer

Goal: Document DB provider before implementation.

Target files:
- `docs/decisions/persistence-provider.md`

Implementation notes:
- `Compare Supabase Postgres default with at least one external managed Postgres alternative.`
- `State metadata-only persistence boundary.`
- `Call out no row/file/report storage.`

Acceptance criteria:
- `Decision record exists.`
- `Default provider is clear.`
- `Approval gate is explicit.`

Tests:
- `No code tests.`

Commands:
- None

Non-goals:
- `No provider SDK install.`
- `No migrations.`

Dependencies: T002

Risk: Low

Stop condition: Stop before provider SDK install if approval missing.

---

## T007 — Add usage entitlement service interface and test auth abstraction
Owner: AI Governance Engineer

Goal: Make quota logic and authenticated/anonymous route tests possible before provider or DB integration.

Target files:
- `lib/entitlement/**`
- `lib/auth/** or test auth abstraction`
- `tests/entitlement.test.ts`
- `tests/auth-context.test.ts`

Implementation notes:
- `Implement Asia/Bangkok date bucketing.`
- `Expose checkAiEntitlement, reserveAiUsage, recordAiEvent, and markAiEventComplete interfaces.`
- `Start with in-memory adapter.`
- `Add test identity support that cannot be trusted in production.`
- `Do not require Supabase or a real DB.`

Acceptance criteria:
- `Unit tests pass.`
- `No DB dependency.`
- `No provider SDK dependency.`
- `Quota deny reasons are typed.`
- `Authenticated/anonymous route tests can use a safe abstraction.`

Tests:
- date bucket
- first use
- `reserve/increment`
- quota exceeded
- different users
- provider-attempt counted only after reserve
- test identity only works in test mode

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No provider SDK.`
- `No route wiring.`

Dependencies: T001, T002

Risk: Medium

Stop condition: Stop if date bucketing or test identity would weaken production auth.

---

## T008 — Wrap /api/recommend with entitlement and quota check
Owner: Auth & Entitlement Engineer

Goal: Gate AI attempts while preserving deterministic fallback.

Target files:
- `app/api/recommend/route.ts`
- `lib/entitlement/**`
- `lib/auth/** or test auth abstraction`
- `tests/api-recommend.test.ts`

Implementation notes:
- `Build deterministic fallback first.`
- `Use auth abstraction/test identity before Supabase integration.`
- `If unauthenticated or over quota, return deterministic fallback with reason and do not reserve usage.`
- `Reserve usage atomically only before a provider call attempt.`
- `Record safe event metadata.`

Acceptance criteria:
- `Deterministic mode unchanged.`
- `Unauth AI request returns fallback.`
- `Over-quota AI request returns fallback.`
- `Provider attempts are counted with reserve.`
- `Missing key does not consume quota.`

Tests:
- unauth useLlm true
- auth under quota
- auth over quota
- missing key
- invalid body
- deterministic fallback shape preserved

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No Supabase session required yet.`
- `No full prompt persistence.`

Dependencies: T007

Risk: Medium

Stop condition: Stop if fallback shape cannot be preserved.

---

## T009 — Wrap /api/copilot with entitlement and quota check
Owner: Auth & Entitlement Engineer

Goal: Gate handoff summaries while preserving fallback.

Target files:
- `app/api/copilot/route.ts`
- `lib/entitlement/**`
- `lib/auth/** or test auth abstraction`
- `tests/api-copilot.test.ts`

Implementation notes:
- `Apply same pattern as /api/recommend.`
- `Do not consume quota for unauthenticated, over-quota, missing-key, invalid-request, or deterministic-mode fallback before provider call.`
- `Record safe events.`

Acceptance criteria:
- `Unauth AI returns fallback.`
- `Over-quota returns fallback.`
- `Deterministic handoff still works.`
- `Provider attempts are reserved/countable.`

Tests:
- auth under quota
- over quota
- unauth
- missing key
- invalid body

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No Supabase session required yet.`

Dependencies: T007, T008

Risk: Medium

Stop condition: Stop if fallback object lacks reason field.

---

## T010 — Add usage meter and fallback copy
Owner: Workspace IA Engineer

Goal: Show daily AI usage in authenticated app shell or interim shell without breaking demo.

Target files:
- `components/UsageMeter.tsx`
- `lib/useAiUsage.ts`
- `app/api/usage/route.ts`
- `app/page.tsx or new app shell`

Implementation notes:
- `Add usage endpoint backed by entitlement adapter.`
- `Render used / limit.`
- `Show quota exceeded copy and deterministic-continuation message.`
- `Hide in /demo or render CTA-only.`
- `This is the milestone checkpoint task. After completion, stop and report before provider SDK install, route split, AI coach, or internal dashboard work.`

Acceptance criteria:
- `Authenticated UI shows usage.`
- `Quota warning appears.`
- `Demo remains deterministic.`
- `Fallback copy is clear.`
- `Milestone checkpoint report lists changed files, commands run, tests added, product-contract checks, privacy checks, and open approvals.`

Tests:
- hook render
- usage API
- manual UI check

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No route split.`
- `No provider SDK install.`

Dependencies: T007, T008, T009

Risk: Low

Stop condition: Stop after T010 for human review before provider SDK install, route split, AI coach, or internal dashboard.

---

## T010A — Milestone checkpoint before provider SDKs or large refactors
Owner: QA/Test Engineer + Security/Privacy Reviewer

Goal: Prevent one-shot Codex execution from turning into an unsafe giant PR.

Target files:
- `qa/milestone_T010_report.md`
- `qa/challenger_closeout.md`
- `HANDOFF_INDEX.md`

Implementation notes:
- `Summarize files changed, commands run, tests added, product-contract checks, privacy checks, and rollback notes.`
- `Confirm explicit approval flags remain true before continuing.`
- `Do not install provider SDKs before this checkpoint passes.`

Acceptance criteria:
- `Checkpoint report exists.`
- `Baseline commands are reported with actual output.`
- `Entitlement route tests pass or blockers are documented.`
- `No forbidden persistence introduced.`
- `No provider SDKs, route split, AI coach, internal dashboard, or deployment-specific config has started.`

Tests:
- `No new code tests unless checkpoint detects missing coverage.`

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No new feature work.`
- `No provider SDK installation.`

Dependencies: T010

Risk: High

Stop condition: Stop before provider SDKs, route split, AI coach, internal dashboard, or deployment-specific config unless checkpoint passes.

---

## T011 — Implement Supabase auth integration after explicit approval
Owner: Auth & Entitlement Engineer

Goal: Add real auth after T010 checkpoint and approval.

Target files:
- `lib/auth/**`
- `middleware.ts`
- `app/login/**`
- `app/auth/**`
- `app/app/**`

Implementation notes:
- `Proceed only if APPROVED_PROVIDER_IMPLEMENTATION=true and APPROVED_AUTH_PROVIDER=Supabase Auth.`
- `Use Supabase Auth as identity source.`
- `Do not build custom password storage.`
- `Map profile id to auth.users(id).`
- `Protect /app/**; keep /demo public.`
- `Do not proceed unless explicit approval flags remain true.`
- `Do not create an app-owned password table.`

Acceptance criteria:
- `Login works in dev when env vars are configured.`
- `/demo public.`
- `/app protected.`
- `API routes can resolve user.`
- `No provider secrets exposed to browser.`
- `No custom password table exists.`

Tests:
- auth helper
- route guard
- manual login

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No production auth config changes.`
- `No custom password table.`

Dependencies: T010A

Risk: High

Stop condition: Stop if provider env/credentials are needed or approval flags are not explicit.

---

## T006 — Draft metadata-only database schema
Owner: Persistence Engineer

Goal: Add schema draft for approved tables without running production migrations.

Target files:
- `db/schema.sql`
- `docs/data_model.md`

Implementation notes:
- `Create SQL/schema draft for users/user_profiles, ai_usage_daily, ai_events, feedback, custom_templates, and template_versions.`
- `Map app profiles to auth.users if Supabase remains approved.`
- `Document forbidden persistence in schema comments.`

Acceptance criteria:
- `Schema draft exists.`
- `Forbidden data is documented.`
- `No production migration is run.`

Tests:
- `Schema validation if tooling exists.`
- `Static review if no schema tooling exists.`

Commands:
- `npm run lint`
- `npm run test`

Non-goals:
- `No production DB writes.`
- `No provider SDK install unless explicitly approved.`

Dependencies: T004, T005, T010A

Risk: Medium

Stop condition: Stop before migration execution or if schema requires storing forbidden data.

---

## T006A — Add Supabase RLS policy draft and server-only DB access rules
Owner: Persistence Engineer

Goal: Prevent insecure provider integration by defining RLS, auth.users mapping, and service-key boundaries before real DB code.

Target files:
- `db/rls.sql`
- `db/README.md`
- `docs/security_supabase_rls.md`
- `lib/db/serverClient.ts or verified equivalent`

Implementation notes:
- `Enable RLS on user-owned tables in SQL draft.`
- `Use auth.uid() owner policies.`
- `Make ai_events/ai_usage writes server-controlled.`
- `Document service-role key must never be imported into client modules.`
- `Reviewed templates are read-only to normal users; custom templates are owner-scoped.`

Acceptance criteria:
- `RLS policy draft exists.`
- `Owner isolation rules are explicit.`
- `Server-only DB client boundary is documented.`
- `No client-side service-role key import path exists.`

Tests:
- `Add policy checks if Supabase local/test tooling exists.`
- `Add static import guard test for service-role key helper if feasible.`

Commands:
- `npm run lint`
- `npm run test`

Non-goals:
- `No production migration.`
- `No direct browser writes unless policies are tested.`

Dependencies: T006

Risk: High

Stop condition: Stop before provider integration if RLS ownership rules cannot be defined.

---

## T012 — Implement metadata DB adapter after explicit approval
Owner: Persistence Engineer

Goal: Connect approved Postgres provider safely while preserving metadata-only boundary.

Target files:
- `lib/db/**`
- `db/**`
- `tests/db-adapter.test.ts`

Implementation notes:
- `Proceed only after T006A and explicit approval.`
- `Use server-only DB client for privileged access.`
- `Adapter supports required tables only.`
- `No row persistence method may exist.`

Acceptance criteria:
- `Adapter supports required metadata tables.`
- `Tests use memory or test DB.`
- `No upload persistence API exists.`
- `Service-role key is server-only.`

Tests:
- CRUD metadata
- no row persistence method
- error handling
- server-only import guard if feasible

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No production DB writes.`
- `No direct browser writes without RLS tests.`

Dependencies: T006A, T011

Risk: High

Stop condition: Stop before production DB writes or if server-only key handling is unclear.

---

## T014 — Add prompt/model version registry and safe AI event metadata
Owner: AI Governance Engineer

Goal: Track model/prompt metadata without sensitive prompt content.

Target files:
- `lib/ai/promptVersions.ts`
- `lib/llmClient.ts`
- `lib/serverConfig.ts`
- `types/**`
- `tests/ai-events.test.ts`

Implementation notes:
- `Create AI_PROMPT_VERSIONS source of truth.`
- `Every AI task must map to a prompt version.`
- `Events include prompt_version, model, provider, fallback reason, attempted_provider_call, succeeded.`
- `Never store full prompt text.`

Acceptance criteria:
- `Events include prompt/model versions.`
- `Tests fail if an AI task lacks prompt_version.`
- `No raw request body or full prompt persisted.`

Tests:
- event metadata
- prompt version coverage
- no prompt persistence

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No model/provider changes without approval.`
- `No prompt registry UI.`

Dependencies: T010A

Risk: Medium

Stop condition: Stop if event payload includes user data, full prompts, or row-like values.

---

## T013 — Persist ai_usage_daily and ai_events with atomic reserve
Owner: AI Governance Engineer

Goal: Move usage/event logging from memory to DB adapter using provider-attempt accounting.

Target files:
- `lib/entitlement/**`
- `lib/usage/**`
- `lib/db/**`
- `tests/usage-db.test.ts`

Implementation notes:
- `Reserve usage before provider call.`
- `Count provider attempts, not just successes.`
- `Do not increment for unauthenticated, not_entitled, quota_exceeded, ai_disabled, missing_api_key, invalid_request, or request_too_large.`
- `Record attempted_provider_call and succeeded separately.`

Acceptance criteria:
- `Usage rows upsert correctly.`
- `Event rows store safe metadata.`
- `Denied fallback does not increment.`
- `Provider attempt increments/reserves.`

Tests:
- upsert
- `atomic reserve/concurrent if feasible`
- privacy guard
- denied fallback no increment

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No full prompt or row persistence.`

Dependencies: T012, T014

Risk: High

Stop condition: Stop if transaction/reservation semantics are unsafe.

---

## T015 — Add feedback API route
Owner: Eval & Feedback Engineer

Goal: Persist first eval signals.

Target files:
- `app/api/feedback/route.ts`
- `lib/feedback/**`
- `types/feedback.ts`
- `tests/feedback-api.test.ts`

Implementation notes:
- `Validate allowed tags server-side.`
- `Require auth unless explicitly using safe demo no-op.`
- `Limit comment length.`
- `Reject row-like payloads.`

Acceptance criteria:
- `Valid feedback saves.`
- `Invalid tags rejected.`
- `Unauth request rejected or safe fallback.`
- `No row data accepted.`

Tests:
- tag validation
- comment length
- auth check
- row-like payload rejected

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No internal eval dashboard.`

Dependencies: T013

Risk: Medium

Stop condition: Stop if comments need sensitive-data scanning beyond length/copy controls.

---

## T016 — Add feedback UI after dashboard and export
Owner: Eval & Feedback Engineer

Goal: Capture thumbs and tags in workflow.

Target files:
- `components/FeedbackForm.tsx`
- `components/WorkflowComponents.tsx`
- `app/**`

Implementation notes:
- `Render thumbs up/down, allowed tags, optional comment.`
- `Warn users not to include sensitive data.`
- `Post to feedback API.`
- `Show success/error states.`

Acceptance criteria:
- `User can submit feedback.`
- `Success/error states render.`
- `No demo-only noise.`

Tests:
- component validation
- manual export flow

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No AI suggestion editing tracking yet.`

Dependencies: T015

Risk: Low

Stop condition: Stop if UI target changes in route split.

---

## T017 — Add template API routes
Owner: Template Builder Engineer

Goal: Create metadata-only template CRUD.

Target files:
- `app/api/templates/route.ts`
- `app/api/templates/[id]/route.ts`
- `lib/templates/**`
- `types/templates.ts`
- `tests/templates-api.test.ts`

Implementation notes:
- `Store user templates as draft/private by default.`
- `Reviewed templates are read-only to normal users.`
- `Validate template fields.`
- `Do not store example rows.`

Acceptance criteria:
- `Create draft works.`
- `Update draft works.`
- `Official/reviewed template cannot be edited by user.`
- `Versions validate.`

Tests:
- create
- update
- owner guard
- version validation
- example row rejection

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No admin approval UI.`

Dependencies: T012

Risk: Medium

Stop condition: Stop if template schema conflicts with existing decision types.

---

## T018 — Build first Template Builder UI
Owner: Template Builder Engineer

Goal: Let users create private draft templates.

Target files:
- `app/app/templates/page.tsx`
- `app/app/templates/new/page.tsx`
- `components/TemplateBuilder.tsx`

Implementation notes:
- `Build form for decision question, intended action, decision-maker, geography/timeframe, required evidence, suggested fields, caveats, example schema.`
- `AI may advise later but must not certify safety.`

Acceptance criteria:
- `Draft form saves.`
- `List shows user drafts and reviewed templates.`
- `Validation errors render.`

Tests:
- component validation
- manual save flow

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No official approval workflow.`

Dependencies: T017

Risk: Medium

Stop condition: Stop if route structure not split yet.

---

## T019 — Create /demo public deterministic route
Owner: Workspace IA Engineer

Goal: Separate public demo from authenticated workspace.

Target files:
- `app/demo/page.tsx`
- `app/page.tsx`
- `components/**`

Implementation notes:
- `Use sample/synthetic data only.`
- `Force deterministic mode.`
- `Add sign-in CTA for AI-assisted workflow.`
- `Do not require auth.`

Acceptance criteria:
- `/demo loads without auth.`
- `Only deterministic mode.`
- `CTA present.`

Tests:
- manual demo flow
- route render if test infra exists

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No route split beyond demo/root.`

Dependencies: T010

Risk: Medium

Stop condition: Stop if app/page state extraction is too large for PR.

---

## T020 — Create authenticated /app shell
Owner: Workspace IA Engineer

Goal: Add protected app layout with usage meter.

Target files:
- `app/app/layout.tsx`
- `app/app/page.tsx`
- `components/AppShell.tsx`

Implementation notes:
- `Protect /app via auth middleware/helper.`
- `Show usage meter.`
- `Keep workflow starting point stable.`
- `Do not move every step yet.`

Acceptance criteria:
- `/app requires login.`
- `Usage meter appears.`
- `Workflow still starts.`

Tests:
- route guard
- manual app flow

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No full workflow route split.`

Dependencies: T011, T010

Risk: Medium

Stop condition: Stop if auth session unavailable.

---

## T021 — Split workflow step routes
Owner: Workspace IA Engineer

Goal: Move monolithic page into operational pages after auth/entitlement is stable.

Target files:
- `app/app/data/page.tsx`
- `app/app/prepare/page.tsx`
- `app/app/readiness/page.tsx`
- `app/app/dashboard/page.tsx`
- `app/app/export/page.tsx`
- `components/workflow/**`

Implementation notes:
- `Do not combine with auth/entitlement PR.`
- `Preserve existing behavior.`
- `Keep uploaded data in session/client state.`
- `Add mobile tabs or bottom sheets rather than one giant stacked page.`

Acceptance criteria:
- `Step navigation works.`
- `State persists within session.`
- `Mobile not one stacked report.`
- `Deterministic fallback still works.`

Tests:
- manual full flow
- component smoke tests
- mobile sanity check

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No AI coach.`
- `No saved projects.`

Dependencies: T011, T013, T020

Risk: High

Stop condition: Stop if route split would combine with auth/entitlement changes or risk session-only uploads.

---

## T022 — Add deterministic AI coach rail
Owner: AI Coach Engineer

Goal: Provide right-rail guidance without AI call dependency.

Target files:
- `components/AiCoachPanel.tsx`
- `lib/coach/**`
- `components/AppShell.tsx`

Implementation notes:
- `Generate deterministic hints by step.`
- `Do not call provider.`
- `Do not override deterministic readiness.`
- `Keep hints concise and caveated.`

Acceptance criteria:
- `Coach hints appear per step.`
- `No provider calls.`
- `No raw rows sent.`
- `Readiness remains authoritative.`

Tests:
- coach hint unit tests
- component render

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No chat agent.`
- `No AI augmentation.`

Dependencies: T021

Risk: Low

Stop condition: Stop if guidance contradicts readiness logic.

---

## T023 — Add quota-aware AI coach augmentation
Owner: AI Coach Engineer

Goal: Allow authenticated AI hints under quota without overriding deterministic coach.

Target files:
- `lib/coach/**`
- `app/api/recommend/route.ts or dedicated coach route`
- `components/AiCoachPanel.tsx`

Implementation notes:
- `AI coach only behind auth/quota.`
- `Fallback to deterministic hints on quota/provider failure.`
- `Record events with prompt versions.`
- `Never send row-like values.`

Acceptance criteria:
- `AI coach only when auth/quota valid.`
- `Quota exceeded keeps deterministic hints.`
- `Events logged safely.`

Tests:
- under quota
- over quota
- unauth
- row-like payload guard

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No autonomous decisions.`
- `No readiness override.`

Dependencies: T022, T013, T014

Risk: Medium

Stop condition: Stop if prompt would include row-like values.

---

## T024 — Add internal eval and usage dashboard
Owner: AI Governance Engineer

Goal: Show aggregate usage and feedback to admins using metadata only.

Target files:
- `app/app/usage/page.tsx`
- `app/admin/**`
- `lib/adminMetrics/**`

Implementation notes:
- `Aggregate usage, fallback reasons, feedback tags, templates.`
- `Protect with admin role.`
- `Do not display row data or full prompts.`

Acceptance criteria:
- `Admins see usage, fallbacks, tags.`
- `Users cannot access admin view.`
- `No row data shown.`

Tests:
- admin guard
- query functions
- metadata-only checks

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No export of eval data.`
- `No saved datasets.`

Dependencies: T015, T013

Risk: Medium

Stop condition: Stop if dashboard could expose user data or row-like metadata.

---

## T025 — Harden status endpoint
Owner: Security/Privacy Reviewer

Goal: Ensure public status is safe.

Target files:
- `app/api/recommend/status/route.ts`
- `tests/status-route.test.ts`

Implementation notes:
- `Return safe status only.`
- `Do not expose raw provider key presence if product owner decides this is sensitive.`
- `Keep Cache-Control no-store.`

Acceptance criteria:
- `No secret fields.`
- `Cache-Control no-store.`
- `Tests pass.`

Tests:
- safe status
- no secret

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No AI provider behavior changes.`

Dependencies: T001

Risk: Low

Stop condition: Stop if product owner wants model/provider hidden.

---

## T026 — Add privacy guard tests for no uploaded row persistence
Owner: Security/Privacy Reviewer

Goal: Prevent future row persistence regressions.

Target files:
- `tests/privacy-no-row-persistence.test.ts`
- `lib/db/**`
- `lib/llmClient.ts`

Implementation notes:
- `Test DB adapter has no raw row persistence methods.`
- `Test event metadata rejects row-like arrays.`
- `Test LLM payload uses minimized profiles only where feasible.`

Acceptance criteria:
- `Tests fail if rows can be stored.`
- `LLM payload minimization is covered.`
- `Full prompt persistence is covered.`

Tests:
- row array rejected
- prompt body not persisted
- uploaded row fixture not written to DB

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No OCR or data inspection.`

Dependencies: T012, T014

Risk: Medium

Stop condition: Stop if test cannot detect meaningful regressions.

---

## T027 — Add deployment smoke test checklist and script
Owner: QA/Test Engineer

Goal: Make Vercel preview validation repeatable without production deployment.

Target files:
- `docs/deployment-smoke-tests.md`
- `scripts/smoke-vercel.mjs`

Implementation notes:
- `Script must not require credentials.`
- `Checklist covers env vars, status endpoint, fallback, logs, DB row check.`
- `Mark Vercel assumptions VERIFY_CURRENT_DOCS if docs unavailable.`

Acceptance criteria:
- `Checklist covers fresh deploy, env vars, status, fallback, logs, DB row check.`
- `Script is safe and dry-run capable.`

Tests:
- script dry run if possible

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No deployment.`
- `No production settings.`

Dependencies: T003

Risk: Low

Stop condition: Stop if script would need credentials.

---

## T028 — Add retention policy draft
Owner: Product Contract Editor

Goal: Document retention for metadata tables.

Target files:
- `docs/data-retention.md`
- `README.md`

Implementation notes:
- `Draft retention periods for metadata tables.`
- `Require approval before automation.`
- `No deletion automation in v1 without explicit approval.`

Acceptance criteria:
- `Policy draft exists.`
- `Requires approval before automation.`

Tests:
- `No code tests.`

Commands:
- None

Non-goals:
- `No retention automation.`

Dependencies: T015

Risk: Low

Stop condition: Stop before implementing retention automation.

---

## T029 — Add final release readiness checklist
Owner: QA/Test Engineer

Goal: Define beta launch gates.

Target files:
- `docs/release-readiness.md`
- `qa/checklist.md`

Implementation notes:
- `Checklist should cover product, safety, privacy, auth, DB, AI governance, deployment, support, and rollback.`
- `Include reviewer/pass/fallback for every gate.`

Acceptance criteria:
- `Checklist is actionable.`
- `Gates have pass conditions and fallbacks.`

Tests:
- `No code tests.`

Commands:
- None

Non-goals:
- `No production launch.`

Dependencies: T027, T028

Risk: Low

Stop condition: Stop before production launch.

---

## T030 — Final integration pass and regression sweep
Owner: QA/Test Engineer

Goal: Verify product contract across entire build.

Target files:
- all changed files

Implementation notes:
- `Run full validation commands.`
- `Document manual checks.`
- `Confirm no forbidden persistence.`
- `Confirm deterministic fallback.`

Acceptance criteria:
- `lint/test/build pass.`
- `Manual checks documented.`
- `No forbidden persistence.`
- `Deterministic fallback works.`

Tests:
- full suite
- manual smoke
- privacy checks

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No production deploy.`

Dependencies: T001, T002, T003, T004, T005, T006, T006A, T007, T008, T009, T010, T010A, T011, T012, T013, T014, T015, T016, T017, T018, T019, T020, T021, T022, T023, T024, T025, T026, T027, T028, T029

Risk: High

Stop condition: Stop on any product contract violation.
