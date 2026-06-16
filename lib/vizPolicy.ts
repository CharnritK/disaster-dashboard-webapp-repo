import type { Dataset } from "@/types/dataset";
import type { QualityCheckResult } from "@/types/quality";
import type {
  ChartRecommendation,
  MeasureType,
  QualityBadge,
} from "@/types/recommendations";
import { aggregateRows, fieldDisplayLabel, inferMetricAggregation } from "./chartMetrics";
import {
  VIZ_POLICY_DEFAULTS,
  defaultMobileBehavior,
  defaultSort,
} from "./vizRules";

export type VizPolicyOptions = {
  maxPieCategories?: number;
  maxMapClasses?: number;
  hasBoundaryGeometry?: boolean;
};

type RiskColumn = {
  badge: Exclude<QualityBadge, "ok">;
  caveat: string;
  column: string;
};

const NORMALIZED_MAP_MEASURES: MeasureType[] = [
  "rate",
  "ratio",
  "density",
  "index",
];

export function enforceVizPolicy(
  dataset: Dataset,
  qualityResults: QualityCheckResult[],
  chart: ChartRecommendation,
  options: VizPolicyOptions = {},
): ChartRecommendation {
  const config = { ...VIZ_POLICY_DEFAULTS, ...options };
  const next: ChartRecommendation = {
    ...chart,
    annotations: chart.annotations?.map((annotation) => ({ ...annotation })),
    supportedInsightIds: chart.supportedInsightIds
      ? [...chart.supportedInsightIds]
      : undefined,
  };
  const groupField = next.groupByField ?? next.xField;
  const metricField = next.metricField ?? next.yField;
  const aggregation = next.aggregation ?? inferMetricAggregation(metricField);
  const categoryCount = getCategoryCount(dataset, groupField);

  if (next.chartType === "pie") {
    if (categoryCount > config.maxPieCategories) {
      next.chartType = "bar";
      next.sortBy = "value_desc";
      next.rationale = appendReason(
        next.rationale,
        "Converted from pie to bar because there are too many categories for a reliable part-to-whole view.",
      );
    } else if (aggregation === "average" || !hasPositivePartToWholeValues(dataset, next)) {
      next.chartType = "bar";
      next.sortBy = "value_desc";
      next.rationale = appendReason(
        next.rationale,
        "Converted from pie to bar because part-to-whole charts require positive additive values.",
      );
    }
  }

  if (next.chartType === "line" && !hasAtLeastTwoTimePoints(dataset, next.xField ?? next.groupByField)) {
    next.chartType = "bar";
    next.sortBy = "value_desc";
    next.rationale = appendReason(
      next.rationale,
      "Converted from line to bar because fewer than two valid time points are available.",
    );
  }

  if (next.chartType === "choropleth") {
    const normalized = NORMALIZED_MAP_MEASURES.includes(next.measureType ?? "count");
    if (!normalized || !config.hasBoundaryGeometry) {
      next.chartType = next.fallbackChartType ?? "bar";
      next.section = next.section ?? "location";
      next.sortBy = "value_desc";
      next.rationale = appendReason(
        next.rationale,
        normalized
          ? "Converted from choropleth because verified boundary geometry is not available in this app."
          : "Converted from choropleth because raw counts must not be encoded as area fill.",
      );
    }
    next.classCount = Math.min(
      next.classCount ?? 5,
      config.maxMapClasses,
    );
    next.classificationMethod = next.classificationMethod ?? "quantile";
  }

  if (next.chartType === "map" && !hasUsableCoordinateFields(dataset, next)) {
    next.chartType = "table";
    next.section = next.section ?? "details";
    next.rationale = appendReason(
      next.rationale,
      "Converted from coordinate map because the required latitude and longitude fields are not available.",
    );
  }

  const risk = highestRiskForChart(next, highRiskColumns(qualityResults));
  if (risk) {
    next.qualityBadge = risk.badge;
    next.sourceNote = appendReason(next.sourceNote, risk.caveat);
  } else {
    next.qualityBadge = "ok";
  }

  next.sortBy = next.sortBy ?? defaultSort(next.chartType);
  next.mobileBehavior = next.mobileBehavior ?? defaultMobileBehavior(next.chartType, categoryCount);
  next.maxCategories = next.maxCategories ?? defaultMaxCategories(next.mobileBehavior, categoryCount);
  next.unit = next.unit ?? inferUnit(metricField, aggregation);
  next.subtitle = next.subtitle ?? buildSubtitle(next, groupField);
  next.screenReaderSummary = next.screenReaderSummary ?? buildScreenReaderSummary(next);
  next.sourceNote = appendReason(
    next.sourceNote,
    buildSourceNote(dataset, next, groupField, metricField),
  );

  return next;
}

