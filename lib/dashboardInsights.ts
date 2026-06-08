import type { Dataset } from "@/types/dataset";
import type { QualityCheckResult } from "@/types/quality";
import type {
  DashboardInsight,
  DashboardInsightFact,
  DashboardInsightType,
} from "@/types/recommendations";
import type { TransformationStep } from "@/types/transformations";
import { aggregateRows, fieldDisplayLabel, inferMetricAggregation, metricDisplayLabel, toNumber } from "./chartMetrics";

const MAX_FACTS = 14;

export function computeDashboardInsightFacts(
  dataset: Dataset,
  qualityResults: QualityCheckResult[] = [],
  transformationLog: TransformationStep[] = [],
): DashboardInsightFact[] {
  const facts: DashboardInsightFact[] = [];
  const rows = dataset.data ?? [];
  const profile = dataset.profile;
  const numericFields =
    profile?.columns
      .filter((column) => column.inferredType === "number" && !isCoordinateField(column.columnName))
      .map((column) => column.columnName) ?? [];
  const dateFields =
    profile?.columns
      .filter((column) => column.inferredType === "date")
      .map((column) => column.columnName) ?? [];
  const categoricalFields =
    profile?.columns
      .filter(
        (column) =>
          column.inferredType !== "number" &&
          column.inferredType !== "date" &&
          !isCoordinateField(column.columnName) &&
          column.uniqueCount > 1 &&
          column.uniqueCount <= Math.max(12, Math.ceil((profile.rowCount ?? rows.length) * 0.75)),
      )
      .map((column) => column.columnName) ?? [];
  const primaryMetric = numericFields[0];
  const primaryGroup = [
    ...(profile?.potentialGeographicFields.filter((field) => !isCoordinateField(field)) ?? []),
    ...(profile?.potentialDemographicFields ?? []),
    ...categoricalFields,
  ].find(Boolean);

  facts.push({
    id: "fact-record-volume",
    insightType: "coverage",
    title: "Record volume",
    description: `${rows.length.toLocaleString()} records are available for dashboard analysis.`,
    severity: "info",
    evidence: [
      `${rows.length.toLocaleString()} rows`,
      `${dataset.columnCount ?? dataset.columns?.length ?? 0} columns`,
    ],
    recommendedAction: "Use this as the dashboard scope when interpreting aggregate views.",
    confidence: 1,
  });

  if (primaryGroup && primaryMetric) {
    facts.push(...buildGroupMetricFacts(rows, primaryGroup, primaryMetric));
  }

  if (dateFields[0]) {
    facts.push(...buildTrendFacts(rows, dateFields[0], primaryMetric));
  }

  const concentrationField = categoricalFields.find((field) => field !== primaryGroup);
  if (concentrationField) {
    const concentration = topCategoryShare(rows, concentrationField);
    if (concentration) {
      facts.push({
        id: `fact-concentration-${slugify(concentrationField)}`,
        insightType: "concentration",
        title: `${fieldDisplayLabel(concentrationField)} concentration`,
        description: `${concentration.label} accounts for ${concentration.share}% of records in ${fieldDisplayLabel(concentrationField)}.`,
        severity: concentration.share >= 60 ? "medium" : "info",
        evidence: [
          `${concentration.label}: ${concentration.count.toLocaleString()} records`,
          `Total records with ${concentrationField}: ${concentration.total.toLocaleString()}`,
        ],
        recommendedAction:
          concentration.share >= 60
            ? "Check whether the dashboard is dominated by one category before generalizing findings."
            : "Use the breakdown view to compare how records are distributed across categories.",
        categoryField: concentrationField,
        confidence: 0.88,
      });
    }
  }

  facts.push(...buildMissingnessFacts(dataset));
  facts.push(...buildJoinCoverageFacts(rows));
  facts.push(...buildNumericRangeFacts(rows, numericFields));
  facts.push(...buildCorrelationFacts(rows, numericFields));
  facts.push(...buildQualityFacts(qualityResults));
  facts.push(...buildTransformationFacts(transformationLog));

  return uniqueFacts(facts)
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.confidence - a.confidence)
    .slice(0, MAX_FACTS);
}

