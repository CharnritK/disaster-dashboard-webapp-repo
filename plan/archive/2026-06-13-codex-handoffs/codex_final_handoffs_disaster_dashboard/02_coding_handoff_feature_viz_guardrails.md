# 02 — Coding Handoff: Visualization Guardrails Feature

## Objective

Implement a visualization-quality control layer so generated disaster dashboards are standardized, accessible, and decision-safe before rendering.

## Repository / environment assumptions

- Repo: `CharnritK/disaster-dashboard-webapp-repo`
- Branch: `001-decision-context-data-quality`
- Stack assumption: Next.js + React + TypeScript
- Rendering assumption: custom SVG/HTML charts
- Tests assumption: Vitest exists
- Package manager assumption: verify from lockfile before running commands

These are assumptions from provided context. Codex must verify before modifying files.

## Current behavior

The app can parse, profile, validate, recommend, and render dashboards. It supports summary, bar, pie/donut, line, scatter, missingness, and table views. The gap is that chart specs are not consistently governed by a visualization policy layer.

## Expected behavior

Before rendering:

1. Dashboard recommendations are reconciled through `enforceVizPolicy()`.
2. Every chart has required metadata for title, subtitle, unit, caveat/source, accessibility, mobile behavior, and quality status.
3. Misleading chart choices are blocked, downgraded, or converted.
4. Accessibility and mobile standards are consistently applied.
5. Tests prevent regression.

## Target files or areas

Verify actual paths first.

```text
types/recommendations.ts
types/dashboard.ts
lib/dashboardRecommendations.ts
lib/dashboardInsights.ts
lib/chartMetrics.ts
lib/validation.ts
lib/vizPolicy.ts
lib/vizRules/
lib/vizSpecValidator.ts
components/WorkflowComponents.tsx
components/charts/ChartFrame.tsx
components/charts/*
components/maps/*
app/styles.css
tests/*
public/samples/*
docs/copilot/dataviz-disaster-dashboard/*
```

## Non-goals

- Do not replace all charts with a new library.
- Do not implement a full GIS platform.
- Do not require map rendering in phase 1.
- Do not change parsing/profiling/quality semantics unless needed for chart policy.
- Do not deploy.
- Do not modify production data.
- Do not add credentials, API keys, or tokens.

## Task cards

### T1 — Repo discovery and plan lock

Files/areas:
- `package.json`
- chart and recommendation files
- tests

Acceptance criteria:
- Current stack and test scripts are identified.
- Target file map is written in the final report.
- Any missing assumptions are listed.

Dependencies:
- None.

### T2 — Extend chart spec safely

Files/areas:
- `types/recommendations.ts` or actual equivalent

Acceptance criteria:
- New fields are optional.
- Existing callers compile.
- Fields include `subtitle`, `unit`, `timeScope`, `sourceNote`, `annotations`, `qualityBadge`, `mobileBehavior`, `sortBy`, `maxCategories`, `screenReaderSummary`.
- Type definitions include union types for quality and mobile behavior.

Dependencies:
- T1.

### T3 — Add visualization rule tokens

Files/areas:
- `lib/vizRules/`
- optional JSON under `config/` if repo convention prefers

Acceptance criteria:
- Categorical, sequential, diverging, semantic status, neutral, and emphasis colors are defined.
- Color names are semantic, not chart-specific.
- Number format defaults exist.
- Map rule defaults exist.
- No component hardcodes new ad hoc status colors.

Dependencies:
- T2.

### T4 — Implement `vizPolicy`

Files/areas:
- `lib/vizPolicy.ts`
- `lib/vizSpecValidator.ts`

Acceptance criteria:
- Pie with too many categories converts to bar.
- Time series requires at least two time points.
- Bar sorting defaults to value descending.
- Line sorting defaults to time ascending.
- High-risk fields produce `qualityBadge: "block"` or clear caveat.
- Choropleth of raw counts is rejected or converted to fallback.
- Missing geometry produces fallback spec.
- Mobile behavior defaults are set.
- Policy returns a new object and does not mutate input.

Dependencies:
- T2, T3.

### T5 — Integrate policy into recommendation/render path

Files/areas:
- `lib/dashboardRecommendations.ts`
- `components/WorkflowComponents.tsx`
- actual `DashboardPreview` / `ChartPanel` files

Acceptance criteria:
- All generated chart specs pass through policy before render.
- Existing insights remain linked.
- Charts with `qualityBadge: "block"` do not silently present as decision-ready.
- Fallback chart behavior is visible to users.

