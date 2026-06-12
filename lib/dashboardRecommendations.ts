import type { Dataset } from "@/types/dataset";
import type { ChartRecommendation, DashboardInsight, DashboardInsightFact, DashboardRecommendation } from "@/types/recommendations";
import type { QualityCheckResult } from "@/types/quality";
import type { TransformationStep } from "@/types/transformations";
import { fieldDisplayLabel, inferMetricAggregation } from "./chartMetrics";
import { computeDashboardInsightFacts, factsToDashboardInsights } from "./dashboardInsights";
import { findLocationFields, isCoordinateField, isLatitudeField, isLongitudeField } from "./locationFields";
import { enforceVizPolicies } from "./vizPolicy";

const MAX_SUMMARY_METRICS = 5;
const MAX_FIELDS = 8;
const MAX_CHARTS = 10;
const MAX_INSIGHTS = 6;

export function generateDeterministicDashboardRecommendation(
  dataset: Dataset,
  context: {
    dashboardFacts?: DashboardInsightFact[];
    qualityResults?: QualityCheckResult[];
    transformationLog?: TransformationStep[];
  } = {}
): DashboardRecommendation {
  const profile = dataset.profile;
  const metricFields = getNumericMetricFields(dataset).slice(0, MAX_FIELDS);
  const groupByFields = getCategoricalFields(dataset).slice(0, MAX_FIELDS);
  const dateFields = profile?.columns
    .filter((column) => column.inferredType === "date")
    .map((column) => column.columnName) ?? [];
  const primaryGroup = groupByFields[0];
  const primaryMetric = metricFields[0];
  const secondaryGroup = groupByFields.find((field) => field !== primaryGroup);
  const secondaryMetric = metricFields.find((field) => field !== primaryMetric);
  const missingColumns = profile?.columns.filter((column) => column.missingCount > 0) ?? [];
  const locationFields = findLocationFields(dataset);
  const charts = buildDeterministicCharts({
    primaryGroup,
    primaryMetric,
    secondaryGroup,
    secondaryMetric,
    dateField: dateFields[0],
    groupByFields,
    metricFields,
    hasMissingValues: missingColumns.length > 0,
    locationFields
  });
  const caveatedCharts = applyChartCaveats(charts, context.qualityResults);
  const policyCharts = enforceVizPolicies(
    dataset,
    context.qualityResults ?? [],
    caveatedCharts
  );

  return {
    summaryMetrics: uniqueValues(["Total records", ...metricFields.slice(0, MAX_SUMMARY_METRICS - 1)]),
    groupByFields,
    demographicFields: (profile?.potentialDemographicFields ?? []).filter((field) => groupByFields.includes(field)).slice(0, MAX_FIELDS),
    metricFields,
    charts: policyCharts,
    insights: buildDeterministicInsights(dataset, policyCharts, context)
  };
}

export function reconcileDashboardRecommendation(
  dataset: Dataset,
  recommendation?: DashboardRecommendation,
  context: {
    qualityResults?: QualityCheckResult[];
  } = {}
): DashboardRecommendation {
  const fallback = generateDeterministicDashboardRecommendation(dataset, context);
  if (!recommendation) return fallback;

  const fields = new Set(dataset.columns ?? dataset.profile?.columns.map((column) => column.columnName) ?? []);
  const metricFieldSet = new Set(getNumericMetricFields(dataset));
  const numericFields = new Set(getNumericFields(dataset));
  const normalizedRecommendation = normalizeDashboardFields(
    recommendation,
    fields,
    metricFieldSet,
    numericFields
  );
  const summaryMetrics = mergeValues(
    normalizedRecommendation.summaryMetrics,
    fallback.summaryMetrics,
    MAX_SUMMARY_METRICS
  );
  const groupByFields = mergeValues(
    normalizedRecommendation.groupByFields,
    fallback.groupByFields,
    MAX_FIELDS
  );
  const demographicFields = mergeValues(
    normalizedRecommendation.demographicFields,
    fallback.demographicFields,
    MAX_FIELDS
  );
  const metricFields = mergeValues(
    normalizedRecommendation.metricFields,
    fallback.metricFields,
    MAX_FIELDS
  );
  const charts = enforceVizPolicies(
    dataset,
    context.qualityResults ?? [],
    mergeCharts(
      normalizedRecommendation.charts.filter((chart) =>
        isUsableChart(chart, fields, metricFieldSet, numericFields)
      ),
      fallback.charts
    )
  );

  return {
    summaryMetrics,
    groupByFields,
    demographicFields,
    metricFields,
    charts,
    insights: normalizeInsightLinks(
      mergeInsights(normalizedRecommendation.insights ?? [], fallback.insights ?? []),
      charts
    )
  };
}

