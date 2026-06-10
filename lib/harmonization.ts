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

export function selectJoinPlan(
  datasets: Dataset[],
  recommendations: JoinRecommendation[]
): JoinRecommendation[] {
  const tabularIds = new Set(
    datasets
      .filter((dataset) => dataset.data?.length)
      .map((dataset) => dataset.id)
  );
  const usable = recommendations
    .filter(
      (recommendation) =>
        tabularIds.has(recommendation.sourceDatasetId) &&
        tabularIds.has(recommendation.targetDatasetId) &&
        recommendation.sourceDatasetId !== recommendation.targetDatasetId
    )
    .sort((first, second) => second.confidenceScore - first.confidenceScore);
  if (tabularIds.size <= 1 || usable.length === 0) return [];

  const candidates = usable.map((start) =>
    buildConnectedJoinPlan(tabularIds, usable, start)
  );
  return candidates.sort((first, second) => {
    const coverageDifference = second.coveredCount - first.coveredCount;
    if (coverageDifference !== 0) return coverageDifference;
    const lengthDifference = second.plan.length - first.plan.length;
    if (lengthDifference !== 0) return lengthDifference;
    return second.confidenceTotal - first.confidenceTotal;
  })[0]?.plan ?? [];
}

export function applyJoinRecommendations(
  datasets: Dataset[],
  recommendations: JoinRecommendation[],
  cleaningRecommendations: CleaningRecommendation[] = []
): { dataset: Dataset; transformations: TransformationStep[]; appliedJoinRecommendations: JoinRecommendation[] } {
  const plan = selectJoinPlan(datasets, recommendations);
  if (plan.length === 0) {
    throw new Error("No usable join recommendations were found.");
  }
  if (plan.length === 1) {
    const result = applyJoinRecommendation(datasets, plan[0], cleaningRecommendations);
    return { ...result, appliedJoinRecommendations: plan };
  }

  const joined = applySequentialJoinPlan(datasets, plan);
  const prepared = standardizeSafeFields(
    joined.dataset,
    expandCleaningRecommendationsForJoinedColumns(
      cleaningRecommendations,
      joined.columnAliases
    )
  );

  return {
    dataset: prepared.dataset,
    transformations: [...joined.transformations, ...prepared.transformations],
    appliedJoinRecommendations: plan
  };
}

function buildConnectedJoinPlan(
  tabularIds: Set<string>,
  recommendations: JoinRecommendation[],
  start: JoinRecommendation
) {
  const included = new Set([start.sourceDatasetId, start.targetDatasetId]);
  const used = new Set([start.id]);
  const plan = [start];
  let next = findNextConnectedJoin(recommendations, included, used);

  while (next && included.size < tabularIds.size) {
    plan.push(next);
    used.add(next.id);
    included.add(next.sourceDatasetId);
    included.add(next.targetDatasetId);
    next = findNextConnectedJoin(recommendations, included, used);
  }

  return {
    plan,
    coveredCount: included.size,
    confidenceTotal: plan.reduce((sum, join) => sum + join.confidenceScore, 0)
  };
}

function findNextConnectedJoin(
  recommendations: JoinRecommendation[],
  included: Set<string>,
  used: Set<string>
) {
  return recommendations.find((recommendation) => {
    if (used.has(recommendation.id)) return false;
    const sourceIncluded = included.has(recommendation.sourceDatasetId);
    const targetIncluded = included.has(recommendation.targetDatasetId);
    return sourceIncluded !== targetIncluded;
  });
}

function applySequentialJoinPlan(
  datasets: Dataset[],
  plan: JoinRecommendation[]
): {
  dataset: Dataset;
  transformations: TransformationStep[];
  columnAliases: Map<string, Set<string>>;
} {
  const firstJoin = plan[0];
  const initial = datasets.find((dataset) => dataset.id === firstJoin.sourceDatasetId);
  if (!initial?.data) throw new Error("Join source dataset was not found.");

  let currentRows = initial.data.map((row) => ({ ...row }));
  let currentColumns = initial.columns ?? Object.keys(currentRows[0] ?? {});
  let currentDatasetId = initial.id;
  const includedDatasetIds = new Set([initial.id]);
  const includedNames = [initial.name];
  const columnAliases = new Map<string, Set<string>>();
  addDatasetColumnAliases(columnAliases, initial, currentColumns);

  const transformations: TransformationStep[] = [];

  for (const recommendation of plan) {
    const sourceIncluded = includedDatasetIds.has(recommendation.sourceDatasetId);
    const targetIncluded = includedDatasetIds.has(recommendation.targetDatasetId);
    if (sourceIncluded && targetIncluded) continue;

    const includedDatasetId = sourceIncluded
      ? recommendation.sourceDatasetId
      : recommendation.targetDatasetId;
    const newDatasetId = sourceIncluded
      ? recommendation.targetDatasetId
      : recommendation.sourceDatasetId;
    const includedColumn = sourceIncluded
      ? recommendation.sourceColumns[0]
      : recommendation.targetColumns[0];
    const newColumn = sourceIncluded
      ? recommendation.targetColumns[0]
      : recommendation.sourceColumns[0];
    const newDataset = datasets.find((dataset) => dataset.id === newDatasetId);
    const includedDataset = datasets.find((dataset) => dataset.id === includedDatasetId);
    if (!newDataset?.data || !includedDataset) continue;

    const currentJoinColumn =
      firstAliasForColumn(columnAliases, includedDatasetId, includedColumn) ??
      includedColumn;
    const step = joinCurrentRowsToDataset({
      currentRows,
      currentColumns,
      currentJoinColumn,
      newDataset,
      newColumn,
      joinType: recommendation.joinType
    });
    const inputDatasetId = currentDatasetId;
    const outputDatasetId = crypto.randomUUID();
    currentRows = step.rows;
    currentColumns = step.columns;
    currentDatasetId = outputDatasetId;
    includedDatasetIds.add(newDataset.id);
    includedNames.push(newDataset.name);
    for (const [column, renamedColumn] of step.newColumnAliases) {
      addColumnAlias(columnAliases, newDataset.id, column, renamedColumn);
    }

    transformations.push(
      createTransformationStep(
        "join",
        `Joined ${newDataset.name} into ${includedNames.slice(0, -1).join(" + ")} using ${includedDataset.name}.${includedColumn} = ${newDataset.name}.${newColumn}.`,
        {
          inputs: [inputDatasetId, newDataset.id],
          outputs: [outputDatasetId],
          affectedColumns: [currentJoinColumn, newColumn],
          assumptions: recommendation.risks
        }
      )
    );
  }

  const joinedDataset: Dataset = {
    id: currentDatasetId,
    name: `${includedNames.join(" + ")}`,
    fileType: "csv",
    sourceType: datasets.some((dataset) => dataset.sourceType === "upload")
      ? "upload"
      : "sample",
    uploadedAt: new Date().toISOString(),
    data: currentRows,
    rowCount: currentRows.length,
    columnCount: currentColumns.length,
    columns: currentColumns,
    sampleRows: currentRows.slice(0, 5)
  };

  return { dataset: joinedDataset, transformations, columnAliases };
}