Dependencies:
- T4.

### T6 — Add `ChartFrame`

Files/areas:
- `components/charts/ChartFrame.tsx`
- chart rendering components
- styles

Acceptance criteria:
- Every chart card uses `ChartFrame`.
- Title is rendered as heading.
- Subtitle, source/caveat, quality badge, and chart body are rendered consistently.
- `aria-labelledby` and `aria-describedby` are supported.
- Screen reader summary is available.
- Focus indicator is visible.

Dependencies:
- T2, T5.

### T7 — Accessibility and mobile hardening

Files/areas:
- chart components
- styles
- policy

Acceptance criteria:
- Color is not the only status indicator.
- Quality badges include text and/or icon.
- Legends/direct labels have text equivalents.
- Mobile behavior supports top-N, collapsed legend, or table fallback.
- Axis labels do not rotate; long labels truncate accessibly or switch layout.

Dependencies:
- T6.

### T8 — Geospatial policy and fallback

Files/areas:
- `lib/vizPolicy.ts`
- optional `components/maps/*`
- tests

Acceptance criteria:
- `choropleth` specs require normalized metric classification.
- Raw-count map requests fall back to ranked bar/table or proportional symbol placeholder.
- Map legend metadata includes units and classification method.
- No map dependency is added without explicit approval.

Dependencies:
- T4.

### T9 — Synthetic data fixtures

Files/areas:
- `public/samples/*`
- `tests/fixtures/*`

Acceptance criteria:
- Fixtures include valid and invalid disaster records.
- Fixtures include many categories.
- Fixtures include time series.
- Fixtures include geographic keys.
- Fixtures include a small synthetic GeoJSON if map fallback tests need it.
- Tests do not rely on network calls.

Dependencies:
- T1.

### T10 — Test expansion

Files/areas:
- `tests/*`

Acceptance criteria:
- Unit tests cover policy conversions and blocks.
- Component tests cover `ChartFrame`.
- Existing pipeline tests still pass.
- Accessibility checks are added with existing tooling where possible.
- If a11y tooling is not present, add a manual checklist and open a follow-up task.

Dependencies:
- T4, T6, T9.

### T11 — Copilot skill documentation

Files/areas:
- `docs/copilot/dataviz-disaster-dashboard/SKILL.md`
- `docs/copilot/dataviz-disaster-dashboard/references/*`

Acceptance criteria:
- Skill file is concise.
- References contain detailed chart, color, title, layout, and map rules.
- Docs clearly say hard rules live in code.
- Docs tell the LLM not to override deterministic policy.

Dependencies:
- T4.

### T12 — Final QA and PR split

Files/areas:
- all changed files

Acceptance criteria:
- Lint/test/build commands are run if available.
- Results are reported exactly.
- Remaining risks are listed.
- Suggested PR split is provided if feature is too large.

Dependencies:
- T1–T11.

## Validation commands

Run only after verifying scripts:

```bash
npm run lint
npm test
npm run build
```

Potential additional commands if tools exist:

```bash
npm run test:watch -- --run
npm run test:e2e
npm run storybook
```

## Review gates

### RG1 — Engineering review

Reviewer:
- repo owner or senior frontend engineer

Scope:
- schema compatibility, policy integration, rendering changes

Pass condition:
- existing dashboard behavior preserved and new tests pass

Fallback:
- split into schema/policy PR and rendering PR

### RG2 — Visualization review

Reviewer:
- BI/data visualization owner

Scope:
- chart selection, titles, colors, map rules, quality caveats

Pass condition:
- canonical dashboard examples satisfy rules

Fallback:
- tighten policy rules before merge

### RG3 — Accessibility review

Reviewer:
- accessibility owner or frontend reviewer

Scope:
- keyboard, contrast, color-only cues, screen reader summaries

Pass condition:
- no known blockers for core dashboard views

Fallback:
- merge policy only; defer UI changes

### RG4 — Dependency review

Reviewer:
- engineering owner

Scope:
- new packages for maps, Storybook, Playwright, axe

Pass condition:
- dependency need and maintenance cost accepted

Fallback:
- keep phase 1 dependency-free

## Stop conditions

Stop before code changes if the repo structure differs materially from assumptions. Stop before merge if tests cannot be run. Stop before adding map libraries or visual regression SaaS dependencies without approval.

## Final response required from Codex

```text
Summary:
Files changed:
Tests run:
Test results:
Policy rules implemented:
Accessibility changes:
Known limitations:
Review gates:
Next PR recommendation:
```