function buildDeterministicCharts({
  primaryGroup,
  primaryMetric,
  secondaryGroup,
  secondaryMetric,
  dateField,
  groupByFields,
  metricFields,
  hasMissingValues,
  locationFields
}: {
  primaryGroup?: string;
  primaryMetric?: string;
  secondaryGroup?: string;
  secondaryMetric?: string;
  dateField?: string;
  groupByFields: string[];
  metricFields: string[];
  hasMissingValues: boolean;
  locationFields: ReturnType<typeof findLocationFields>;
}): ChartRecommendation[] {
  const charts: ChartRecommendation[] = [];

  if (
    locationFields.latitudeField &&
    locationFields.longitudeField &&
    locationFields.validCoordinateRowCount >= 2
  ) {
    const primaryMetricLabel = primaryMetric
      ? fieldDisplayLabel(primaryMetric)
      : "Records";
    charts.push({
      id: `chart-map-${slugify(locationFields.latitudeField)}-${slugify(locationFields.longitudeField)}`,
      chartType: "map",
      title: primaryMetric
        ? `${primaryMetricLabel} by uploaded location`
        : "Uploaded location coverage",
      xField: locationFields.longitudeField,
      yField: locationFields.latitudeField,
      groupByField: locationFields.labelField,
      metricField: primaryMetric,
      aggregation: primaryMetric ? inferMetricAggregation(primaryMetric) : "count",
      section: "location",
      priority: 1,
      rationale:
        "Plots uploaded latitude and longitude values locally. No geocoding, basemap tiles, or boundary geometry are used, so treat this as a coordinate coverage view rather than an authoritative map.",
      supportedInsightIds: ["fact-location-coverage"]
    });
  }

  if (locationFields.areaField) {
    const areaLabel = fieldDisplayLabel(locationFields.areaField);
    const primaryMetricLabel = primaryMetric
      ? fieldDisplayLabel(primaryMetric)
      : "Records";
    charts.push({
      id: `chart-area-${slugify(locationFields.areaField)}-${slugify(primaryMetric ?? "records")}`,
      chartType: "area",
      title: `${primaryMetricLabel} by ${areaLabel}`,
      groupByField: locationFields.areaField,
      metricField: primaryMetric,
      aggregation: primaryMetric ? inferMetricAggregation(primaryMetric) : "count",
      section: "location",
      priority: 2,
      rationale:
        `Compares ${primaryMetricLabel.toLowerCase()} across ${areaLabel}. This is an area intensity view from uploaded fields, not a boundary choropleth.`,
      supportedInsightIds: ["fact-location-coverage"]
    });
  }

  if (primaryGroup) {
    const primaryGroupLabel = fieldDisplayLabel(primaryGroup);
    const primaryMetricLabel = primaryMetric ? fieldDisplayLabel(primaryMetric) : "Records";
    charts.push({
      id: `chart-${slugify(primaryGroup)}-${slugify(primaryMetric ?? "records")}`,
      chartType: "bar",
      title: `${primaryMetricLabel} by ${primaryGroupLabel}`,
      groupByField: primaryGroup,
      metricField: primaryMetric,
      aggregation: primaryMetric ? inferMetricAggregation(primaryMetric) : "count",
      section: "comparisons",
      priority: 1,
      rationale: primaryMetric
        ? `Compares ${primaryMetricLabel} across ${primaryGroupLabel} to surface where values are concentrated.`
        : `Compares record volume across ${primaryGroupLabel}.`
    });
  }

  if (secondaryGroup) {
    const secondaryGroupLabel = fieldDisplayLabel(secondaryGroup);
    charts.push({
      id: `chart-breakdown-${slugify(secondaryGroup)}`,
      chartType: "pie",
      title: `Share by ${secondaryGroupLabel}`,
      groupByField: secondaryGroup,
      aggregation: "count",
      section: "comparisons",
      priority: 3,
      rationale: `Shows the part-to-whole distribution across ${secondaryGroupLabel}.`
    });
  }

  if (dateField) {
    const dateFieldLabel = fieldDisplayLabel(dateField);
    const primaryMetricLabel = primaryMetric ? fieldDisplayLabel(primaryMetric) : "Records";
    charts.push({
      id: `chart-trend-${slugify(dateField)}`,
      chartType: "line",
      title: `${primaryMetricLabel} over ${dateFieldLabel}`,
      xField: dateField,
      metricField: primaryMetric,
      aggregation: primaryMetric ? inferMetricAggregation(primaryMetric) : "count",
      section: "comparisons",
      priority: 2,
      rationale: `Shows whether ${primaryMetricLabel.toLowerCase()} changes over time.`,
      supportedInsightIds: [`fact-trend-${slugify(dateField)}-${slugify(primaryMetric ?? "records")}`]
    });
  }

  if (primaryMetric && secondaryMetric) {
    const primaryMetricLabel = fieldDisplayLabel(primaryMetric);
    const secondaryMetricLabel = fieldDisplayLabel(secondaryMetric);
    charts.push({
      id: `chart-scatter-${slugify(primaryMetric)}-${slugify(secondaryMetric)}`,
      chartType: "scatter",
      title: `${secondaryMetricLabel} vs ${primaryMetricLabel}`,
      xField: primaryMetric,
      yField: secondaryMetric,
      metricField: secondaryMetric,
      aggregation: "average",
      section: "comparisons",
      priority: 6,
      rationale: `Plots ${secondaryMetricLabel.toLowerCase()} against ${primaryMetricLabel.toLowerCase()} to inspect whether the two numeric signals move together.`,
      supportedInsightIds: [`fact-correlation-${slugify(primaryMetric)}-${slugify(secondaryMetric)}`]
    });
  }

  if (primaryGroup && secondaryMetric) {
    const primaryGroupLabel = fieldDisplayLabel(primaryGroup);
    const secondaryMetricLabel = fieldDisplayLabel(secondaryMetric);
    charts.push({
      id: `chart-${slugify(primaryGroup)}-${slugify(secondaryMetric)}`,
      chartType: "bar",
      title: `${secondaryMetricLabel} by ${primaryGroupLabel}`,
      groupByField: primaryGroup,
      metricField: secondaryMetric,
      aggregation: inferMetricAggregation(secondaryMetric),
      section: "comparisons",
      priority: 4,
      rationale: `Adds a second metric view so the dashboard is not anchored to a single outcome.`
    });
  }

  if (groupByFields[2]) {
    const groupLabel = fieldDisplayLabel(groupByFields[2]);
    charts.push({
      id: `chart-breakdown-${slugify(groupByFields[2])}`,
      chartType: "bar",
      title: `Records by ${groupLabel}`,
      groupByField: groupByFields[2],
      aggregation: "count",
      section: "comparisons",
      priority: 5,
      rationale: `Provides another categorical lens for operational review.`
    });
  }

  charts.push({
    id: "chart-dashboard-signals",
    chartType: "summary",
    title: "Dashboard signals",
    groupByField: primaryGroup,
    metricField: primaryMetric,
    aggregation: primaryMetric ? inferMetricAggregation(primaryMetric) : "count",
    section: "overview",
    priority: 1,
    rationale: "Summarizes the field roles the dashboard is using for comparison, metrics, and review."
  });

  if (hasMissingValues) {
    charts.push({
      id: "chart-missingness",
      chartType: "missingness",
      title: "Missing values by column",
      aggregation: "count",
      section: "quality",
      priority: 1,
      rationale: "Shows which columns have the most missing values before interpreting charts or exports.",
      supportedInsightIds: ["fact-missing-values"]
    });
  }

  charts.push({
    id: `chart-ranked-${slugify(primaryMetric ?? "records")}`,
    chartType: "table",
    title: primaryMetric ? `Highest ${fieldDisplayLabel(primaryMetric)} records` : "Dataset records to review",
    metricField: primaryMetric,
    aggregation: primaryMetric ? inferMetricAggregation(primaryMetric) : "count",
    section: "details",
    priority: 1,
    rationale: primaryMetric
      ? `Keeps the top rows behind the aggregate views visible for review.`
      : "Keeps the underlying records visible when no numeric metric is available."
  });

  if (charts.length === 2 && metricFields[1]) {
    charts.unshift({
      id: `chart-summary-${slugify(metricFields[1])}`,
      chartType: "summary",
      title: `${fieldDisplayLabel(metricFields[1])} signal`,
      metricField: metricFields[1],
      aggregation: inferMetricAggregation(metricFields[1]),
      section: "overview",
      priority: 2,
      rationale: `Highlights ${metricFields[1]} as an additional numeric signal.`
    });
  }

  return uniqueCharts(charts).slice(0, MAX_CHARTS);
}

