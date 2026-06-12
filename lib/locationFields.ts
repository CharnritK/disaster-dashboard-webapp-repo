import type { Dataset } from "@/types/dataset";

export type LocationFieldSet = {
  latitudeField?: string;
  longitudeField?: string;
  areaField?: string;
  labelField?: string;
  validCoordinateRowCount: number;
  coordinateCoveragePercentage: number;
};

export function findLocationFields(dataset: Dataset): LocationFieldSet {
  const columns =
    dataset.profile?.columns.map((column) => column.columnName) ??
    dataset.columns ??
    [];
  const latitudeField = findCoordinateField(dataset, columns, "latitude");
  const longitudeField = findCoordinateField(dataset, columns, "longitude");
  const validCoordinateRowCount =
    latitudeField && longitudeField
      ? countValidCoordinateRows(dataset, latitudeField, longitudeField)
      : 0;
  const totalRows = dataset.data?.length ?? dataset.rowCount ?? 0;
  const areaField = findAreaField(dataset, columns);

  return {
    latitudeField,
    longitudeField,
    areaField,
    labelField: areaField ?? findLabelField(columns),
    validCoordinateRowCount,
    coordinateCoveragePercentage:
      totalRows === 0
        ? 0
        : Math.round((validCoordinateRowCount / totalRows) * 1000) / 10,
  };
}

export function hasUsableCoordinatePair(dataset: Dataset, minRows = 2) {
  const location = findLocationFields(dataset);
  return Boolean(
    location.latitudeField &&
      location.longitudeField &&
      location.validCoordinateRowCount >= minRows,
  );
}

export function isCoordinateField(field: string) {
  return isLatitudeField(field) || isLongitudeField(field);
}

export function isLatitudeField(field: string) {
  const normalized = normalizeField(field);
  return ["lat", "latitude", "ycoord", "ycoordinate"].includes(normalized);
}

export function isLongitudeField(field: string) {
  const normalized = normalizeField(field);
  return ["lon", "lng", "long", "longitude", "xcoord", "xcoordinate"].includes(
    normalized,
  );
}

export function isValidLatitude(value: unknown) {
  const number = finiteNumber(value);
  return number !== undefined && number >= -90 && number <= 90;
}

export function isValidLongitude(value: unknown) {
  const number = finiteNumber(value);
  return number !== undefined && number >= -180 && number <= 180;
}

function findCoordinateField(
  dataset: Dataset,
  columns: string[],
  coordinate: "latitude" | "longitude",
) {
  const matches =
    coordinate === "latitude" ? isLatitudeField : isLongitudeField;
  const isValid =
    coordinate === "latitude" ? isValidLatitude : isValidLongitude;
  return columns.find((column) => {
    if (!matches(column)) return false;
    const profileColumn = dataset.profile?.columns.find(
      (item) => item.columnName === column,
    );
    if (profileColumn && profileColumn.inferredType !== "number") return false;
    const rows = dataset.data ?? [];
    return rows.length === 0 || rows.some((row) => isValid(row[column]));
  });
}

function countValidCoordinateRows(
  dataset: Dataset,
  latitudeField: string,
  longitudeField: string,
) {
  return (dataset.data ?? []).filter(
    (row) =>
      isValidLatitude(row[latitudeField]) &&
      isValidLongitude(row[longitudeField]),
  ).length;
}

function findAreaField(dataset: Dataset, columns: string[]) {
  const fieldNames = new Set(columns);
  const profileGeoFields = dataset.profile?.potentialGeographicFields ?? [];
  return [...profileGeoFields, ...columns].find((field) => {
    if (!fieldNames.has(field) || isCoordinateField(field)) return false;
    const normalized = normalizeField(field);
    if (/(code|id|key|pcode|iso)$/.test(normalized)) return false;
    return /(admin|area|district|region|province|county|country|state|city|municipality|commune|ward|location|site)/.test(
      normalized,
    );
  });
}

function findLabelField(columns: string[]) {
  return columns.find((field) => {
    if (isCoordinateField(field)) return false;
    const normalized = normalizeField(field);
    return /(name|label|site|location|place|district|adminarea)/.test(
      normalized,
    );
  });
}

function finiteNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  return undefined;
}

function normalizeField(field: string) {
  return field.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
