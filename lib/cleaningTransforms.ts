import type { ColumnProfile, DatasetProfile } from "@/types/dataset";
import type { CleaningRecommendation, CleaningTransformType } from "@/types/recommendations";

export const CLEANING_TRANSFORM_TYPES: CleaningTransformType[] = [
  "trim_whitespace",
  "normalize_empty_strings",
  "convert_numeric_strings",
  "convert_boolean_strings"
];

export type AppliedCleaningTransform = {
  recommendation: CleaningRecommendation;
  scannedCells: number;
  changedCells: number;
  affectedColumns: string[];
};

type DatasetLike = {
  data?: Record<string, unknown>[];
  columns?: string[];
  profile?: Pick<DatasetProfile, "columns">;
};

export function cleaningRecommendationsForProfiles(
  profiles: Array<Pick<DatasetProfile, "columns">>
): CleaningRecommendation[] {
  const columns = profiles.flatMap((profile) => profile.columns);
  const allColumns = uniqueColumnsFrom(columns.map((column) => column.columnName));
  if (allColumns.length === 0) return [];
  const numericColumns = columnsFor(columns, (column) =>
    column.inferredType === "number" || column.isPotentialMetricField
  );
  const booleanColumns = columnsFor(columns, (column) => column.inferredType === "boolean");
  const missingColumns = columnsFor(columns, (column) => column.missingPercentage > 0);
  const recommendations: CleaningRecommendation[] = [
    buildCleaningRecommendation(
      "clean-trim-whitespace",
      "Trim whitespace",
      "trim_whitespace",
      allColumns,
      "Remove leading and trailing whitespace from text values.",
      "Trimming preserves values while improving joins, grouping, and filters.",
      0.9
    )
  ];

  if (missingColumns.length > 0) {
    recommendations.push(
      buildCleaningRecommendation(
        "clean-normalize-empty-strings",
        "Normalize blank values",
        "normalize_empty_strings",
        missingColumns,
        "Convert blank text values to null so missingness is explicit.",
        "Explicit missing values make quality checks and exports easier to interpret.",
        0.88
      )
    );
  }

  if (numericColumns.length > 0) {
    recommendations.push(
      buildCleaningRecommendation(
        "clean-convert-numeric-strings",
        "Convert numeric text",
        "convert_numeric_strings",
        numericColumns,
        "Convert numeric-looking text values to numbers.",
        "Numeric conversion enables correct totals, averages, and chart scales.",
        0.86
      )
    );
  }

  if (booleanColumns.length > 0) {
    recommendations.push(
      buildCleaningRecommendation(
        "clean-convert-boolean-strings",
        "Convert boolean text",
        "convert_boolean_strings",
        booleanColumns,
        "Convert true/false text values to booleans.",
        "Boolean conversion keeps binary fields consistent without changing row structure.",
        0.82
      )
    );
  }

  return recommendations;
}

export function cleaningRecommendationsForDatasets(datasets: DatasetLike[]): CleaningRecommendation[] {
  return mergeCleaningRecommendations(
    datasets.flatMap((dataset) => {
      const rows = dataset.data ?? [];
      const columns = dataset.columns ?? dataset.profile?.columns.map((column) => column.columnName) ?? Object.keys(rows[0] ?? {});
      return cleaningRecommendationsForRows(rows, columns);
    })
  );
}

export function cleaningRecommendationsForRows(
  rows: Record<string, unknown>[],
  columns: string[]
): CleaningRecommendation[] {
  const uniqueColumns = uniqueColumnsFrom(columns);
  const trimColumns = columnsWithTransformCandidates(rows, uniqueColumns, "trim_whitespace");
  const blankColumns = columnsWithTransformCandidates(rows, uniqueColumns, "normalize_empty_strings");
  const numericColumns = columnsWithTransformCandidates(rows, uniqueColumns, "convert_numeric_strings");
  const booleanColumns = columnsWithTransformCandidates(rows, uniqueColumns, "convert_boolean_strings");
  return [
    trimColumns.length
      ? buildCleaningRecommendation(
          "clean-trim-whitespace",
          "Trim whitespace",
          "trim_whitespace",
          trimColumns,
          "Remove leading and trailing whitespace from text values.",
          "Trimming preserves values while improving joins, grouping, and filters.",
          0.9
        )
      : null,
    blankColumns.length
      ? buildCleaningRecommendation(
          "clean-normalize-empty-strings",
          "Normalize blank values",
          "normalize_empty_strings",
          blankColumns,
          "Convert blank text values to null so missingness is explicit.",
          "Explicit missing values make quality checks and exports easier to interpret.",
          0.88
        )
      : null,
    numericColumns.length
      ? buildCleaningRecommendation(
          "clean-convert-numeric-strings",
          "Convert numeric text",
          "convert_numeric_strings",
          numericColumns,
          "Convert numeric-looking text values to numbers.",
          "Numeric conversion enables correct totals, averages, and chart scales.",
          0.86
        )
      : null,
    booleanColumns.length
      ? buildCleaningRecommendation(
          "clean-convert-boolean-strings",
          "Convert boolean text",
          "convert_boolean_strings",
          booleanColumns,
          "Convert true/false text values to booleans.",
          "Boolean conversion keeps binary fields consistent without changing row structure.",
          0.82
        )
      : null
  ].filter((recommendation): recommendation is CleaningRecommendation => Boolean(recommendation));
}