function buildDeterministicInsights(
  dataset: Dataset,
  charts: ChartRecommendation[],
  context: {
    dashboardFacts?: DashboardInsightFact[];
    qualityResults?: QualityCheckResult[];
    transformationLog?: TransformationStep[];
  } = {}
): DashboardInsight[] {
  const facts =
    context.dashboardFacts ??
    computeDashboardInsightFacts(
      dataset,
      context.qualityResults,
      context.transformationLog
    );
  return factsToDashboardInsights(facts, linkFactsToCharts(facts, charts));
}

function applyChartCaveats(
  charts: ChartRecommendation[],
  qualityResults: QualityCheckResult[] = []
) {
  const caveats = qualityResults
    .filter((issue) => issue.caveat && issue.affectedColumns?.length)
    .flatMap((issue) =>
      (issue.affectedColumns ?? []).map((column) => ({
        column,
        caveat: issue.caveat!,
      }))
    );
  if (caveats.length === 0) return charts;
  return charts.map((chart) => {
    const chartFields = [
      chart.groupByField,
      chart.xField,
      chart.metricField,
      chart.yField,
    ].filter((field): field is string => Boolean(field));
    const matchedCaveats = caveats
      .filter((item) => chartFields.includes(item.column))
      .map((item) => item.caveat);
    if (matchedCaveats.length === 0) return chart;
    const uniqueCaveats = Array.from(new Set(matchedCaveats));
    return {
      ...chart,
      rationale: `${chart.rationale} Caveat: ${uniqueCaveats.join(" ")}`,
    };
  });
}