export function factsToDashboardInsights(
  facts: DashboardInsightFact[],
  linkedChartIds: Map<string, string> = new Map(),
): DashboardInsight[] {
  return facts.slice(0, 6).map((fact) => ({
    id: `insight-${fact.id.replace(/^fact-/, "")}`,
    title: fact.title,
    description: fact.description,
    severity: fact.severity,
    insightType: fact.insightType,
    evidence: fact.evidence.slice(0, 4),
    recommendedAction: fact.recommendedAction,
    confidence: fact.confidence,
    linkedChartId: fact.linkedChartId ?? linkedChartIds.get(fact.id),
  }));
}

function buildGroupMetricFacts(
  rows: Record<string, unknown>[],
  groupField: string,
  metricField: string,
): DashboardInsightFact[] {
  const aggregation = inferMetricAggregation(metricField);
  const grouped = aggregateRows(rows, groupField, metricField, aggregation);
  if (grouped.length < 2) return [];
  const top = grouped[0];
  const bottom = grouped[grouped.length - 1];
  const total = grouped.reduce((sum, item) => sum + item.value, 0);
  const topShare = aggregation !== "average" && total > 0 ? Math.round((top.value / total) * 100) : 0;
  const metricLabel = metricDisplayLabel(metricField, aggregation).toLowerCase();
  return [
    {
      id: `fact-top-${slugify(metricField)}-${slugify(groupField)}`,
      insightType: "comparison",
      title: `Highest ${metricLabel}`,
      description: `${top.label} has the highest ${metricLabel} by ${fieldDisplayLabel(groupField)}.`,
      severity: topShare >= 50 ? "medium" : "info",
      evidence: [
        `${top.label}: ${formatNumber(top.value)}`,
        `${bottom.label}: ${formatNumber(bottom.value)}`,
        ...(topShare > 0 ? [`Top share: ${topShare}%`] : []),
      ],
      recommendedAction: "Compare the highest and lowest groups before deciding where to focus follow-up.",
      metricField,
      groupField,
      confidence: 0.92,
    },
  ];
}

function buildMissingnessFacts(dataset: Dataset): DashboardInsightFact[] {
  const missingColumns =
    dataset.profile?.columns
      .filter((column) => column.missingPercentage > 0)
      .sort((a, b) => b.missingPercentage - a.missingPercentage)
      .slice(0, 3) ?? [];
  if (missingColumns.length === 0) return [];
  return [
    {
      id: "fact-missing-values",
      insightType: "quality",
      title: "Missing values need review",
      description: `${fieldDisplayLabel(missingColumns[0].columnName)} has the highest missingness at ${missingColumns[0].missingPercentage}%.`,
      severity: missingColumns[0].missingPercentage >= 20 ? "high" : "medium",
      evidence: missingColumns.map(
        (column) => `${fieldDisplayLabel(column.columnName)}: ${column.missingPercentage}% missing`,
      ),
      recommendedAction: "Keep missingness visible when interpreting charts and exported reports.",
      confidence: 0.95,
    },
  ];
}

function buildTrendFacts(
  rows: Record<string, unknown>[],
  dateField: string,
  metricField?: string,
): DashboardInsightFact[] {
  const trend = aggregateTrendRows(rows, dateField, metricField);
  if (trend.length < 2) return [];
  const first = trend[0];
  const last = trend[trend.length - 1];
  const change = last.value - first.value;
  if (change === 0) return [];
  const percentChange =
    Math.abs(first.value) > 0 ? Math.round((change / Math.abs(first.value)) * 100) : undefined;
  const metricLabel = metricDisplayLabel(
    metricField,
    metricField ? inferMetricAggregation(metricField) : "count",
  ).toLowerCase();
  const direction = change > 0 ? "increased" : "decreased";
  const severity =
    percentChange !== undefined && Math.abs(percentChange) >= 50 ? "medium" : "info";

  return [
    {
      id: `fact-trend-${slugify(dateField)}-${slugify(metricField ?? "records")}`,
      insightType: "trend",
      title: `${fieldDisplayLabel(dateField)} trend`,
      description: `${metricLabel} ${direction} from ${first.label} to ${last.label}.`,
      severity,
      evidence: [
        `${first.label}: ${formatNumber(first.value)}`,
        `${last.label}: ${formatNumber(last.value)}`,
        percentChange === undefined
          ? `Change: ${formatNumber(change)}`
          : `Change: ${formatNumber(change)} (${percentChange}%)`,
      ],
      recommendedAction: "Use the trend view to check whether this movement is sustained across the timeline.",
      metricField,
      groupField: dateField,
      confidence: 0.82,
    },
  ];
}

