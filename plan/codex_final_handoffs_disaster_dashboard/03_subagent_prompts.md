# 03 — Copy-Ready Sub-Agent Prompts

> Archive notice: these are historical visualization-guardrails sub-agent prompts, not current project guidance. Use `README.md`, `AGENTS.md`, and `docs/README.md` for current setup and product contract.

## A0 — Repo Discovery Agent Prompt

```text
You are the Repo Discovery Agent for the disaster dashboard visualization guardrails feature.

Inspect only what is needed to map the repo:
- package.json
- type definitions
- dashboard recommendation logic
- chart rendering components
- existing tests
- styles
- public sample files

Do not modify files.

Return:
1. stack and package manager;
2. available scripts;
3. chart spec type location;
4. recommendation path;
5. rendering path;
6. existing tests;
7. files that should be changed;
8. risks or mismatch with handoff assumptions.
```

## A1 — Schema Contract Agent Prompt

```text
You are the Schema Contract Agent.

Using the repo map from A0, extend the chart recommendation contract safely.

Add optional fields only:
- subtitle
- unit
- timeScope
- sourceNote
- annotations
- qualityBadge
- mobileBehavior
- sortBy
- maxCategories
- screenReaderSummary

Preserve existing imports and callers. Add tests or compile coverage if possible.

Return changed files, compatibility notes, and any blocked field names.
```

## A2 — Deterministic Policy Agent Prompt

```text
You are the Deterministic Policy Agent.

Implement the visualization policy layer. Hard rules belong in code.

Create or update:
- lib/vizPolicy.ts
- lib/vizRules/*
- lib/vizSpecValidator.ts if useful

Rules:
- pie > allowed categories converts to bar;
- invalid part-to-whole does not render as pie;
- line requires two valid time points;
- bar defaults value_desc;
- line defaults time_asc;
- high-severity affected fields produce block/warn badge;
- choropleth requires rate/ratio/density;
- raw geospatial counts fall back;
- mobile behavior defaults are set;
- policy must not mutate input.

Add unit tests.

Return implementation summary and test names.
```

## A3 — Rendering Contract Agent Prompt

```text
You are the Rendering Contract Agent.

Create a shared ChartFrame and wrap chart output.

Requirements:
- consistent title/subtitle/source/caveat slots;
- quality badge visible;
- aria-labelledby/aria-describedby supported;
- screenReaderSummary supported;
- existing chart visuals preserved;
- no broad UI redesign.

Return changed files, screenshots if available, and component tests.
```

## A4 — Accessibility and Mobile Agent Prompt

```text
You are the Accessibility and Mobile Agent.

Harden the dashboard chart components.

Requirements:
- no status is represented by color alone;
- focus indicator visible;
- direct labels or accessible legends;
- mobile top-N/collapsed legend/table fallback;
- long labels handled without rotated text;
- contrast utilities added if practical.

Use existing dependencies first. Do not add packages without noting approval need.

Return changes, tests, and remaining accessibility risks.
```

## A5 — Geospatial Agent Prompt

```text
You are the Geospatial Policy Agent.

Phase 1 goal: map-ready schema and safe fallbacks, not a full GIS rewrite.

Implement:
- map rule validation;
- choropleth only for normalized values;
- raw counts fallback to ranked bar/table;
- map legend metadata fields;
- missing GeoJSON fallback.

Do not add map libraries unless approved.

Return behavior matrix and tests.
```

## A6 — Simulation Data Agent Prompt

```text
You are the Simulation Data Agent.

Create synthetic disaster data fixtures for testing visualization policy.

Include:
- 12+ districts;
- dates with at least two time points;
- population values;
- affected households;
- response_gap_percent;
- severity status;
- missing values;
- invalid percentage >100;
- negative count;
- outlier;
- geographic key.

Add tests using fixtures without network calls.

Return fixture paths and covered edge cases.
```

## A7 — Copilot Skill/Docs Agent Prompt

```text
You are the Copilot Skill/Docs Agent.

Create docs/copilot/dataviz-disaster-dashboard.

Required files:
- SKILL.md
- references/chart-selection.md
- references/color-accessibility.md
- references/layout-titles.md
- references/maps-disaster.md
- references/validation-checklist.md

SKILL.md must be concise and tell the LLM:
- ask for analytical intent;
- use deterministic policy output;
- write titles/subtitles/annotations only within constraints;
- never override chart type, colors, quality badges, or map normalization after policy enforcement.

Return docs created and any future maintenance note.
```

## A8 — QA Integrator Agent Prompt

```text
You are the QA Integrator Agent.

Review all changes from A1–A7.

Run available commands after reading package.json:
- lint
- tests
- build

If a command is missing, report it.

Check:
- no broad rewrite;
- no unapproved dependencies;
- no secrets;
- policy is integrated before render;
- tests cover rules;
- accessibility and mobile behavior have at least baseline coverage.

Return final PR report with exact command output summary, unresolved risks, and recommended PR split.
```