function linkFactsToCharts(facts: DashboardInsightFact[], charts: ChartRecommendation[]) {
  const linked = new Map<string, string>();
  for (const fact of facts) {
    const chart = charts.find((candidate) =>
      candidate.supportedInsightIds?.includes(fact.id) ||
      (fact.metricField &&
        (candidate.metricField === fact.metricField || candidate.yField === fact.metricField)) ||
      (fact.groupField &&
        (candidate.groupByField === fact.groupField || candidate.xField === fact.groupField)) ||
      (fact.categoryField &&
        (candidate.groupByField === fact.categoryField || candidate.xField === fact.categoryField))
    );
    if (chart) linked.set(fact.id, chart.id);
  }
  return linked;
}

function getNumericMetricFields(dataset: Dataset) {
  const profile = dataset.profile;
  const fields = profile?.columns
    .filter((column) => column.inferredType === "number" && !isCoordinateField(column.columnName))
    .map((column) => column.columnName) ?? [];
  return mergeValues(fields, profile?.potentialMetricFields.filter((field) => fields.includes(field)) ?? [], MAX_FIELDS);
}

function getNumericFields(dataset: Dataset) {
  return dataset.profile?.columns
    .filter((column) => column.inferredType === "number")
    .map((column) => column.columnName) ?? [];
}