function buildJoinCoverageFacts(rows: Record<string, unknown>[]): DashboardInsightFact[] {
  if (!rows.some((row) => "__join_matched" in row)) return [];
  const unmatched = rows.filter((row) => row.__join_matched === false).length;
  const share = rows.length > 0 ? Math.round((unmatched / rows.length) * 100) : 0;
  return [
    {
      id: "fact-join-coverage",
      insightType: "coverage",
      title: "Join coverage",
      description:
        unmatched > 0
          ? `${unmatched.toLocaleString()} records did not match during harmonization.`
          : "All joined records matched during harmonization.",
      severity: share >= 20 ? "high" : share > 0 ? "medium" : "info",
      evidence: [`Unmatched rows: ${unmatched.toLocaleString()}`, `Unmatched share: ${share}%`],
      recommendedAction:
        unmatched > 0
          ? "Review unmatched records before relying on joined metrics."
          : "Use joined metrics with the recorded transformation log.",
      confidence: 0.95,
    },
  ];
}

function buildNumericRangeFacts(
  rows: Record<string, unknown>[],
  numericFields: string[],
): DashboardInsightFact[] {
  return numericFields.slice(0, 2).flatMap((field) => {
    const values = rows.map((row) => toNumber(row[field])).filter((value) => value > 0);
    if (values.length < 2) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    const spread = min > 0 ? max / min : max;
    if (spread < 2) return [];
    return [
      {
        id: `fact-range-${slugify(field)}`,
        insightType: "outlier" as DashboardInsightType,
        title: `${fieldDisplayLabel(field)} range`,
        description: `${fieldDisplayLabel(field)} ranges from ${formatNumber(min)} to ${formatNumber(max)} across records.`,
        severity: spread >= 5 ? "medium" : "info",
        evidence: [
          `Minimum: ${formatNumber(min)}`,
          `Average: ${formatNumber(avg)}`,
          `Maximum: ${formatNumber(max)}`,
        ],
        recommendedAction: "Use ranked tables or grouped comparisons to inspect the high and low records.",
        metricField: field,
        confidence: 0.84,
      },
    ];
  });
}

function buildCorrelationFacts(
  rows: Record<string, unknown>[],
  numericFields: string[],
): DashboardInsightFact[] {
  for (let i = 0; i < numericFields.length; i += 1) {
    for (let j = i + 1; j < numericFields.length; j += 1) {
      const first = numericFields[i];
      const second = numericFields[j];
      const pairs = rows
        .map((row) => [toNumber(row[first]), toNumber(row[second])] as const)
        .filter(([a, b]) => a !== 0 && b !== 0);
      if (pairs.length < 4) continue;
      const correlation = pearson(pairs);
      if (Math.abs(correlation) < 0.65) continue;
      return [
        {
          id: `fact-correlation-${slugify(first)}-${slugify(second)}`,
          insightType: "comparison",
          title: "Numeric relationship",
          description: `${fieldDisplayLabel(first)} and ${fieldDisplayLabel(second)} move ${correlation > 0 ? "together" : "in opposite directions"} in the available rows.`,
          severity: "info",
          evidence: [`Correlation: ${correlation.toFixed(2)}`, `Rows compared: ${pairs.length}`],
          recommendedAction: "Review this relationship as a hypothesis, not a causal conclusion.",
          metricField: first,
          confidence: 0.72,
        },
      ];
    }
  }
  return [];
}

