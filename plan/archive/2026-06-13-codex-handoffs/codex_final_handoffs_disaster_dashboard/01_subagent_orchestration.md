# 01 — Sub-Agent Orchestration

## Why sub-agents are required

This feature crosses schema, policy logic, rendering, accessibility, tests, simulated data, and copilot instructions. A single broad context can miss edge cases or create uncontrolled rewrites.

Use sub-agents or isolated sequential passes. Each agent owns a bounded context and returns a compact artifact.

## Shared handoff contract

Each sub-agent must return:

```text
Agent:
Files inspected:
Files changed:
Key decisions:
Tests added:
Risks:
Next dependency:
Stop condition triggered: yes/no
```

## Agent map

### A0 — Repo Discovery Agent

Goal: verify the actual repo structure and scripts.

Inspect:
- `package.json`
- `types/*`
- `lib/*`
- `components/*`
- `tests/*`
- `app/*`
- `public/samples/*`

Output:
- current stack;
- chart rendering files;
- dashboard recommendation flow;
- test scripts;
- dependency availability;
- target file map.

Must not change files.

### A1 — Schema Contract Agent

Goal: extend chart recommendation types without breaking existing callers.

Tasks:
- Locate current `DashboardRecommendation` and chart spec type.
- Add or adapt fields: `subtitle`, `unit`, `timeScope`, `sourceNote`, `annotations`, `qualityBadge`, `mobileBehavior`, `sortBy`, `maxCategories`, `screenReaderSummary`.
- Preserve backwards compatibility by making new fields optional.
- Add type tests or compile coverage.

Output:
- type changes;
- compatibility notes.

### A2 — Deterministic Policy Agent

Goal: implement `enforceVizPolicy()` and validation helpers.

Tasks:
- Create `lib/vizPolicy.ts`.
- Add color/status/number/map rules in `lib/vizRules/`.
- Add validator helpers.
- Reconcile recommendations before render.
- Ensure high-risk quality fields trigger warning/block behavior.

Output:
- policy functions;
- policy test cases.

### A3 — Rendering Contract Agent

Goal: standardize chart frame and visual metadata.

Tasks:
- Create `components/charts/ChartFrame.tsx`.
- Wrap current chart renderers.
- Add title/subtitle/source/caveat/quality slots.
- Add screen reader summary support.
- Ensure keyboard/focus-visible behavior.
- Preserve existing chart visuals unless policy requires changes.

Output:
- rendered examples;
- component tests.

### A4 — Accessibility and Mobile Agent

Goal: enforce baseline accessibility and responsive behavior.

Tasks:
- Add non-color status cues.
- Add focus-visible styles.
- Ensure direct labels/legend fallback.
- Add table fallback or accessible summary.
- Add mobile top-N and legend collapse logic.
- Add contrast utility tests where practical.

Output:
- accessibility checks;
- mobile behavior tests.

### A5 — Geospatial Agent

Goal: add map-ready policy safely.

Phase 1:
- Add schema and rules only.
- If map rendering is not already supported, render ranked bar/table fallback.
- Reject raw-count choropleths.

Phase 2:
- Add `DistrictChoroplethMap` only if geometry, dependency, and approval exist.

Output:
- map policy tests;
- fallback behavior.

### A6 — Simulation Data Agent

Goal: create synthetic disaster data for test coverage.

Tasks:
- Add synthetic needs assessment CSV.
- Add population CSV.
- Add small synthetic GeoJSON if map schema is tested.
- Include edge cases: many districts, missing values, invalid percentage, negative count, outlier, irregular dates.

Output:
- fixtures;
- tests using fixtures.

### A7 — Copilot Skill/Docs Agent

Goal: document standards for the copilot while keeping hard rules in code.

Tasks:
- Create `docs/copilot/dataviz-disaster-dashboard/SKILL.md`.
- Create references for chart selection, color/accessibility, layout, titles, maps, and validation.
- Add a short “LLM may/must not” section.

Output:
- docs package;
- instructions for future copilot prompt.

### A8 — QA Integrator Agent

Goal: verify all changes as a coherent feature.

Tasks:
- Run available validation commands.
- Confirm all chart specs pass policy before render.
- Confirm tests cover deterministic rules.
- Check no excessive dependencies.
- Check no production or external writes.

Output:
- final report;
- unresolved risks;
- PR checklist.

## Context-window optimization rules

- A0 may inspect broadly but must summarize compactly.
- A1–A8 inspect only their target files plus adjacent imports.
- Agents should pass summary artifacts, not full files, unless needed.
- Do not load sample data fully into LLM context; use generated fixtures and tests.
- Put long visualization standards in `references/`; keep `SKILL.md` short.
- Keep policy rules machine-readable and tested.