function getCategoricalFields(dataset: Dataset) {
  const profile = dataset.profile;
  if (!profile) return dataset.columns?.filter((field) => !isCoordinateField(field)).slice(0, MAX_FIELDS) ?? [];
  const fieldNames = new Set(profile.columns.map((column) => column.columnName));
  const profileCategories = profile.columns
    .filter((column) =>
      fieldNames.has(column.columnName) &&
      !isCoordinateField(column.columnName) &&
      column.inferredType !== "number" &&
      column.inferredType !== "date" &&
      column.uniqueCount > 1 &&
      column.uniqueCount <= Math.max(12, Math.ceil((profile.rowCount ?? 1) * 0.7))
    )
    .map((column) => column.columnName);
  return mergeValues(
    [
      ...profile.potentialGeographicFields.filter((field) => !isCoordinateField(field)),
      ...profile.potentialDemographicFields,
      ...profileCategories
    ],
    [],
    MAX_FIELDS
  );
}

function isUsableChart(
  chart: ChartRecommendation,
  fields: Set<string>,
  metricFields: Set<string>,
  numericFields: Set<string>
) {
  const metricField = chart.metricField ?? chart.yField;
  const groupingField = chart.groupByField ?? chart.xField;
  const aggregation = chart.aggregation ?? inferMetricAggregation(metricField);
  if (chart.groupByField && !fields.has(chart.groupByField)) return false;
  if (chart.xField && !fields.has(chart.xField)) return false;
  if (chart.yField && !fields.has(chart.yField)) return false;
  if (chart.chartType === "map") {
    const hasLatLonAxes =
      chart.xField && chart.yField &&
      ((isLongitudeField(chart.xField) && isLatitudeField(chart.yField)) ||
        (isLatitudeField(chart.xField) && isLongitudeField(chart.yField)));
    return Boolean(
      chart.xField &&
        chart.yField &&
        hasLatLonAxes &&
        numericFields.has(chart.xField) &&
        numericFields.has(chart.yField) &&
        (!chart.metricField || metricFields.has(chart.metricField))
    );
  }
  if (metricField && !metricFields.has(metricField)) return false;
  if (chart.chartType === "summary") return true;
  if (chart.chartType === "missingness") return true;
  if (chart.chartType === "area") return Boolean(chart.groupByField);
  if (chart.chartType === "table") return !metricField || metricFields.has(metricField);
  if (chart.chartType === "scatter") {
    const scatterYField = chart.yField ?? chart.metricField;
    return Boolean(
      chart.xField &&
      scatterYField &&
      numericFields.has(chart.xField) &&
      numericFields.has(scatterYField)
    );
  }
  if (chart.chartType === "pie" && aggregation === "average") return false;
  return Boolean(groupingField);
}

function mergeCharts(primary: ChartRecommendation[], fallback: ChartRecommendation[]) {
  if (primary.length === 0) {
    return uniqueCharts(fallback)
      .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50))
      .slice(0, MAX_CHARTS);
  }
  const primaryCharts = uniqueCharts(primary)
    .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
  const fallbackCharts = fallback.map((chart) => ({
    ...chart,
    priority: (chart.priority ?? 50) + 100
  }));
  return uniqueCharts([...primaryCharts, ...fallbackCharts])
    .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50))
    .slice(0, MAX_CHARTS);
}

function normalizeDashboardFields(
  recommendation: DashboardRecommendation,
  fields: Set<string>,
  metricFields: Set<string>,
  numericFields: Set<string>
): DashboardRecommendation {
  return {
    ...recommendation,
    summaryMetrics: recommendation.summaryMetrics
      .map((metric) => normalizeSummaryMetric(metric, metricFields))
      .filter((field): field is string => Boolean(field)),
    groupByFields: recommendation.groupByFields
      .map((field) => normalizeFieldName(field, fields))
      .filter((field): field is string => Boolean(field)),
    demographicFields: recommendation.demographicFields
      .map((field) => normalizeFieldName(field, fields))
      .filter((field): field is string => Boolean(field)),
    metricFields: recommendation.metricFields
      .map((field) => normalizeFieldName(field, metricFields))
      .filter((field): field is string => Boolean(field)),
    charts: recommendation.charts.map((chart) => ({
      ...chart,
      xField: normalizeFieldName(chart.xField, fields),
      yField: normalizeFieldName(chart.yField, numericFields),
      groupByField: normalizeFieldName(chart.groupByField, fields),
      metricField: normalizeFieldName(chart.metricField, metricFields)
    }))
  };
}

