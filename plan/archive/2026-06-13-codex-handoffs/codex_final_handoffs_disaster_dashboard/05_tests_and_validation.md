# 05 — Tests and Validation

## Required test layers

### Unit tests

Use existing test runner, assumed Vitest.

Must cover:

- pie to bar conversion;
- invalid part-to-whole behavior;
- time series with fewer than two points;
- high-risk columns set `qualityBadge`;
- choropleth raw count fallback;
- default sort rules;
- mobile behavior defaults;
- policy immutability.

Example:

```ts
import { describe, expect, it } from "vitest";
import { enforceVizPolicy } from "@/lib/vizPolicy";

describe("enforceVizPolicy", () => {
  it("converts pie to bar when category count is too high", () => {
    const dataset = {
      data: [
        { district: "A", value: 10 },
        { district: "B", value: 9 },
        { district: "C", value: 8 },
        { district: "D", value: 7 },
        { district: "E", value: 6 },
        { district: "F", value: 5 },
      ],
    } as any;

    const chart = {
      id: "share-by-district",
      chartType: "pie",
      title: "Share by district",
      rationale: "Part-to-whole",
      groupByField: "district",
      metricField: "value",
    } as any;

    const next = enforceVizPolicy(dataset, [], chart);
    expect(next.chartType).toBe("bar");
    expect(chart.chartType).toBe("pie");
  });
});
```

### Component tests

Use React Testing Library if available.

Must cover:

- `ChartFrame` title;
- subtitle;
- quality badge;
- source note;
- screen reader summary;
- chart body slot.

Example:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ChartFrame } from "@/components/charts/ChartFrame";

it("renders chart metadata", () => {
  render(
    <ChartFrame
      id="response-gap"
      title="Response gap is highest in District B"
      subtitle="Percent · District level · Jan 2026"
      sourceNote="Requires data quality review."
      qualityBadge="warn"
    >
      <div>chart body</div>
    </ChartFrame>
  );

  expect(screen.getByText("Response gap is highest in District B")).toBeInTheDocument();
  expect(screen.getByText(/Jan 2026/)).toBeInTheDocument();
  expect(screen.getByText("warn")).toBeInTheDocument();
  expect(screen.getByText("chart body")).toBeInTheDocument();
});
```

### Accessibility tests

Use existing tooling first. Add `axe-core` or `vitest-axe` only with approval if not present.

Must cover:

- no missing chart headings;
- quality status has text;
- screen reader description exists;
- focus target is visible;
- color-only cues are not used.

If tooling is not available, add a manual checklist in docs and open a follow-up task.

### E2E or workflow tests

Use existing framework if present. If not present, keep this as a follow-up.

Must cover:

- load sample data;
- profile;
- validate;
- generate dashboard;
- policy applies before render;
- blocked chart displays caveat;
- mobile viewport shows readable chart cards.

### Visual regression

Add only if Storybook/Chromatic/Percy exists or dependency approval is granted.

Must cover:

- canonical bar;
- line;
- pie downgraded to bar;
- table fallback;
- quality-block card;
- mobile card.

## Recommended validation commands

Verify scripts first:

```bash
npm run lint
npm test
npm run build
```

Report exact outputs.

## Acceptance criteria for merge

- Existing data pipeline tests pass.
- New policy tests pass.
- Every chart rendered by dashboard preview uses or is covered by `ChartFrame`.
- Every chart spec from recommendation path is reconciled through policy.
- No raw-count choropleth can render.
- No high-risk data column can render decision-ready without warning or block.
- No chart relies on color alone for critical status.
- Mobile behavior is defined for every chart spec.
- All new fields are backwards compatible.
- No unapproved heavy dependency is added.

## QA checklist

- [ ] Chart type rules are deterministic.
- [ ] LLM narrative cannot override policy.
- [ ] Quality caveats appear in the visual layer.
- [ ] Titles include metric, unit, geography, or time where available.
- [ ] Number formatting is compact.
- [ ] Color tokens are centralized.
- [ ] Accessibility metadata exists.
- [ ] Mobile fallback exists.
- [ ] Simulated data covers edge cases.
- [ ] Final report includes commands and test results.

## Stop conditions

- Tests cannot run.
- Type errors indicate breaking API.
- New dependency is required but not approved.
- Map implementation needs real boundaries or API access.
- Copilot integration point is unknown.
- Implementation expands into unrelated dashboard redesign.
