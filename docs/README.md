# Project Documentation

This folder holds the project-facing documentation for Dashboard Copilot.

## Start Here

- [Digital Public Good Guide](digital-public-good-guide.md): the main plain-English tutorial for colleagues, reviewers, and reuse partners. It explains what the project does, what is in scope, what is out of scope, how it can be extended, and the technical appendix.
- [AI Mode Configuration](AI_MODE.md): server-side AI setup, route behavior, task-specific model variables, and deterministic fallback.
- [Release Readiness Checklist](release-readiness.md): controlled-beta gates, current staging-preview state, and production approval boundary.
- [Deployment Smoke Tests](deployment-smoke-tests.md): safe preview validation steps and DB/privacy checks.
- [Data Retention Draft](data-retention.md): retention policy posture and automation gate.
- [Visualization Policy](visualization-policy.md): chart, map, denominator, caveat, and accessibility guardrails enforced by the app.
- [Codex Starter Prompts](codex-starter-prompts.md): reusable prompts for extending, reviewing, or adapting the project with Codex.
- [Showcase Script](showcase-script.md): an onboarding/proof flow for presenting the project without treating the demo as launch approval.

## Codex Skills

The `copilot/` folder contains repo-local Codex skills:

- `dataviz-disaster-dashboard`: visualization standards for disaster dashboard charts, maps, titles, annotations, colors, and layouts.
- `bootstrap-decision-support-app`: guidance for adapting this repo into another scoped decision-support prototype.
- `adapt-decision-template`: guidance for adding or modifying decision templates, suggested data collection fields, readiness checks, and tests.

Use these skills as guardrails. They should help future work stay decision-first, privacy-conscious, and honest about uncertainty.
