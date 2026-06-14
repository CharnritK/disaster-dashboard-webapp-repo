# Handoff Index v1.1

## Start here

1. `00_USE_THIS_FIRST.md`
2. `APPROVALS_TO_REVIEW.md`
3. `codex/prompts/GOAL_FULL_BUILD.md`

## Core handoff docs

- `docs/product_contract.md`
- `docs/architecture.md`
- `docs/data_model.md`
- `docs/quota_accounting_policy.md`
- `docs/security_supabase_rls.md`
- `docs/security/supabase_rls.md` (alias path used by the main goal prompt)
- `docs/prompt_versions.md`
- `docs/vercel_free_readiness.md`
- `docs/implementation_rules.md`
- `docs/roadmap.md`
- `docs/decisions_required.md`

## Codex execution docs

- `codex/backlog.md`
- `codex/backlog.json`
- `codex/tasks/`
- `codex/sub_agents.md`
- `codex/prompts/PROMPT_01_BASELINE_VERCEL.md`
- `codex/prompts/PROMPT_02_CONTRACT_DOCS_ENV.md`
- `codex/prompts/PROMPT_03_ENTITLEMENT_INTERFACE.md`

## QA and gates

- `qa/testing_strategy.md`
- `qa/review_gates.md`
- `qa/checklist.md`
- `qa/challenger_closeout.md`
- `qa/milestone_T010_report.md`
- `qa/final_goal_status.md`
- `qa/supabase_preview_branch_gate_2026-06-14.md`
- `qa/supabase_staging_project_check_2026-06-14.md`
- `qa/t031_staging_beta_validation_2026-06-14.md`
- `qa/document_consistency_audit_2026-06-14.md`

Current status source of truth: `qa/final_goal_status.md` plus the latest
T031 evidence file. The backlog and task cards describe the execution plan and
may contain historical stop conditions; do not treat them as the current
completion state without checking QA evidence.

## Implemented repo artifacts outside this package

- `../../../db/schema.sql`
- `../../../db/rls.sql`
- `../../../db/README.md`
- `../../../docs/deployment-smoke-tests.md`
- `../../../docs/data-retention.md`
- `../../../docs/release-readiness.md`
- `../../../qa/checklist.md`
- `../../../lib/supabase/env.ts`
- `../../../lib/supabase/client.ts`
- `../../../lib/supabase/server.ts`
- `../../../lib/supabase/middleware.ts`
- `../../../lib/auth/signInErrors.ts`
- `../../../middleware.ts`
- `../../../app/login/page.tsx`
- `../../../app/auth/signin/route.ts`
- `../../../app/auth/callback/route.ts`
- `../../../app/auth/signout/route.ts`
- `../../../app/app/page.tsx`
- `../../../app/app/layout.tsx`
- `../../../app/app/(workflow)/data/page.tsx`
- `../../../app/app/(workflow)/prepare/page.tsx`
- `../../../app/app/(workflow)/readiness/page.tsx`
- `../../../app/app/(workflow)/dashboard/page.tsx`
- `../../../app/app/(workflow)/export/page.tsx`
- `../../../app/app/usage/page.tsx`
- `../../../app/app/feedback/page.tsx`
- `../../../components/workflow/WorkspaceWorkflowShell.tsx`
- `../../../components/workflow/workspaceRoutes.ts`
- `../../../components/TemplateBuilder.tsx`
- `../../../app/demo/page.tsx`
- `../../../app/admin/page.tsx`
- `../../../app/api/coach/route.ts`
- `../../../app/api/feedback/route.ts`
- `../../../app/api/templates/route.ts`
- `../../../app/api/templates/[id]/route.ts`
- `../../../scripts/smoke-vercel.mjs`

## Evidence and limitations

- `evidence/repo_findings.md`
- `evidence/current_limitations.md`
- `evidence/source_notes.md`
- `evidence/revision_notes_v1_1.md`

## Revision notes

- `CHANGELOG_v1.1.md`
