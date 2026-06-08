import type { Dataset } from "@/types/dataset";
import type { CleaningRecommendation, JoinRecommendation } from "@/types/recommendations";
import type { TransformationStep } from "@/types/transformations";
import {
  applyCleaningRecommendations,
  cleaningTransformLabel,
  cleaningRecommendationsForRows,
} from "./cleaningTransforms";
import { createTransformationStep } from "./transformationLog";

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function prepareSingleDataset(
  dataset: Dataset,
  cleaningRecommendations: CleaningRecommendation[] = []
): { dataset: Dataset; transformations: TransformationStep[] } {
  return standardizeSafeFields(dataset, cleaningRecommendations);
}

export function standardizeSafeFields(
  dataset: Dataset,
  cleaningRecommendations: CleaningRecommendation[] = []
): { dataset: Dataset; transformations: TransformationStep[] } {
  const sourceRows = dataset.data ?? [];
  const sourceColumns = dataset.columns ?? Object.keys(sourceRows[0] ?? {});
  const recommendations = cleaningRecommendations.length
    ? cleaningRecommendations
    : cleaningRecommendationsForRows(sourceRows, sourceColumns);
  const { rows: data, appliedTransforms } = applyCleaningRecommendations(
    sourceRows,
    recommendations,
    sourceColumns
  );
  const columns = data[0] ? Object.keys(data[0]) : sourceColumns;
  const preparedDataset = {
    ...dataset,
    id: crypto.randomUUID(),
    name: `${dataset.name} prepared`,
    data,
    rowCount: data.length,
    columnCount: columns.length,
    columns,
    sampleRows: data.slice(0, 5)
  };

  const changedTransforms = appliedTransforms.filter((transform) => transform.changedCells > 0);

  return {
    dataset: preparedDataset,
    transformations: changedTransforms.length
      ? [
          createTransformationStep("cleaning", describeAppliedCleaning(dataset.name, changedTransforms), {
        inputs: [dataset.id],
        outputs: [preparedDataset.id],
        affectedColumns: Array.from(new Set(changedTransforms.flatMap((transform) => transform.affectedColumns))),
        operations: changedTransforms.map((transform) => ({
          type: transform.recommendation.transform.type,
          title: transform.recommendation.title,
          columns: transform.recommendation.transform.columns,
          scannedCells: transform.scannedCells,
          changedCells: transform.changedCells
        })),
        assumptions: formatCleaningAssumptions(changedTransforms)
      })
        ]
      : []
  };
}

export function applyJoinRecommendation(
  datasets: Dataset[],
  recommendation: JoinRecommendation,
  cleaningRecommendations: CleaningRecommendation[] = []
): { dataset: Dataset; transformations: TransformationStep[] } {
  const source = datasets.find((dataset) => dataset.id === recommendation.sourceDatasetId);
  const target = datasets.find((dataset) => dataset.id === recommendation.targetDatasetId);
  if (!source?.data || !target?.data) throw new Error("Join datasets were not found.");

  const sourceColumn = recommendation.sourceColumns[0];
  const targetColumn = recommendation.targetColumns[0];
  const sourceColumnNames = new Set(source.columns ?? Object.keys(source.data[0] ?? {}));
  const targetColumnNames = target.columns ?? Object.keys(target.data[0] ?? {});
  const renamedTargetColumns = new Map(
    targetColumnNames
      .filter((column) => sourceColumnNames.has(column))
      .map((column) => [column, prefixedColumnName(column, target.name)])
  );
  const targetIndex = new Map(target.data.map((row) => [normalize(row[targetColumn]), row]));
  const joined: Record<string, unknown>[] = [];

  for (const sourceRow of source.data) {
    const match = targetIndex.get(normalize(sourceRow[sourceColumn]));
    if (match) {
      joined.push({ ...sourceRow, ...prefixConflicts(sourceColumnNames, match, target.name), __join_matched: true });
    } else if (recommendation.joinType !== "inner") {
      joined.push({ ...sourceRow, __join_matched: false });
    }
  }

  if (recommendation.joinType === "outer") {
    const sourceKeys = new Set(source.data.map((row) => normalize(row[sourceColumn])));
    for (const targetRow of target.data) {
      if (!sourceKeys.has(normalize(targetRow[targetColumn]))) {
        joined.push({ ...prefixConflicts(sourceColumnNames, targetRow, target.name), __join_matched: false });
      }
    }
  }

  const joinedDataset: Dataset = {
    id: crypto.randomUUID(),
    name: `${source.name} + ${target.name}`,
    fileType: "csv",
    sourceType: "sample",
    uploadedAt: new Date().toISOString(),
    data: joined,
    rowCount: joined.length,
    columnCount: Object.keys(joined[0] ?? {}).length,
    columns: Object.keys(joined[0] ?? {}),
    sampleRows: joined.slice(0, 5)
  };
  const joinTransformation = createTransformationStep("join", `Joined ${source.name} to ${target.name} using ${sourceColumn} = ${targetColumn}.`, {
    inputs: [source.id, target.id],
    outputs: [joinedDataset.id],
    affectedColumns: [sourceColumn, targetColumn],
    assumptions: recommendation.risks
  });
  const prepared = standardizeSafeFields(
    joinedDataset,
    remapCleaningRecommendationsForJoin(cleaningRecommendations, renamedTargetColumns)
  );

  return {
    dataset: prepared.dataset,
    transformations: [joinTransformation, ...prepared.transformations]
  };
}

function describeAppliedCleaning(
  datasetName: string,
  appliedTransforms: ReturnType<typeof applyCleaningRecommendations>["appliedTransforms"]
) {
  const applied = appliedTransforms.filter((transform) => transform.changedCells > 0);
  if (applied.length === 0) {
    return `Checked typed cleaning transforms for ${datasetName}; no cell values needed changes.`;
  }
  const labels = applied
    .map((transform) => `${cleaningTransformLabel(transform.recommendation.transform.type)} (${transform.changedCells} cell${transform.changedCells === 1 ? "" : "s"})`)
    .join(", ");
  return `Applied typed cleaning transforms during harmonization for ${datasetName}: ${labels}.`;
}

function formatCleaningAssumptions(
  appliedTransforms: ReturnType<typeof applyCleaningRecommendations>["appliedTransforms"]
) {
  return appliedTransforms
    .slice(0, 8)
    .map((transform) =>
      `${transform.recommendation.title}: ${transform.changedCells} changed cell${transform.changedCells === 1 ? "" : "s"} across ${transform.recommendation.transform.columns.join(", ")}.`
    );
}

function remapCleaningRecommendationsForJoin(
  recommendations: CleaningRecommendation[],
  renamedTargetColumns: Map<string, string>
) {
  if (renamedTargetColumns.size === 0) return recommendations;
  return recommendations.map((recommendation) => {
    const columns = Array.from(new Set(recommendation.transform.columns.flatMap((column) => {
      const renamed = renamedTargetColumns.get(column);
      return renamed ? [column, renamed] : [column];
    })));
    return {
      ...recommendation,
      affectedColumns: columns,
      transform: {
        ...recommendation.transform,
        columns
      }
    };
  });
}

function prefixConflicts(sourceColumns: Set<string>, targetRow: Record<string, unknown>, targetName: string) {
  return Object.fromEntries(
    Object.entries(targetRow).map(([key, value]) => [sourceColumns.has(key) ? prefixedColumnName(key, targetName) : key, value])
  );
}

function prefixedColumnName(column: string, datasetName: string) {
  return `${datasetName}_${column}`;
}
