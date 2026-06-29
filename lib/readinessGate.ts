import type { Dataset } from "@/types/dataset";
import type {
  DecisionBrief,
  DecisionReadinessResult,
  DecisionReadinessStatus,
} from "@/types/decision";

export type ReadinessBlocker = {
  id: string;
  label: string;
};

export function readinessBlockerKey(blocker: ReadinessBlocker): string {
  return JSON.stringify([blocker.id, blocker.label]);
}

export function readinessBlockerSignature(
  readiness?: DecisionReadinessResult,
): string {
  return JSON.stringify(getReadinessBlockers(readiness).map(readinessBlockerKey));
}

export function readinessResultSignature(
  readiness?: DecisionReadinessResult,
): string {
  if (!readiness) return "";

  return JSON.stringify({
    status: readiness.status,
    title: readiness.title,
    summary: readiness.summary,
    caveats: readiness.caveats,
    blockerCount: readiness.blockerCount,
    reviewCount: readiness.reviewCount,
    requiredEvidenceCovered: readiness.requiredEvidenceCovered,
    requiredEvidenceMissing: readiness.requiredEvidenceMissing,
  });
}

export function readinessAcknowledgementScopeKey({
  decisionBrief,
  preparedDataset,
  decisionReadiness,
}: {
  decisionBrief: DecisionBrief;
  preparedDataset?: Dataset;
  decisionReadiness?: DecisionReadinessResult;
}): string {
  const preparedDatasetMetadata = preparedDataset
    ? {
        id: preparedDataset.id,
        name: preparedDataset.name,
        sourceType: preparedDataset.sourceType,
        fileType: preparedDataset.fileType,
        uploadedAt: preparedDataset.uploadedAt,
        rowCount: preparedDataset.rowCount ?? preparedDataset.data?.length ?? 0,
        columnCount:
          preparedDataset.columnCount ??
          preparedDataset.columns?.length ??
          preparedDataset.profile?.columns.length ??
          0,
        columns:
          preparedDataset.columns ??
          preparedDataset.profile?.columns.map((column) => column.columnName) ??
          [],
      }
    : null;

  return JSON.stringify({
    readiness: readinessResultSignature(decisionReadiness),
    preparedDataset: preparedDatasetMetadata,
    decisionBrief: {
      useCaseId: decisionBrief.useCaseId,
      decisionQuestion: decisionBrief.decisionQuestion,
      intendedAction: decisionBrief.intendedAction,
      decisionMaker: decisionBrief.decisionMaker,
      geographyScope: decisionBrief.geographyScope,
      timeframe: decisionBrief.timeframe,
      requiredEvidence: decisionBrief.requiredEvidence,
    },
  });
}

export function getReadinessBlockers(
  readiness?: DecisionReadinessResult,
): ReadinessBlocker[] {
  if (readiness?.status !== "decision_unsafe") return [];

  const blockerCount = Math.max(readiness.blockerCount, readiness.caveats.length);

  return Array.from({ length: blockerCount }, (_, index) => ({
    id: `blocker-${index + 1}`,
    label: readiness.caveats[index] ?? `Unlabeled evidence blocker ${index + 1}`,
  }));
}

export function canGenerateDashboard(
  readiness: DecisionReadinessResult | undefined,
  acknowledgedBlockerIds: ReadonlySet<string>,
): boolean {
  const blockers = getReadinessBlockers(readiness);
  if (readiness?.status === "decision_unsafe" && blockers.length === 0) {
    return false;
  }
  return blockers.every((blocker) => acknowledgedBlockerIds.has(blocker.id));
}

export function watermarkLabelForStatus(
  status?: DecisionReadinessStatus,
): string | null {
  if (status === "decision_unsafe") return "REVIEW ONLY - UNSAFE EVIDENCE";
  if (status === "review_needed") return "REVIEW ONLY";
  return null;
}
