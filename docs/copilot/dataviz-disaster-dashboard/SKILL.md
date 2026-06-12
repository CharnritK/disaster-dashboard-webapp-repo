---
name: dataviz-disaster-dashboard
description: Apply disaster-dashboard visualization standards whenever creating, editing, or reviewing a chart, KPI, table, map, title, annotation, color, or dashboard layout.
---

# Disaster Dashboard Visualization Standards

Use this skill for every dashboard visualization in this repo.

## Operating Rule

Hard rules live in code. Do not override `enforceVizPolicy()` output.
Current chart-policy ownership lives in `lib/vizPolicy.ts`, `lib/vizSpecValidator.ts`, `lib/locationFields.ts`, and the recommendation types. `enforceVizPolicy()` / `enforceVizPolicies()` own final chart type, sort order, mobile behavior, quality badge, map fallback, units, subtitle, and screen-reader summary.

Current chart types include `bar`, `area`, `choropleth`, `line`, `map`, `pie`, `table`, `summary`, `scatter`, `missingness`, `stacked-area`, and `small-multiples`.

## Start With Analytical Intent

- Trend: line only when at least two valid time points exist.
- Comparison or ranking: sorted bar.
- Relationship: scatter when two numeric fields exist.
- Part-to-whole: pie only for small positive additive cases; otherwise bar.
- Spatial rate: choropleth only when normalized and verified boundary geometry exists.
- Coordinate spatial view: map only when usable latitude and longitude fields exist.
- Administrative area view: area/bar/table fallback when verified boundaries or usable coordinates are not available.
- Spatial count: fallback to bar/table unless a safe, explicit map encoding is supported.

## Non-Negotiable Rules

- No 3D charts.
- No raw-count choropleths.
- No color-only status encoding.
- No unreadable contrast.
- No rotated axis labels.
- No pie with too many slices.
- Every chart needs a title, context, unit when applicable, quality status, and screen-reader summary.

## LLM-Owned Text

The copilot may write titles, subtitles, annotation labels, rationale, and caveat wording.

The copilot may not change final chart type, sort order, mobile behavior, color semantics, quality badge, map fallback, map normalization, units, screen-reader summary, or validation result after policy enforcement.
