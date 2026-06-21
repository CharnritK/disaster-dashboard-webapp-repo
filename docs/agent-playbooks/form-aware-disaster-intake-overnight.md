# Form-Aware Disaster Intake Overnight Playbook

Date: 2026-06-21

Use this playbook when asking an agent to implement the form-aware disaster
intake roadmap without supervision. The target is a successful local
implementation run, not production deployment.

## Objective

Build the first safe slice of form-aware disaster intake:

- recognize structured disaster-management form exports and schemas;
- map recognized form fields to existing decision evidence;
- keep uploaded/form response data session-only;
- expose mapping confidence for review;
- include form mapping metadata in the handoff export;
- preserve deterministic fallback and privacy boundaries.

The product claim is decision-readiness from familiar responder forms, not a
new form-builder, collection platform, or records system.

## Required Skills

The overnight agent must start with these skills:

- `superpowers:using-superpowers`
- `software-engineering-skill-router`
- `codex-orchestrator`
- `superpowers:using-git-worktrees`
- `superpowers:subagent-driven-development` preferred, or
  `superpowers:executing-plans` if subagents are unavailable
- `superpowers:verification-before-completion`
- `superpowers:finishing-a-development-branch` before final handoff

## Execution Prompt

Paste this as the next-agent prompt:

```text
Use Superpowers and execute the plan at docs/superpowers/plans/2026-06-21-form-aware-disaster-intake.md.

Goal: implement the first safe form-aware disaster intake slice for the controlled-beta disaster dashboard app.

Use a fresh git worktree/branch named codex/form-aware-disaster-intake. Do not work directly on a dirty main workspace. Before editing, run git status --short and inspect diffs for any file you would touch.

Required execution mode: use superpowers:subagent-driven-development if available. Dispatch fresh subagents per task and perform spec-compliance review before code-quality review. If subagents are unavailable, use superpowers:executing-plans and follow the plan task by task.

Hard blocks:
- Do not read .env, .env.local, secrets, provider dashboards, billing, quota, or account pages.
- Do not add production deployment, production env mutation, Supabase migration, DB schema change, retention automation, provider/model/SDK change, admin allowlist change, or public demo upload behavior.
- Do not persist uploaded files, form rows, prepared rows, full schemas containing row-like values, full prompts, model responses, exports, or operationally sensitive data.
- Do not add live KoBo/ODK/Google Forms sync, PDF/OCR parsing, fuzzy matching, imputation, deduplication, row deletion, geocoding, or non-row-preserving cleaning.
- Do not claim success without fresh verification evidence.

Expected final gates:
- npm run lint
- npm run test
- npm run build
- git diff --check

Expected final answer:
- files changed;
- subagents used and what each did;
- commands run with results;
- implemented behavior;
- behavior not verified;
- production/external work not performed;
- remaining risks and decision gates.
```

## Subagent Pattern

Main Codex remains accountable for scope, integration, privacy gates, and final
verification. Specialists advise or implement bounded slices only.

Use these subagents:

- **Agent A: Form Contract And Pure Adapter**
  - Write scope: `types/dataset.ts`, `types/formIntake.ts`,
    `lib/formIntake.ts`, `tests/formIntake.test.ts`.
  - Goal: form metadata types, deterministic detection, local dataset creation,
    HXL row handling, and focused unit tests.

- **Agent B: Evidence And Handoff Integration**
  - Write scope: `lib/decisionContext.ts`, `lib/workflowExport.ts`,
    `tests/dataPipeline.test.ts`, `tests/privacy-no-row-persistence.test.ts`.
  - Goal: evidence coverage uses form mappings first, handoff export includes
    safe mapping metadata, and privacy guards cover the new module.

- **Agent C: Protected-App Review UI**
  - Write scope: `components/workflow/FormIntakePanel.tsx`,
    `components/DashboardCopilotApp.tsx`, `components/WorkflowComponents.tsx`,
    `app/styles.css`.
  - Goal: a protected-app-only review panel that creates a session-only form
    dataset and shows mapping/caveats. Hide it in sample-only demo mode.

- **Agent D: Read-Only Verification**
  - Write scope: none.
  - Goal: inspect diffs, check privacy boundaries, confirm no forbidden
    persistence or external changes, and verify command results.

Do not run multiple write agents against the same files in parallel. Agent B
starts after Agent A. Agent C starts after Agent A and must inspect any existing
dirty UI diffs before editing.

## Required Unit Tests

At minimum, implementation must add or update tests for:

- built-in form definition generation from existing decision templates;
- HXL tag row detection and record-row exclusion;
- 3W/5W-like operational presence detection;
- XLSForm-like schema metadata detection without treating choices as response
  rows;
- evidence mapping status and confidence for covered, ambiguous, and missing
  evidence;
- form-derived dataset integration with profiling and readiness;
- handoff export fields for form detection and mapping decisions;
- privacy guard showing `lib/formIntake.ts` has no DB/server imports, no
  `fetch`, and no persistence-like methods.

## Command Schedule

Fast loop:

```powershell
npm run test -- tests/formIntake.test.ts
```

Integration loop:

```powershell
npm run test -- tests/dataPipeline.test.ts tests/privacy-no-row-persistence.test.ts
```

Final local gates:

```powershell
npm run lint
npm run test
npm run build
git diff --check
```

If a command fails, fix the failure and rerun the exact command before claiming
it passes.

## Stop Conditions

Stop and report instead of guessing if:

- the workspace has unresolved user edits in a file that must be changed;
- the plan requires a production change, migration, provider change, secret, or
  external account mutation;
- tests reveal the required architecture needs a DB/API route to work;
- form rows or schema bodies would need to persist;
- `/demo` changes would be required for the feature;
- UI work cannot be reconciled with existing uncommitted changes.

## Final Report Template

```text
Objective:
Implemented:
Files changed:
Subagents used:
Data shared with subagents:
Commands run:
Verified:
Not verified:
Production/external work not performed:
Privacy gates checked:
Remaining risks:
Recommended next action:
```
