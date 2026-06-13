# Visualization Policy

Dashboard Copilot uses deterministic visualization guardrails so charts remain reviewable for disaster-response decisions. LLM output can suggest charts, but `lib/vizPolicy.ts` owns final chart type, sort behavior, mobile behavior, quality badges, caveats, and screen-reader summaries.

## Map Rules

- Coordinate maps are local uploaded-coordinate views only. The app does not call geocoders, basemap services, or remote boundary services from the browser.
- Boundary choropleths require verified local boundary geometry and a normalized measure such as a rate, ratio, density, or index.
- Raw counts must not be encoded as choropleth area fill. When a choropleth is unsafe, policy falls back to a bar or table view with a caveat.

## Rate And Denominator Rules

- Percent, rate, ratio, density, and index fields are treated as normalized comparison measures.
- Population, household, count, total, affected, and capacity fields are treated as counts unless the field explicitly represents a normalized measure.
- Preparedness or response comparisons that depend on population scale should keep denominator fields visible in the data schema or handoff context.

## Caveat Rules

- Charts using fields with high-risk quality findings receive a blocking or caution quality badge.
- Chart caveats stay in chart source notes, dashboard recommendations, and project-kit export context.
- Dashboard output is a review surface, not operational approval.

## Accessibility Rules

- Every policy-enforced chart should include a title, rationale, mobile behavior, quality badge, and screen-reader summary.
- Chart cards expose the title and summary through accessible labels and descriptions.
- Missingness, summary, map-like, and table views must preserve text labels instead of relying on color alone.