function buildQualityFacts(qualityResults: QualityCheckResult[]): DashboardInsightFact[] {
  return qualityResults
    .filter((issue) => issue.status !== "pass")
    .slice(0, 2)
    .map((issue) => {
      const action = issue.suggestedAction ?? "Review this quality check before publishing.";
      return {
        id: `fact-quality-${issue.id}`,
        insightType: "quality" as const,
        title: issue.checkType,
        description: issue.description,
        severity: issue.severity,
        evidence: [action],
        recommendedAction: action,
        confidence: 0.9,
      };
    });
}

function buildTransformationFacts(transformations: TransformationStep[]): DashboardInsightFact[] {
  if (transformations.length === 0) return [];
  const cleaning = transformations.find((step) => step.stepType === "cleaning");
  if (!cleaning) return [];
  return [
    {
      id: "fact-cleaning-applied",
      insightType: "coverage",
      title: "Cleaning applied",
      description: cleaning.description,
      severity: "info",
      evidence: [
        `${cleaning.affectedColumns?.length ?? 0} affected columns`,
        ...(cleaning.assumptions?.slice(0, 2) ?? []),
      ],
      recommendedAction: "Use the transformation log when sharing exported outputs.",
      confidence: 0.9,
    },
  ];
}

function topCategoryShare(rows: Record<string, unknown>[], field: string) {
  const grouped = aggregateRows(rows, field, undefined, "count");
  if (grouped.length === 0) return null;
  const total = grouped.reduce((sum, item) => sum + item.value, 0);
  const top = grouped[0];
  return {
    label: top.label,
    count: top.value,
    total,
    share: total > 0 ? Math.round((top.value / total) * 100) : 0,
  };
}

function aggregateTrendRows(
  rows: Record<string, unknown>[],
  dateField: string,
  metricField?: string,
) {
  const aggregation = metricField ? inferMetricAggregation(metricField) : "count";
  const groups = new Map<string, { count: number; timestamp: number; total: number }>();

  for (const row of rows) {
    const rawDate = row[dateField];
    const timestamp = parseDateValue(rawDate);
    if (timestamp === undefined) continue;
    const label = formatTrendLabel(rawDate, timestamp);
    const current = groups.get(label) ?? { count: 0, timestamp, total: 0 };
    if (metricField) {
      const value = finiteNumber(row[metricField]);
      if (value === undefined) continue;
      current.total += value;
      current.count += 1;
    } else {
      current.total += 1;
      current.count += 1;
    }
    current.timestamp = Math.min(current.timestamp, timestamp);
    groups.set(label, current);
  }

  return Array.from(groups, ([label, item]) => ({
    label,
    value:
      aggregation === "average" && item.count > 0
        ? item.total / item.count
        : item.total,
    timestamp: item.timestamp,
  })).sort((a, b) => a.timestamp - b.timestamp);
}

function parseDateValue(value: unknown) {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? timestamp : undefined;
  }
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const timestamp = Date.parse(String(value));
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function formatTrendLabel(value: unknown, timestamp: number) {
  if (typeof value === "string" && value.trim()) return value;
  return new Date(timestamp).toISOString().slice(0, 10);
}

function finiteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function pearson(pairs: ReadonlyArray<readonly [number, number]>) {
  const n = pairs.length;
  const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
  const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
  const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
  const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
  const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return denominator === 0 ? 0 : numerator / denominator;
}

function uniqueFacts(facts: DashboardInsightFact[]) {
  const seen = new Set<string>();
  return facts.filter((fact) => {
    if (seen.has(fact.id)) return false;
    seen.add(fact.id);
    return true;
  });
}

function severityRank(severity: DashboardInsightFact["severity"]) {
  return { info: 0, low: 1, medium: 2, high: 3 }[severity];
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function isCoordinateField(field: string) {
  return /^(lat|latitude|lon|lng|longitude)$/i.test(field);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "field";
}
