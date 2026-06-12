# 04 — Required Templates and Schemas

> Archive notice: this is a historical visualization-guardrails schema handoff, not current project guidance. Use current source types and `docs/copilot/dataviz-disaster-dashboard/SKILL.md` before implementing new chart policy.

## Enhanced chart spec

Add these fields to the existing chart spec type. Keep them optional where possible.

```ts
export type AnnotationTone = "neutral" | "success" | "warn" | "alert";

export type AnnotationSpec = {
  id: string;
  label: string;
  xValue?: string | number;
  yValue?: number;
  value?: number;
  tone?: AnnotationTone;
};

export type MobileBehavior =
  | "auto"
  | "top5"
  | "collapse-legend"
  | "table-fallback";

export type QualityBadge = "ok" | "warn" | "block";

export type SortBy =
  | "time_asc"
  | "value_desc"
  | "label_asc";

export type EnhancedChartSpec = {
  id: string;
  chartType:
    | "summary"
    | "bar"
    | "pie"
    | "line"
    | "scatter"
    | "missingness"
    | "table"
    | "choropleth"
    | "stacked-area"
    | "small-multiples";

  title: string;
  subtitle?: string;
  rationale: string;

  unit?: string;
  timeScope?: string;
  sourceNote?: string;
  screenReaderSummary?: string;

  section?: "overview" | "comparisons" | "quality" | "details";
  groupByField?: string;
  metricField?: string;
  xField?: string;
  yField?: string;
  timeField?: string;

  aggregation?: "count" | "sum" | "average";
  sortBy?: SortBy;
  maxCategories?: number;
  annotations?: AnnotationSpec[];
  qualityBadge?: QualityBadge;
  mobileBehavior?: MobileBehavior;
  supportedInsightIds?: string[];
  priority?: number;

  geoKey?: string;
  dataKey?: string;
  measureType?: "count" | "rate" | "ratio" | "density" | "index";
  classificationMethod?: "quantile" | "jenks" | "equal_interval";
  classCount?: number;
  fallbackChartType?: "bar" | "table";
};
```

## Visualization policy skeleton

```ts
import type { Dataset } from "@/types/dataset";
import type { QualityCheckResult } from "@/types/quality";
import type { EnhancedChartSpec } from "@/types/recommendations";

type VizPolicyOptions = {
  maxPieCategories?: number;
  maxMapClasses?: number;
};

const DEFAULTS: Required<VizPolicyOptions> = {
  maxPieCategories: 5,
  maxMapClasses: 7,
};

export function enforceVizPolicy(
  dataset: Dataset,
  quality: QualityCheckResult[],
  chart: EnhancedChartSpec,
  options: VizPolicyOptions = {},
): EnhancedChartSpec {
  const config = { ...DEFAULTS, ...options };
  const highRiskColumns = getHighRiskColumns(quality);
  const next: EnhancedChartSpec = { ...chart };

  const categoryCount = getCategoryCount(dataset, next.groupByField);

  if (next.chartType === "pie" && categoryCount > config.maxPieCategories) {
    next.chartType = "bar";
    next.sortBy = next.sortBy ?? "value_desc";
    next.rationale = appendReason(
      next.rationale,
      "Converted from pie to bar because category count is too high.",
    );
  }

  if (next.chartType === "line" && !hasAtLeastTwoTimePoints(dataset, next.timeField ?? next.xField)) {
    next.chartType = "bar";
    next.sortBy = "value_desc";
    next.rationale = appendReason(
      next.rationale,
      "Converted from line because fewer than two valid time points are available.",
    );
  }

  if (next.chartType === "choropleth") {
    const normalized = ["rate", "ratio", "density", "index"].includes(next.measureType ?? "");
    if (!normalized) {
      next.chartType = next.fallbackChartType ?? "bar";
      next.rationale = appendReason(
        next.rationale,
        "Converted from choropleth because raw counts must not be encoded as area fill.",
      );
    }
    next.classCount = Math.min(next.classCount ?? 5, config.maxMapClasses);
  }

  if (usesHighRiskColumn(next, highRiskColumns)) {
    next.qualityBadge = "block";
    next.sourceNote = appendReason(
      next.sourceNote,
      "Requires data quality review before decision use.",
    );
  }

  next.sortBy = next.sortBy ?? defaultSort(next.chartType);
  next.mobileBehavior = next.mobileBehavior ?? defaultMobileBehavior(next.chartType, categoryCount);
  next.qualityBadge = next.qualityBadge ?? "ok";

  return next;
}
```