function normalizeSummaryMetric(metric: string, numericFields: Set<string>) {
  const normalized = normalizeLabel(metric);
  if (
    normalized === "totalrecords" ||
    normalized === "recordcount" ||
    normalized === "recordvolume" ||
    normalized === "records"
  ) {
    return "Total records";
  }
  return normalizeFieldName(
    stripMetricPrefix(metric),
    numericFields
  );
}

function normalizeFieldName(value: string | undefined, fields: Set<string>) {
  if (!value) return undefined;
  if (fields.has(value)) return value;
  const normalizedValue = normalizeLabel(value);
  const prefixStrippedValue = normalizeLabel(stripMetricPrefix(value));
  return Array.from(fields).find((field) => {
    const normalizedField = normalizeLabel(field);
    return normalizedField === normalizedValue || normalizedField === prefixStrippedValue;
  });
}

function normalizeLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function stripMetricPrefix(value: string) {
  return value.replace(/^(average|avg|mean|total|sum|count)\s+/i, "").trim();
}

function uniqueCharts(charts: ChartRecommendation[]) {
  const seen = new Set<string>();
  return charts.filter((chart) => {
    const key = `${chart.chartType}-${chart.title.toLowerCase()}-${chart.groupByField ?? chart.xField ?? ""}-${chart.metricField ?? chart.yField ?? ""}`;
    if (seen.has(chart.id) || seen.has(key)) return false;
    seen.add(chart.id);
    seen.add(key);
    return true;
  });
}

function mergeInsights(primary: DashboardInsight[], fallback: DashboardInsight[]) {
  const seen = new Set<string>();
  return [...primary, ...fallback]
    .filter((insight) => {
      const key = insight.id || insight.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_INSIGHTS);
}

function normalizeInsightLinks(insights: DashboardInsight[], charts: ChartRecommendation[]) {
  const chartIds = new Set(charts.map((chart) => chart.id));
  return insights.map((insight) => {
    const supportedChart = charts.find((chart) =>
      chartSupportsInsight(chart, insight)
    );
    const fieldMatchedChart = charts.find((chart) =>
      insightMentionsChartField(insight, chart)
    );
    return {
      ...insight,
      linkedChartId:
        insight.linkedChartId && chartIds.has(insight.linkedChartId)
          ? insight.linkedChartId
          : supportedChart?.id ?? fieldMatchedChart?.id
    };
  });
}

function chartSupportsInsight(
  chart: ChartRecommendation,
  insight: DashboardInsight
) {
  if (!chart.supportedInsightIds?.length) return false;
  const ids = insightCandidateIds(insight.id);
  return chart.supportedInsightIds.some((id) => ids.has(id));
}

function insightCandidateIds(id: string) {
  const ids = new Set([id]);
  if (id.startsWith("insight-")) ids.add(`fact-${id.slice("insight-".length)}`);
  if (id.startsWith("fact-")) ids.add(`insight-${id.slice("fact-".length)}`);
  return ids;
}

function insightMentionsChartField(
  insight: DashboardInsight,
  chart: ChartRecommendation
) {
  const fields = [
    chart.groupByField,
    chart.xField,
    chart.metricField,
    chart.yField
  ]
    .filter((field): field is string => Boolean(field));
  if (fields.length === 0) return false;

  const rawText = [
    insight.title,
    insight.description,
    insight.recommendedAction,
    ...(insight.evidence ?? [])
  ].join(" ");
  const normalizedText = normalizeLabel(rawText);
  const lowerText = rawText.toLowerCase();
  return fields.some((field) => {
    const labels = [field, fieldDisplayLabel(field)];
    if (labels.map(normalizeLabel).some((label) => label && normalizedText.includes(label))) {
      return true;
    }
    const words = fieldDisplayLabel(field)
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !["total", "count", "percent", "percentage"].includes(word));
    return words.length > 0 && words.every((word) => lowerText.includes(word));
  });
}

function mergeValues(primary: string[], fallback: string[], limit: number) {
  return uniqueValues([...primary, ...fallback]).slice(0, limit);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "field";
}
