import type { MetricAggregation, SortBy } from "@/types/recommendations";

export type GroupedMetricValue = {
  label: string;
  value: number;
  count: number;
  total: number;
  aggregation: MetricAggregation;
};

export function inferMetricAggregation(metricField?: string): MetricAggregation {
  if (!metricField) return "count";
  const field = metricField.toLowerCase();
  if (/(rate|percent|pct|ratio|score|index|average|avg|mean)/.test(field)) {
    return "average";
  }
  return "sum";
}

export function formatAggregation(aggregation: MetricAggregation) {
  if (aggregation === "average") return "Average";
  if (aggregation === "count") return "Count";
  return "Total";
}

export function metricDisplayLabel(metricField?: string, aggregation?: MetricAggregation) {
  const resolved = aggregation ?? inferMetricAggregation(metricField);
  if (!metricField) return "Records";
  const label = fieldDisplayLabel(metricField);
  const aggregationLabel = formatAggregation(resolved);
  return label.toLowerCase().startsWith(`${aggregationLabel.toLowerCase()} `)
    ? label
    : `${aggregationLabel} ${label}`;
}

export function fieldDisplayLabel(field?: string) {
  if (!field) return "";
  return field
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      /^[A-Z0-9]{2,}$/.test(word)
        ? word
        : `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
    )
    .join(" ");
}

export function aggregateRows(
  rows: Record<string, unknown>[],
  groupField?: string,
  metricField?: string,
  aggregation: MetricAggregation = inferMetricAggregation(metricField)
): GroupedMetricValue[] {
  if (!groupField) return [];
  const groups = new Map<string, { total: number; count: number }>();

  for (const row of rows) {
    const key = labelFor(row[groupField]);
    const current = groups.get(key) ?? { total: 0, count: 0 };
    const numericValue = metricField ? toFiniteNumber(row[metricField]) : undefined;
    if (metricField && aggregation === "average") {
      if (numericValue !== undefined) {
        current.total += numericValue;
        current.count += 1;
      }
    } else {
      current.total += metricField ? numericValue ?? 0 : 1;
      current.count += 1;
    }
    groups.set(key, current);
  }

  return Array.from(groups, ([label, item]) => ({
    label,
    value: aggregateValue(item.total, item.count, aggregation),
    count: item.count,
    total: item.total,
    aggregation
  })).sort((a, b) => b.value - a.value);
}

export function sortGroupedMetricValues(
  grouped: GroupedMetricValue[],
  sortBy: SortBy | undefined,
) {
  const values = grouped.slice();
  if (sortBy === "label_asc" || sortBy === "time_asc") {
    return values.sort(compareGroupedMetricLabels);
  }
  return values.sort(
    (first, second) =>
      second.value - first.value || compareGroupedMetricLabels(first, second),
  );
}

export function aggregateField(
  rows: Record<string, unknown>[],
  metricField?: string,
  aggregation: MetricAggregation = inferMetricAggregation(metricField)
) {
  if (!metricField || aggregation === "count") return rows.length;
  const values = rows
    .map((row) => toFiniteNumber(row[metricField]))
    .filter((value): value is number => value !== undefined);
  const total = values.reduce((sum, value) => sum + value, 0);
  return aggregateValue(total, values.length, aggregation);
}

export function toNumber(value: unknown) {
  return toFiniteNumber(value) ?? 0;
}

function toFiniteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function aggregateValue(total: number, count: number, aggregation: MetricAggregation) {
  if (aggregation === "average") return count > 0 ? total / count : 0;
  if (aggregation === "count") return count;
  return total;
}

function compareGroupedMetricLabels(
  first: GroupedMetricValue,
  second: GroupedMetricValue,
) {
  const firstDate = parseSortableDate(first.label);
  const secondDate = parseSortableDate(second.label);
  if (firstDate !== undefined && secondDate !== undefined) {
    return firstDate - secondDate;
  }

  const firstNumber = Number(first.label);
  const secondNumber = Number(second.label);
  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
    return firstNumber - secondNumber;
  }

  return first.label.localeCompare(second.label, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function parseSortableDate(label: string) {
  if (
    !/[/-]|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(
      label,
    )
  ) {
    return undefined;
  }
  const parsed = Date.parse(label);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function labelFor(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Missing";
  }
  return String(value);
}
