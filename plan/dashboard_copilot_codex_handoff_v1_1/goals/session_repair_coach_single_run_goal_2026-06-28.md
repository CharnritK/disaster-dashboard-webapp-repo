# Single-Run Goal: Session-Only Decision Repair And Coach

Date: 2026-06-28

## Purpose

Run the first safe implementation slice end to end without requiring the user to
launch each task manually.

## One Goal To Run

Implement the session-only Decision Repair Layer plus deterministic Next Best
Action Coach, integrate protected-app repair guidance, and complete the required
local verification gates.

## Required Reading

Read these files before editing:

1. `AGENTS.md`
2. `plan/dashboard_copilot_codex_handoff_v1_1/docs/product_contract.md`
3. `plan/dashboard_copilot_codex_handoff_v1_1/docs/form_intake_expansion_repair_coach_roadmap.md`
4. `docs/superpowers/plans/2026-06-28-form-expansion-repair-coach.md`
5. `plan/dashboard_copilot_codex_handoff_v1_1/redteam/chatgpt_desktop_github_connector_reconciliation_2026-06-28.md`

## Execution Mode

Use one long-running local Codex goal. Do not ask the user to run each task
separately. Internally, execute the checklist in order and use subagents only
when they reduce risk or parallelize independent work.

Recommended skills:

- `superpowers:subagent-driven-development` for multi-agent execution;
- `superpowers:executing-plans` for single-agent execution;
- `superpowers:verification-before-completion` before any completion claim.

## Scope

Implement only:

1. canonical session-only repair action types;
2. deterministic repair action generation;
3. deterministic next-best-action ranking;
4. compatibility with existing coach behavior;
5. protected workflow repair cards and safer review-oriented copy;
6. tests proving action generation, ranking, privacy, demo isolation, and copy
   safety.

Do not implement:

- persistence;
- SQL/RLS;
- DB adapter methods;
- `app/api/form-registry`;
- `app/api/form-mappings`;
- `app/api/form-schema/interpret`;
- AI schema interpretation;
- connector sync;
- OCR/PDF runtime;
- geocoding runtime;
- fuzzy matching runtime;
- production deployment or environment changes;
- provider/model/quota/admin/retention changes;
- public `/demo` behavior changes.

## Step Plan

### Step 1 - Repair Action Contract

Files:

- create `types/repairAction.ts`;
- create or update `tests/repair-actions.test.ts`.

Requirements:

- define issue types for at least `missing_evidence`, `ambiguous_mapping`, and
  `ai_fallback`;
- define severity, effort, and safe automation levels;
- require `whyItMatters`, `easiestFix`, `appCanHelpWith`, and
  `humanMustReview`;
- ensure serialized actions contain no raw rows, samples, prompts, responses,
  files, tokens, secrets, or row-like keys.

Targeted test:

```bash
npm run test -- tests/repair-actions.test.ts
```

### Step 2 - Repair Action Generation

Files:

- create `lib/repairActions.ts`;
- update `tests/repair-actions.test.ts`.

Requirements:

- derive repair actions from existing readiness, evidence coverage, form
  detection, validation, and AI fallback signals;
- missing evidence must produce a lowest-effort collection or mapping option;
- ambiguous mapping must produce a bounded review action;
- AI fallback/quota/auth denial must produce a practical non-AI fallback path;
- generated language must be concise, review-oriented, and non-authoritative;
- do not mutate datasets, prepared rows, exports, or transformation logs.

Targeted test:

```bash
npm run test -- tests/repair-actions.test.ts
```

### Step 3 - Next Best Action Coach

Files:

- create `lib/coach/nextBestAction.ts`;
- modify `lib/coach/index.ts` only if needed;
- create or update `tests/next-best-action-coach.test.ts`;
- update `tests/coach.test.ts` if existing behavior needs compatibility
  coverage.

Requirements:

- rank blockers above review issues and generic hints;
- return 1-3 actions;
- separate app-assisted work from human review;
- prefer low-effort actions when severity is equal;
- keep ranking deterministic and stable;
- preserve deterministic fallback behavior for existing coach tests.

Targeted tests:

```bash
npm run test -- tests/next-best-action-coach.test.ts tests/coach.test.ts
```

### Step 4 - Protected UI Integration

Files:

- modify `components/WorkflowComponents.tsx`;
- create `components/FormRepairPanel.tsx` only if it reduces complexity;
- update `tests/formIntake.test.ts`;
- update `tests/privacy-no-row-persistence.test.ts`.

Requirements:

- show compact repair guidance only inside protected workflow surfaces;
- keep `/demo` deterministic, sample-only, and unchanged;
- avoid unqualified operational approval language;
- replace risky labels such as unqualified `Proceed` with review-oriented copy
  such as `Continue review`, `Generate review dashboard`, or `Prepare handoff`;
- do not import server-only DB helpers into client UI;
- do not expose registry, repair API, upload, or AI behavior in `/demo`.

Targeted tests:

```bash
npm run test -- tests/formIntake.test.ts tests/privacy-no-row-persistence.test.ts
```

### Step 5 - Full Verification

Run all commands before final response:

```bash
npm run lint
npm run test
npm run build
git diff --check
```

If UI changed, also run a local smoke check:

- `/demo` renders deterministic sample-only workflow;
- `/demo` has no arbitrary upload control;
- unauthenticated `/app/data` redirects to login;
- repair guidance is not visible in public demo.

## Stop Conditions

Stop and ask the user before:

- adding any persistence, SQL/RLS, DB adapter methods, or migration drafts;
- adding registry, mapping, or AI schema interpretation APIs;
- adding connector/OCR/geocoding/fuzzy runtime behavior;
- changing public `/demo` behavior;
- changing production deployment, production environment variables,
  provider/model config, quota policy, admin policy, or retention behavior;
- reading `.env`, secrets, credentials, account pages, billing pages, private
  messages, raw uploaded data, prepared rows, full datasets, or exports.

## Final Report Requirements

The final response must include:

- files changed;
- tests added or updated;
- verification commands and results;
- implemented behavior;
- locally verified behavior;
- credential-dependent or browser-auth behavior not verified;
- production work not performed;
- remaining approval-gated phases;
- residual risks or follow-up recommendations.

## Copyable Launch Prompt

```text
Run the single long-running local goal in:
plan/dashboard_copilot_codex_handoff_v1_1/goals/session_repair_coach_single_run_goal_2026-06-28.md

Do not ask me to run each task manually. Execute the whole first safe slice end
to end: session-only repair actions, deterministic next-best-action coach,
protected UI integration, and required tests/build verification.

Hard stop before persistence, SQL/RLS, DB adapter changes, registry APIs, AI
schema routes, connector/OCR/geocoding/fuzzy runtime, production changes,
provider/model/quota/admin changes, retention behavior, or public /demo behavior
changes.
```