function joinCurrentRowsToDataset({
  currentRows,
  currentColumns,
  currentJoinColumn,
  joinType,
  newColumn,
  newDataset
}: {
  currentRows: Record<string, unknown>[];
  currentColumns: string[];
  currentJoinColumn: string;
  joinType: JoinRecommendation["joinType"];
  newColumn: string;
  newDataset: Dataset;
}) {
  const currentColumnNames = new Set(currentColumns);
  const newColumns = newDataset.columns ?? Object.keys(newDataset.data?.[0] ?? {});
  const newColumnAliases = new Map<string, string>();
  for (const column of newColumns) {
    newColumnAliases.set(
      column,
      currentColumnNames.has(column) || column === "__join_matched"
        ? prefixedColumnName(column, newDataset.name)
        : column
    );
  }

  const targetIndex = new Map(
    (newDataset.data ?? []).map((row) => [normalize(row[newColumn]), row])
  );
  const joined: Record<string, unknown>[] = [];

  for (const currentRow of currentRows) {
    const match = targetIndex.get(normalize(currentRow[currentJoinColumn]));
    if (match) {
      joined.push({
        ...currentRow,
        ...renameRowColumns(match, newColumnAliases),
        __join_matched: currentRow.__join_matched === false ? false : true
      });
    } else if (joinType !== "inner") {
      joined.push({ ...currentRow, __join_matched: false });
    }
  }

  if (joinType === "outer") {
    const sourceKeys = new Set(currentRows.map((row) => normalize(row[currentJoinColumn])));
    for (const targetRow of newDataset.data ?? []) {
      if (!sourceKeys.has(normalize(targetRow[newColumn]))) {
        joined.push({
          ...renameRowColumns(targetRow, newColumnAliases),
          __join_matched: false
        });
      }
    }
  }

  return {
    rows: joined,
    columns: Array.from(
      new Set([
        ...currentColumns,
        ...Array.from(newColumnAliases.values()),
        "__join_matched"
      ])
    ),
    newColumnAliases
  };
}

function addDatasetColumnAliases(
  aliases: Map<string, Set<string>>,
  dataset: Dataset,
  columns: string[]
) {
  for (const column of columns) {
    addColumnAlias(aliases, dataset.id, column, column);
  }
}

function addColumnAlias(
  aliases: Map<string, Set<string>>,
  datasetId: string,
  originalColumn: string,
  joinedColumn: string
) {
  const key = columnAliasKey(datasetId, originalColumn);
  const values = aliases.get(key) ?? new Set<string>();
  values.add(joinedColumn);
  aliases.set(key, values);
}

function firstAliasForColumn(
  aliases: Map<string, Set<string>>,
  datasetId: string,
  originalColumn: string
) {
  return aliases.get(columnAliasKey(datasetId, originalColumn))?.values().next()
    .value;
}

function columnAliasKey(datasetId: string, column: string) {
  return `${datasetId}:${column}`;
}

function renameRowColumns(
  row: Record<string, unknown>,
  aliases: Map<string, string>
) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [aliases.get(key) ?? key, value])
  );
}

function expandCleaningRecommendationsForJoinedColumns(
  recommendations: CleaningRecommendation[],
  aliases: Map<string, Set<string>>
) {
  if (recommendations.length === 0 || aliases.size === 0) return recommendations;
  const columnsByOriginalName = new Map<string, Set<string>>();
  for (const [key, joinedColumns] of aliases) {
    const originalColumn = key.slice(key.indexOf(":") + 1);
    const values = columnsByOriginalName.get(originalColumn) ?? new Set<string>();
    for (const joinedColumn of joinedColumns) {
      values.add(joinedColumn);
    }
    columnsByOriginalName.set(originalColumn, values);
  }

  return recommendations.map((recommendation) => {
    const columns = Array.from(
      new Set(
        recommendation.transform.columns.flatMap((column) =>
          columnsByOriginalName.get(column)
            ? Array.from(columnsByOriginalName.get(column)!)
            : [column]
        )
      )
    );
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
