import type { ColumnProfile, Dataset, DatasetProfile } from "@/types/dataset";
import { isCoordinateField } from "./locationFields";

const geoTerms = ["district", "admin", "area", "region", "province", "county", "country", "state", "city", "municipality", "commune", "ward", "site", "location", "lat", "latitude", "lon", "lng", "longitude", "code"];
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
  return {
    columnName,
    inferredType,
    missingCount: rowCount - present.length,
    missingPercentage: rowCount === 0 ? 0 : Math.round(((rowCount - present.length) / rowCount) * 1000) / 10,
    uniqueCount,
    sampleValues: Array.from(new Set(present.map((value) => String(value)))).slice(0, 5),
    isPotentialJoinField: hasTerm(joinTerms) || uniqueCount / Math.max(rowCount, 1) > 0.8,
    isPotentialGeographicField: isCoordinateField(columnName) || hasTerm(geoTerms),
    isPotentialDemographicField: hasTerm(demographicTerms),
    isPotentialMetricField: inferredType === "number" || hasTerm(metricTerms)
  };
}

export function inferColumnType(values: unknown[]): ColumnProfile["inferredType"] {
  if (values.length === 0) return "unknown";
  const strings = values.map((value) => String(value).trim());
  const numberLike = strings.filter((value) => value !== "" && !Number.isNaN(Number(value))).length;
  const booleanLike = strings.filter((value) => /^(true|false)$/i.test(value)).length;
  const dateLike = strings.filter((value) => !Number.isNaN(Date.parse(value)) && /[-/]/.test(value)).length;
  if (numberLike / values.length > 0.85) return "number";
  if (booleanLike / values.length > 0.85) return "boolean";
  if (dateLike / values.length > 0.85) return "date";
  return "string";
}