export function reconcileCleaningRecommendationsForDatasets(
  datasets: DatasetLike[],
  recommendations: CleaningRecommendation[] = []
): CleaningRecommendation[] {
  const detected = cleaningRecommendationsForDatasets(datasets);
  const rows = datasets.flatMap((dataset) => dataset.data ?? []);
  const columns = uniqueColumnsFrom(
    datasets.flatMap((dataset) =>
      dataset.columns ?? dataset.profile?.columns.map((column) => column.columnName) ?? Object.keys(dataset.data?.[0] ?? {})
    )
  );
  const normalized = recommendations
    .map((recommendation) => normalizeCleaningRecommendation(recommendation, columns))
    .filter((recommendation): recommendation is CleaningRecommendation => Boolean(recommendation))
    .map((recommendation) => filterRecommendationToChangingColumns(recommendation, rows))
    .filter((recommendation): recommendation is CleaningRecommendation => Boolean(recommendation));
  return mergeCleaningRecommendations([...normalized, ...detected]);
}

export function reconcileCleaningRecommendationsForDatasetColumns(
  datasets: DatasetLike[],
  recommendations: CleaningRecommendation[] = []
): CleaningRecommendation[] {
  const columns = uniqueColumnsFrom(
    datasets.flatMap((dataset) =>
      dataset.columns ?? dataset.profile?.columns.map((column) => column.columnName) ?? Object.keys(dataset.data?.[0] ?? {})
    )
  );
  return mergeCleaningRecommendations(
    recommendations
      .map((recommendation) => normalizeCleaningRecommendation(recommendation, columns))
      .filter((recommendation): recommendation is CleaningRecommendation => Boolean(recommendation))
  );
}

export function normalizeCleaningRecommendation(
  recommendation: CleaningRecommendation,
  availableColumns: string[]
): CleaningRecommendation | null {
  const transformType = recommendation.transform.type;
  if (!CLEANING_TRANSFORM_TYPES.includes(transformType)) return null;
  const columns = uniqueExistingColumns(
    recommendation.transform.columns.length
      ? recommendation.transform.columns
      : recommendation.affectedColumns,
    availableColumns
  );
  if (columns.length === 0) return null;
  return {
    ...recommendation,
    affectedColumns: columns,
    transform: {
      type: transformType,
      columns
    }
  };
}

export function applyCleaningRecommendations(
  rows: Record<string, unknown>[],
  recommendations: CleaningRecommendation[],
  availableColumns: string[]
): { rows: Record<string, unknown>[]; appliedTransforms: AppliedCleaningTransform[] } {
  const normalized = recommendations
    .map((recommendation) => normalizeCleaningRecommendation(recommendation, availableColumns))
    .filter((recommendation): recommendation is CleaningRecommendation => Boolean(recommendation));
  if (normalized.length === 0) {
    return {
      rows: rows.map((row) => ({ ...row })),
      appliedTransforms: []
    };
  }

  const appliedTransforms: AppliedCleaningTransform[] = normalized.map((recommendation) => ({
    recommendation,
    scannedCells: 0,
    changedCells: 0,
    affectedColumns: []
  }));
  const changedColumns = appliedTransforms.map(() => new Set<string>());

  const cleanedRows = rows.map((row) => {
    const cleanedRow = { ...row };
    normalized.forEach((recommendation, index) => {
      for (const column of recommendation.transform.columns) {
        const before = cleanedRow[column];
        appliedTransforms[index].scannedCells += 1;
        const after = applyCleaningTransformValue(before, recommendation.transform.type);
        if (!Object.is(after, before)) {
          cleanedRow[column] = after;
          appliedTransforms[index].changedCells += 1;
          changedColumns[index].add(column);
        }
      }
    });
    return cleanedRow;
  });

  return {
    rows: cleanedRows,
    appliedTransforms: appliedTransforms.map((applied, index) => ({
      ...applied,
      affectedColumns: Array.from(changedColumns[index])
    }))
  };
}

