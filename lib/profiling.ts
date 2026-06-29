import type { ColumnDescriptiveStats, ColumnProfile, Dataset, DatasetProfile } from "@/types/dataset";
import { isAdminCodeField, isCoordinateField } from "./locationFields";

const geoTerms = ["district", "admin", "area", "region", "province", "county", "country", "state", "city", "municipality", "commune", "ward", "site", "location", "lat", "latitude", "lon", "lng", "longitude"];
const demographicTerms = ["age", "gender", "sex", "disability", "household", "hh"];
const metricTerms = ["count", "total", "number", "population", "score", "rate", "percent", "index", "access", "insecurity"];
const joinTerms = ["id", "code", "key", "district", "admin", "iso", "pcode"];

export function profileDataset(dataset: Dataset): DatasetProfile {
  return profileTabularDataset(dataset);
}

export function profileTabularDataset(dataset: Dataset): DatasetProfile {
  const rows = dataset.data ?? [];
  const columns = dataset.columns ?? Object.keys(rows[0] ?? {});
  const columnProfiles = columns.map((columnName) => profileColumn(columnName, rows.map((row) => row[columnName]), rows.length));
  const duplicateRowCount = rows.length - new Set(rows.map((row) => JSON.stringify(row))).size;

  return {
    datasetId: dataset.id,
    rowCount: rows.length,
    columnCount: columns.length,
    columns: columnProfiles,
    duplicateRowCount,
    inputHints: dataset.inputHints,
    formatAssessment: dataset.formatAssessment,
    potentialPrimaryKeys: columnProfiles.filter((col) => col.missingCount === 0 && col.uniqueCount === rows.length).map((col) => col.columnName),
    potentialJoinFields: columnProfiles.filter((col) => col.isPotentialJoinField).map((col) => col.columnName),
    potentialGeographicFields: columnProfiles.filter((col) => col.isPotentialGeographicField).map((col) => col.columnName),
    potentialDemographicFields: columnProfiles.filter((col) => col.isPotentialDemographicField).map((col) => col.columnName),
    potentialMetricFields: columnProfiles.filter((col) => col.isPotentialMetricField).map((col) => col.columnName)
  };
}

function profileColumn(columnName: string, values: unknown[], rowCount: number): ColumnProfile {
  const present = values.filter((value) => value !== null && value !== undefined && String(value).trim() !== "");
  const lowerName = columnName.toLowerCase();
  const inferredType = inferColumnType(present);
  const uniqueCount = new Set(present.map((value) => String(value).trim().toLowerCase())).size;
  const hasTerm = (terms: string[]) => terms.some((term) => lowerName.includes(term));
  const isAdminCode = isAdminCodeField(columnName);
  const descriptiveStats = describeColumn(present, values, rowCount, inferredType);
  return {
    columnName,
    inferredType,
    missingCount: rowCount - present.length,
    missingPercentage: rowCount === 0 ? 0 : Math.round(((rowCount - present.length) / rowCount) * 1000) / 10,
    uniqueCount,
    sampleValues: Array.from(new Set(present.map((value) => String(value)))).slice(0, 5),
    descriptiveStats,
    isPotentialJoinField: isAdminCode || hasTerm(joinTerms) || uniqueCount / Math.max(rowCount, 1) > 0.8,
    isPotentialGeographicField: isAdminCode || isCoordinateField(columnName) || hasTerm(geoTerms),
    isPotentialDemographicField: hasTerm(demographicTerms),
    isPotentialMetricField: inferredType === "number" || hasTerm(metricTerms)
  };
}

function describeColumn(
  present: unknown[],
  values: unknown[],
  rowCount: number,
  inferredType: ColumnProfile["inferredType"],
): ColumnDescriptiveStats {
  const stats: ColumnDescriptiveStats = {
    nonMissingCount: present.length,
    topValues: topValues(present, rowCount),
  };
  if (inferredType === "number") {
    const numericValues = present
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    if (numericValues.length > 0) {
      stats.numeric = describeNumericValues(numericValues);
    }
  }
  if (inferredType === "date") {
    const parsedDates = values
      .filter((value) => value !== null && value !== undefined && String(value).trim() !== "")
      .map((value) => Date.parse(String(value)));
    const validDates = parsedDates.filter((value) => Number.isFinite(value));
    if (validDates.length > 0) {
      const sorted = validDates.slice().sort((a, b) => a - b);
      stats.date = {
        earliest: new Date(sorted[0]).toISOString().slice(0, 10),
        latest: new Date(sorted[sorted.length - 1]).toISOString().slice(0, 10),
        validCount: validDates.length,
        invalidCount: parsedDates.length - validDates.length,
      };
    }
  }
  return stats;
}

function topValues(values: unknown[], rowCount: number) {
  const counts = new Map<string, { count: number; firstIndex: number }>();
  values.forEach((value, index) => {
    const label = String(value);
    const current = counts.get(label);
    counts.set(label, {
      count: (current?.count ?? 0) + 1,
      firstIndex: current?.firstIndex ?? index,
    });
  });
  return Array.from(counts.entries())
    .map(([value, metadata]) => ({
      value,
      count: metadata.count,
      percentage: rowCount === 0 ? 0 : roundToTenth((metadata.count / rowCount) * 100),
      firstIndex: metadata.firstIndex,
    }))
    .sort((a, b) => b.count - a.count || a.firstIndex - b.firstIndex || a.value.localeCompare(b.value))
    .slice(0, 5)
    .map(({ firstIndex: _firstIndex, ...value }) => value);
}

function describeNumericValues(values: number[]) {
  const sorted = values.slice().sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: roundToTenth(sum / sorted.length),
    median: roundToTenth(quantile(sorted, 0.5)),
    q1: roundToTenth(quantile(sorted, 0.25)),
    q3: roundToTenth(quantile(sorted, 0.75)),
    negativeCount: sorted.filter((value) => value < 0).length,
    zeroCount: sorted.filter((value) => value === 0).length,
  };
}

function quantile(sorted: number[], percentile: number) {
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * percentile;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  if (lowerIndex === upperIndex) return sorted[lowerIndex];
  const weight = index - lowerIndex;
  return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10;
}

export function inferColumnType(values: unknown[]): ColumnProfile["inferredType"] {
  if (values.length === 0) return "unknown";
  const strings = values.map((value) => String(value).trim());
  const numberLike = strings.filter((value) => value !== "" && !Number.isNaN(Number(value))).length;
  const booleanLike = strings.filter((value) => /^(true|false)$/i.test(value)).length;
  const dateLike = strings.filter(isDateLikeValue).length;
  if (numberLike / values.length > 0.85) return "number";
  if (booleanLike / values.length > 0.85) return "boolean";
  if (dateLike / values.length > 0.85) return "date";
  return "string";
}

function isDateLikeValue(value: string) {
  if (value === "") return false;
  const hasRecognizableDateShape =
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T].*)?$/.test(value) ||
    /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(value);
  return hasRecognizableDateShape && !Number.isNaN(Date.parse(value));
}