## ChartFrame template

```tsx
import type { ReactNode } from "react";

type ChartFrameProps = {
  id: string;
  title: string;
  subtitle?: string;
  sourceNote?: string;
  screenReaderSummary?: string;
  qualityBadge?: "ok" | "warn" | "block";
  children: ReactNode;
};

export function ChartFrame({
  id,
  title,
  subtitle,
  sourceNote,
  screenReaderSummary,
  qualityBadge = "ok",
  children,
}: ChartFrameProps) {
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  return (
    <article
      className={`card chart-card quality-${qualityBadge}`}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header className="chart-card-header">
        <div>
          <h3 id={titleId}>{title}</h3>
          {subtitle ? <p className="chart-subtitle">{subtitle}</p> : null}
        </div>
        <span className={`quality-pill ${qualityBadge}`} aria-label={`Data quality: ${qualityBadge}`}>
          {qualityBadge}
        </span>
      </header>

      <p id={descriptionId} className="sr-only">
        {screenReaderSummary ?? subtitle ?? title}
      </p>

      <div className="chart-body">{children}</div>

      {sourceNote ? <footer className="chart-source-note">{sourceNote}</footer> : null}
    </article>
  );
}
```

## Color tokens

```ts
export const vizColors = {
  neutral: {
    text: "#111827",
    mutedText: "#4B5563",
    grid: "#E5E7EB",
    panel: "#FFFFFF",
    context: "#9CA3AF",
  },
  emphasis: {
    primary: "#005AB5",
  },
  categorical: [
    "#005AB5",
    "#7B3294",
    "#A56315",
    "#235F58",
    "#4B5563",
    "#B42318",
  ],
  sequential: [
    "#F1F7FF",
    "#B9D7FF",
    "#6EA8FE",
    "#2D5BE3",
    "#173B8F",
  ],
  quality: {
    ok: "#235F58",
    warn: "#A56315",
    block: "#B42318",
    unknown: "#4B5563",
  },
  disasterStatus: {
    unknown: "#6B7280",
    unstable: "#B42318",
    stabilizing: "#A56315",
    stable: "#235F58",
    administrative: "#005AB5",
  },
} as const;
```

## SKILL.md template

```md
---
name: dataviz-disaster-dashboard
description: Apply disaster-dashboard visualization standards whenever creating, editing, or reviewing a chart, KPI, table, map, title, annotation, color, or dashboard layout.
---

# Disaster Dashboard Visualization Standards

Use this skill for every dashboard visualization.

## Operating rule

Hard rules are enforced by code. Do not override `enforceVizPolicy()` output.

## Start with analytical intent

- trend: line
- comparison: bar
- ranking: sorted bar
- relationship: scatter
- part-to-whole: stacked bar; pie only for small valid cases
- spatial rate: choropleth only when normalized
- spatial count: fallback to bar/table unless proportional symbol support exists

## Non-negotiable rules

- No 3D charts.
- No raw-count choropleths.
- No color-only status encoding.
- No unreadable contrast.
- No rotated axis labels.
- No pie with too many slices.
- Every chart needs title, subtitle or context, unit when applicable, and quality status.

## LLM-owned text

You may write:
- title;
- subtitle;
- annotation label;
- rationale;
- caveat wording.

You may not change:
- chart type;
- sort order;
- color semantics;
- quality badge;
- map normalization;
- validation result.
```
