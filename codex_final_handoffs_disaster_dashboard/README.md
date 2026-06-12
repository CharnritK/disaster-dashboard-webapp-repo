# Codex Final Handoffs — Disaster Dashboard Visualization Guardrails

## Purpose

Build the feature set that makes the disaster dashboard copilot generate dashboards that are analytically correct, visually consistent, accessible, mobile-aware, and decision-safe.

This is an execution package for Codex or a coding agent. It is not a claim that implementation or tests have already been run.

## Source basis

Based on the provided synthesis and research context:

- The dashboard should use a deterministic layer for chart selection, color tokens, number formatting, geospatial rules, and spec validation.
- The LLM/copilot layer should only handle constrained narrative tasks such as titles, subtitles, annotations, and rationale.
- The current repo context indicates a Next.js + React + TypeScript app with custom SVG/HTML chart components, not an external charting library.
- The known implementation gap is the missing visualization contract: policy layer, schema fields, shared chart frame, accessibility/mobile rules, quality-to-visual mapping, and rendered visualization tests.

## Package contents

1. `00_master_codex_prompt.md` — copy-ready master prompt.
2. `01_subagent_orchestration.md` — required sub-agent workflow and context-window rules.
3. `02_coding_handoff_feature_viz_guardrails.md` — implementation task cards and acceptance criteria.
4. `03_subagent_prompts.md` — copy-ready prompts for each sub-agent.
5. `04_required_templates_and_schemas.md` — target TypeScript types, policy rules, and component templates.
6. `05_tests_and_validation.md` — unit, component, accessibility, E2E, regression, and stop gates.
7. `06_simulated_data_spec.md` — synthetic data requirements.
8. `samples/` — synthetic data starter files.

## Execution stance

Implement this in phases. Do not rewrite the charting stack. Preserve existing parsing, profiling, validation, dashboard recommendation, and export paths unless tests prove a change is required.

## Readiness verdict

READY_WITH_ASSUMPTIONS

Assumptions:
- Codex has repository access and can inspect branch `001-decision-context-data-quality`.
- The repo structure still matches the provided context.
- Package manager and test scripts should be verified from `package.json` before commands are run.
- Storybook, Playwright, and axe dependencies may not exist yet; add only with approval or implement phase-1 tests using existing dependencies.
# Current Project Tutorial

Start with [../docs/digital-public-good-guide.md](../docs/digital-public-good-guide.md) for the plain-English project overview, scope, extension guidance, starter Codex prompts, and technical appendix. Use [../docs/README.md](../docs/README.md) as the project documentation index.
