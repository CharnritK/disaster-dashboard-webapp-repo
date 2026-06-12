# Codex Starter Prompts

These prompts are meant for future contributors adapting Dashboard Copilot. Replace the bracketed text before use.

## 1. Add A New Decision Template

```text
Use the existing Dashboard Copilot response-prioritization workflow as the pattern. Add a new decision template for [use case]. Preserve session-only data handling, deterministic fallback, soft-gate readiness, and visible caveats. Update the relevant types, template defaults, suggested collection fields, readiness checks, UI copy, and Vitest tests. Do not add persistence, auth, background jobs, new package managers, or automatic row-deleting transforms.
```

## 2. Adapt To A New Situation

```text
Adapt this project for [organization/domain/context]. Start from the decision question, action, decision-maker, required evidence, and review caveats. First produce a short plan with the smallest useful product changes. After approval, implement only the scoped changes and keep technical details in the appendix or handoff notes.
```

## 3. Create A New Sample Data Pack

```text
Create a synthetic sample data pack for [use case]. Keep the data safe, fictional, and realistic enough to demonstrate joins, missingness, readiness caveats, and dashboard recommendations. Update public samples only if the browser demo needs them. Add or update tests when parsing, profiling, or readiness behavior changes.
```

## 4. Improve The Handoff Export

```text
Improve the export/handoff package so a response analyst can share the prepared data, caveats, and next data asks with another team. Preserve formula-neutralized CSV exports, transformation logs, readiness caveats, and deterministic fallback. Do not make the export sound like operational approval.
```

## 5. Review The Project For Public-Good Reuse

```text
Review the repository as a digital public good candidate. Focus on reuse, clarity, safety, privacy, documentation, and handoff gaps. Identify the highest-leverage fixes before submission. Do not modify code unless I explicitly ask you to implement the recommendations.
```

## 6. Audit AI And Privacy Boundaries

```text
Audit the LLM recommendation and handoff paths. Confirm that full uploaded rows stay out of provider calls, browser code never receives server secrets, invalid model output is sanitized, and deterministic fallback stays intact. Produce findings first, then fix only confirmed issues if asked.
```

## 7. Strengthen Visualization Rules

```text
Use the repo-local dataviz-disaster-dashboard skill. Review the dashboard recommendations for chart type, titles, units, caveats, color use, accessibility, map safety, and denominator handling. Keep policy enforcement deterministic and add tests for changed rules.
```

## 8. Create A Second-Pass Dashboard Project Kit

```text
Design a downloadable Dashboard Project Kit based on the current export flow. It should include prepared CSV, schema/config JSON, readiness report, transformation log, and a short README for the next implementer. Keep it client-side and session-only unless I explicitly approve a larger architecture change.
```