export function enforceVizPolicies(
  dataset: Dataset,
  qualityResults: QualityCheckResult[],
  charts: ChartRecommendation[],
  options: VizPolicyOptions = {},
) {
  return charts.map((chart) =>
    enforceVizPolicy(dataset, qualityResults, chart, options),
  );
}

function getCategoryCount(dataset: Dataset, groupField?: string) {
  if (!groupField) return 0;
  const values = new Set(
    (dataset.data ?? [])
      .map((row) => row[groupField])
      .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
      .map((value) => String(value)),
  );
  return values.size;
}

function hasPositivePartToWholeValues(
  dataset: Dataset,
  chart: ChartRecommendation,
) {
  const groupField = chart.groupByField ?? chart.xField;
  if (!groupField) return false;
  const aggregation = chart.aggregation ?? inferMetricAggregation(chart.metricField ?? chart.yField);
  const grouped = aggregateRows(dataset.data ?? [], groupField, chart.metricField ?? chart.yField, aggregation);
  if (grouped.length === 0) return false;
  return grouped.every((item) => item.value >= 0) &&
    grouped.some((item) => item.value > 0);
}

function hasAtLeastTwoTimePoints(dataset: Dataset, timeField?: string) {
  if (!timeField) return false;
  const validTimes = new Set(
    (dataset.data ?? [])
      .map((row) => row[timeField])
      .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
      .map((value) => Date.parse(String(value)))
      .filter((value) => Number.isFinite(value)),
  );
  return validTimes.size >= 2;
}

function hasUsableCoordinateFields(
  dataset: Dataset,
  chart: ChartRecommendation,
) {
  const latitudeField = chart.yField;
  const longitudeField = chart.xField;
  if (!latitudeField || !longitudeField) return false;
  const rows = dataset.data ?? [];
  const validPairs = rows.filter((row) =>
    isLatitude(row[latitudeField]) && isLongitude(row[longitudeField]),
  );
  return validPairs.length >= 2;
}

function highRiskColumns(qualityResults: QualityCheckResult[]): RiskColumn[] {
  return qualityResults.flatMap((issue) => {
    if (!issue.affectedColumns?.length) return [];
    const badge = issue.severity === "high" || issue.status === "fail"
      ? "block"
      : issue.severity === "medium" || issue.status === "warning"
        ? "warn"
        : undefined;
    if (!badge) return [];
    const caveat = issue.caveat ?? issue.suggestedAction ?? issue.description;
    return issue.affectedColumns.map((column) => ({
      badge,
      caveat,
      column,
    }));
  });
}

function highestRiskForChart(
  chart: ChartRecommendation,
  risks: RiskColumn[],
) {
  const fields = new Set([
    chart.groupByField,
    chart.xField,
    chart.metricField,
    chart.yField,
    chart.geoKey,
    chart.dataKey,
  ].filter((field): field is string => Boolean(field)));
  const matches = risks.filter((risk) => fields.has(risk.column));
  return matches.find((risk) => risk.badge === "block") ?? matches[0];
}