export function isCleaningTransformType(value: unknown): value is CleaningTransformType {
  return typeof value === "string" && CLEANING_TRANSFORM_TYPES.includes(value as CleaningTransformType);
}

export function cleaningTransformLabel(type: CleaningTransformType) {
  switch (type) {
    case "trim_whitespace":
      return "Trim whitespace";
    case "normalize_empty_strings":
      return "Normalize blank values";
    case "convert_numeric_strings":
      return "Convert numeric text";
    case "convert_boolean_strings":
      return "Convert boolean text";
  }
}

function applyCleaningTransformValue(value: unknown, type: CleaningTransformType) {
  if (typeof value !== "string") return value;
  switch (type) {
    case "trim_whitespace":
      return value.trim();
    case "normalize_empty_strings":
      return value.trim() === "" ? null : value;
    case "convert_numeric_strings": {
      const trimmed = value.trim();
      return /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : value;
    }
    case "convert_boolean_strings": {
      const trimmed = value.trim();
      if (/^true$/i.test(trimmed)) return true;
      if (/^false$/i.test(trimmed)) return false;
      return value;
    }
  }
}

function hasTransformCandidate(value: unknown, type: CleaningTransformType) {
  if (typeof value !== "string") return false;
  switch (type) {
    case "trim_whitespace":
      return value !== value.trim();
    case "normalize_empty_strings":
      return value.trim() === "";
    case "convert_numeric_strings":
      return /^-?\d+(\.\d+)?$/.test(value.trim());
    case "convert_boolean_strings":
      return /^(true|false)$/i.test(value.trim());
  }
}

function buildCleaningRecommendation(
  id: string,
  title: string,
  type: CleaningTransformType,
  columns: string[],
  suggestedAction: string,
  rationale: string,
  confidence: number
): CleaningRecommendation {
  const unique = uniqueColumnsFrom(columns);
  return {
    id,
    title,
    affectedColumns: unique,
    transform: {
      type,
      columns: unique
    },
    suggestedAction,
    rationale,
    confidence
  };
}

function columnsFor(columns: ColumnProfile[], predicate: (column: ColumnProfile) => boolean) {
  return uniqueColumnsFrom(columns.filter(predicate).map((column) => column.columnName));
}

function columnsWithTransformCandidates(
  rows: Record<string, unknown>[],
  columns: string[],
  type: CleaningTransformType
) {
  return columns.filter((column) => rows.some((row) => hasTransformCandidate(row[column], type)));
}

function filterRecommendationToChangingColumns(
  recommendation: CleaningRecommendation,
  rows: Record<string, unknown>[]
) {
  const columns = recommendation.transform.columns.filter((column) =>
    rows.some((row) => hasTransformCandidate(row[column], recommendation.transform.type))
  );
  if (columns.length === 0) return null;
  return {
    ...recommendation,
    affectedColumns: columns,
    transform: {
      ...recommendation.transform,
      columns
    }
  };
}

function mergeCleaningRecommendations(recommendations: CleaningRecommendation[]) {
  const byType = new Map<CleaningTransformType, CleaningRecommendation>();
  for (const recommendation of recommendations) {
    const existing = byType.get(recommendation.transform.type);
    if (!existing) {
      byType.set(recommendation.transform.type, recommendation);
      continue;
    }
    const columns = uniqueColumnsFrom([...existing.transform.columns, ...recommendation.transform.columns]);
    byType.set(recommendation.transform.type, {
      ...existing,
      affectedColumns: columns,
      transform: {
        ...existing.transform,
        columns
      },
      confidence: Math.max(existing.confidence, recommendation.confidence)
    });
  }
  return CLEANING_TRANSFORM_TYPES
    .map((type) => byType.get(type))
    .filter((recommendation): recommendation is CleaningRecommendation => Boolean(recommendation));
}

function uniqueColumnsFrom(columns: string[]) {
  return Array.from(new Set(columns));
}

function uniqueExistingColumns(columns: string[], availableColumns: string[]) {
  const available = new Set(availableColumns);
  return Array.from(new Set(columns)).filter((column) => available.has(column));
}