function defaultMaxCategories(
  mobileBehavior: ChartRecommendation["mobileBehavior"],
  categoryCount: number,
) {
  if (mobileBehavior === "top5") return Math.min(categoryCount, 5);
  return undefined;
}

function inferUnit(
  metricField: string | undefined,
  aggregation: ChartRecommendation["aggregation"],
) {
  if (!metricField && aggregation === "count") return "records";
  const field = (metricField ?? "").toLowerCase();
  if (/(percent|percentage|pct)/.test(field)) return "%";
  if (/(rate|ratio|index|score)/.test(field)) return "index";
  if (/(population|household|count|total|capacity|occupied|affected)/.test(field)) {
    return "count";
  }
  return undefined;
}

function buildSubtitle(
  chart: ChartRecommendation,
  groupField?: string,
) {
  const parts = [
    chart.unit ? formatUnit(chart.unit) : undefined,
    groupField ? fieldDisplayLabel(groupField) : undefined,
    chart.timeScope,
    chart.mobileBehavior === "top5" ? "Top 5 on mobile" : undefined,
  ].filter(Boolean);
  return parts.join(" · ") || undefined;
}

function buildScreenReaderSummary(chart: ChartRecommendation) {
  const fields = [
    chart.groupByField ?? chart.xField,
    chart.metricField ?? chart.yField,
  ]
    .filter((field): field is string => Boolean(field))
    .map(fieldDisplayLabel);
  const fieldSummary = fields.length ? ` Fields: ${fields.join(", ")}.` : "";
  const qualitySummary =
    chart.qualityBadge && chart.qualityBadge !== "ok"
      ? ` Quality status: ${chart.qualityBadge}.`
      : "";
  return `${chart.title}. ${chart.rationale}${fieldSummary}${qualitySummary}`;
}

function formatUnit(unit: string) {
  if (unit === "%") return "Percent";
  return fieldDisplayLabel(unit);
}

function buildSourceNote(
  dataset: Dataset,
  chart: ChartRecommendation,
  groupField?: string,
  metricField?: string,
) {
  const sourceName = dataset.originalFilename ?? dataset.name;
  const rowCount = dataset.rowCount ?? dataset.data?.length ?? dataset.profile?.rowCount;
  const rowCountNote = rowCount === undefined
    ? "row count unavailable"
    : `${rowCount.toLocaleString()} rows`;
  const fieldNotes = [
    groupField ? `grouped by ${fieldDisplayLabel(groupField)}` : undefined,
    metricField ? `measured with ${fieldDisplayLabel(metricField)}` : undefined,
  ].filter(Boolean);
  const methodNote = fieldNotes.length
    ? `Chart uses ${fieldNotes.join(" and ")}.`
    : "Chart uses dataset-level summary fields.";
  const mobileNote =
    chart.mobileBehavior === "top5" && chart.maxCategories
      ? `Mobile view limits categories to top ${chart.maxCategories}.`
      : chart.mobileBehavior === "table-fallback"
        ? "Mobile view may use a table-first fallback."
        : undefined;
  const fallbackNote =
    chart.fallbackChartType && chart.chartType === chart.fallbackChartType
      ? "This chart is a policy fallback from a higher-risk map view."
      : undefined;
  return [
    `Source: ${sourceName} (${rowCountNote}).`,
    methodNote,
    mobileNote,
    fallbackNote,
    "Review caveats and validation results before operational use.",
  ]
    .filter(Boolean)
    .join(" ");
}

function appendReason(existing: string | undefined, addition: string) {
  if (!existing) return addition;
  if (existing.includes(addition)) return existing;
  return `${existing} ${addition}`;
}

function isLatitude(value: unknown) {
  const number = finiteNumber(value);
  return number !== undefined && number >= -90 && number <= 90;
}

function isLongitude(value: unknown) {
  const number = finiteNumber(value);
  return number !== undefined && number >= -180 && number <= 180;
}

function finiteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}
