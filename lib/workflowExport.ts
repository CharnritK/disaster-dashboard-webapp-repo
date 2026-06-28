import type { Dataset } from "@/types/dataset";
import type {
  DecisionBrief,
  DecisionReadinessResult,
  EvidenceCoverageSummary,
} from "@/types/decision";
import type { CopilotFallbackReason, DecisionHandoffAiMode } from "@/types/copilot";
import type { DashboardRecommendation, JoinRecommendation } from "@/types/recommendations";
import type { QualityCheckResult } from "@/types/quality";
import type { TransformationStep } from "@/types/transformations";
import type { FormIntakeMetadata } from "@/types/formIntake";
import { readinessStatusLabel } from "./decisionContext";
import { toCsv } from "./exportCsv";

export type DecisionHandoffPacketInput = {
  generatedAt?: string;
  acceptedCaveats?: string[];
  decisionBrief: DecisionBrief;
  decisionOwner?: string;
  evidenceCoverage: EvidenceCoverageSummary;
  decisionReadiness?: DecisionReadinessResult;
  datasets: Dataset[];
  reviewer?: string;
  reviewByDate?: string;
  selectedJoinRecommendations: JoinRecommendation[];
  qualityResults: QualityCheckResult[];
  transformationLog: TransformationStep[];
  aiMode: DecisionHandoffAiMode;
  aiFallbackReason?: CopilotFallbackReason;
  aiFallbackMessage?: string;
};

export type DashboardProjectKitInput = DecisionHandoffPacketInput & {
  preparedDataset: Dataset;
  dashboardRecommendation: DashboardRecommendation;
};

export function buildDecisionHandoffPacket(input: DecisionHandoffPacketInput) {
  const readiness = input.decisionReadiness;
  const isUnsafe = readiness?.status === "decision_unsafe";
  const missingEvidence = input.evidenceCoverage.items.filter(
    (item) => item.status === "missing",
  );
  const qualityIssues = input.qualityResults.filter((issue) => issue.status !== "pass");
  const limitations = [
    ...missingEvidence.map(
      (item) => `Missing ${item.evidenceNeed}: ${item.nextAction}`,
    ),
    ...(readiness?.caveats ?? []),
    ...(isUnsafe
      ? ["Outputs are review-only until blockers are corrected or explicitly accepted by a decision owner."]
      : []),
  ];
  const unresolvedBlockers = [
    ...missingEvidence.map((item) => ({
      type: "missing_evidence",
      evidenceNeed: item.evidenceNeed,
      action: item.nextAction,
    })),
    ...qualityIssues
      .filter((issue) => issue.status === "fail")
      .map((issue) => ({
        type: "quality_blocker",
        evidenceNeed: issue.evidenceNeed,
        action: issue.suggestedAction ?? issue.description,
      })),
  ];
  const sourceRegister = input.datasets.map(sourceRegisterForDataset);
  const transformationLineage = input.transformationLog.map((step) => ({
    id: step.id,
    stepType: step.stepType,
    description: step.description,
    affectedColumns: step.affectedColumns,
    timestamp: step.timestamp,
  }));

  return {
    dossierVersion: "2.0",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    decisionContext: {
      useCaseId: input.decisionBrief.useCaseId,
      question: input.decisionBrief.decisionQuestion,
      intendedAction: input.decisionBrief.intendedAction,
      decisionMaker: input.decisionBrief.decisionMaker,
      geographyScope: input.decisionBrief.geographyScope,
      timeframe: input.decisionBrief.timeframe,
      requiredEvidence: input.decisionBrief.requiredEvidence,
    },
    dossier: {
      decisionOwner: input.decisionOwner ?? input.decisionBrief.decisionMaker,
      reviewer: input.reviewer ?? "Reviewer not assigned",
      reviewByDate: input.reviewByDate,
      acceptedCaveats: input.acceptedCaveats ?? [],
      unresolvedBlockers,
      sourceRegister,
      transformationLineage,
      aiMode: input.aiMode,
      aiFallbackReason: input.aiFallbackReason,
    },
    evidenceCoverage: input.evidenceCoverage,
    decisionReadiness: readiness
      ? {
          status: readiness.status,
          label: readinessStatusLabel(readiness.status),
          summary: readiness.summary,
          caveats: readiness.caveats,
          blockerCount: readiness.blockerCount,
          reviewCount: readiness.reviewCount,
          requiredEvidenceCovered: readiness.requiredEvidenceCovered,
          requiredEvidenceMissing: readiness.requiredEvidenceMissing,
        }
      : undefined,
    datasetLineage: input.datasets.map((dataset) => ({
      id: dataset.id,
      name: dataset.name,
      originalFilename: dataset.originalFilename,
      sourceType: dataset.sourceType,
      fileType: dataset.fileType,
      uploadedAt: dataset.uploadedAt,
      rowCount: dataset.rowCount ?? dataset.data?.length ?? 0,
      columnCount: dataset.columnCount ?? dataset.columns?.length ?? 0,
      fields: dataset.columns ?? dataset.profile?.columns.map((column) => column.columnName) ?? [],
      inputHints: dataset.inputHints,
      formIntake: formIntakeForDataset(dataset),
      formatAssessment: dataset.formatAssessment
        ? {
            status: dataset.formatAssessment.status,
            summary: dataset.formatAssessment.summary,
            issues: dataset.formatAssessment.issues,
            learningTips: dataset.formatAssessment.learningTips,
          }
        : undefined,
    })),
    joinReview: input.selectedJoinRecommendations.map((join) => ({
      id: join.id,
      sourceDatasetId: join.sourceDatasetId,
      targetDatasetId: join.targetDatasetId,
      sourceColumns: join.sourceColumns,
      targetColumns: join.targetColumns,
      combineType: join.joinType,
      confidenceScore: join.confidenceScore,
      estimatedMatchRate: join.estimatedMatchRate,
      rationale: join.rationale,
      risks: join.risks,
    })),
    qualitySummary: {
      issueCount: qualityIssues.length,
      highSeverityCount: qualityIssues.filter((issue) => issue.severity === "high").length,
      issues: qualityIssues.map((issue) => ({
        id: issue.id,
        status: issue.status,
        severity: issue.severity,
        checkType: issue.checkType,
        description: issue.description,
        evidenceNeed: issue.evidenceNeed,
        caveat: issue.caveat,
        suggestedAction: issue.suggestedAction,
      })),
    },
    transformations: input.transformationLog,
    aiAssistance: {
      mode: input.aiMode,
      summary: aiModeSummary(input.aiMode),
      fallbackReason: input.aiFallbackReason,
      fallbackMessage: input.aiFallbackMessage,
    },
    limitations: Array.from(new Set(limitations)),
    reviewNotice: isUnsafe
      ? "Dashboard generation is allowed for review, not for automatic action."
      : "Review evidence coverage, quality caveats, joins, and transformations before action.",
  };
}

export function buildDashboardProjectKit(input: DashboardProjectKitInput) {
  const handoffPacket = buildDecisionHandoffPacket(input);
  const preparedDataCsv = toCsv(input.preparedDataset.data ?? []);
  const preparedDataSchema = buildPreparedDataSchema(input.preparedDataset);
  const dashboardConfig = {
    decisionContext: handoffPacket.decisionContext,
    aiAssistance: handoffPacket.aiAssistance,
    charts: input.dashboardRecommendation.charts.map((chart) => ({
      id: chart.id,
      chartType: chart.chartType,
      title: chart.title,
      subtitle: chart.subtitle,
      xField: chart.xField,
      yField: chart.yField,
      groupByField: chart.groupByField,
      metricField: chart.metricField,
      aggregation: chart.aggregation,
      rationale: chart.rationale,
      sourceNote: chart.sourceNote,
      caveat: chart.sourceNote,
      screenReaderSummary: chart.screenReaderSummary,
      section: chart.section,
      qualityBadge: chart.qualityBadge,
      mobileBehavior: chart.mobileBehavior,
      sortBy: chart.sortBy,
      maxCategories: chart.maxCategories,
      unit: chart.unit,
      timeScope: chart.timeScope,
      annotations: chart.annotations,
      supportedInsightIds: chart.supportedInsightIds,
      geoKey: chart.geoKey,
      dataKey: chart.dataKey,
      measureType: chart.measureType,
      classificationMethod: chart.classificationMethod,
      classCount: chart.classCount,
      fallbackChartType: chart.fallbackChartType,
    })),
    summaryMetrics: input.dashboardRecommendation.summaryMetrics,
    groupByFields: input.dashboardRecommendation.groupByFields,
    metricFields: input.dashboardRecommendation.metricFields,
    insights: input.dashboardRecommendation.insights ?? [],
  };
  const readme = buildProjectKitReadme(handoffPacket, preparedDataSchema);
  const files = {
    "README.md": readme,
    "prepared-data.csv": preparedDataCsv,
    "decision-handoff-log.json": JSON.stringify(handoffPacket, null, 2),
    "dashboard-config.json": JSON.stringify(dashboardConfig, null, 2),
    "prepared-data-schema.json": JSON.stringify(preparedDataSchema, null, 2),
    "transformation-log.json": JSON.stringify(input.transformationLog, null, 2),
  };

  return {
    packageType: "dashboard_copilot_project_kit",
    generatedAt: handoffPacket.generatedAt,
    reviewNotice: handoffPacket.reviewNotice,
    manifest: {
      files: Object.keys(files),
      preparedDataset: {
        id: input.preparedDataset.id,
        name: input.preparedDataset.name,
        rowCount: preparedDataSchema.rowCount,
        columnCount: preparedDataSchema.columnCount,
      },
      reviewRequired: true,
    },
    readme,
    preparedDataSchema,
    dashboardConfig,
    decisionHandoff: handoffPacket,
    transformationLog: input.transformationLog,
    files,
  };
}

function aiModeSummary(mode: DecisionHandoffAiMode) {
  if (mode === "llm") {
    return "AI recommendations were used, with deterministic validation and caveats retained.";
  }
  if (mode === "disabled") {
    return "AI was off. Deterministic profiling, evidence coverage, readiness checks, and dashboard recommendations remained available.";
  }
  if (mode === "fallback") {
    return "AI recommendations were unavailable. The app used deterministic recommendations. Review joins and caveats before action.";
  }
  return "Deterministic recommendations were used without external AI assistance.";
}

function sourceRegisterForDataset(dataset: Dataset) {
  const formHints = dataset.inputHints as
    | (Dataset["inputHints"] & {
        formDetection?: { status?: string };
        formFamily?: string;
        formMetadata?: FormIntakeMetadata;
      })
    | undefined;
  return {
    id: dataset.id,
    name: dataset.name,
    sourceType: dataset.sourceType,
    fileType: dataset.fileType,
    rowCount: dataset.rowCount ?? dataset.data?.length ?? 0,
    columnCount: dataset.columnCount ?? dataset.columns?.length ?? 0,
    formFamily: formHints?.formFamily,
    formDetectionStatus: formHints?.formDetection?.status,
    formMappingCount: formHints?.formMetadata?.evidenceMappings.length,
  };
}

function formIntakeForDataset(dataset: Dataset) {
  const metadata = dataset.inputHints?.formMetadata;
  if (!metadata) return undefined;
  return {
    family: metadata.family,
    detection: {
      sourceKind: metadata.detection.sourceKind,
      family: metadata.detection.family,
      status: metadata.detection.status,
      confidence: metadata.detection.confidence,
      fieldCount: metadata.detection.fieldCount,
      hxlTagRowIndex: metadata.detection.hxlTagRowIndex,
      strippedHxlTagRow: metadata.detection.strippedHxlTagRow,
      detectedSignals: metadata.detection.detectedSignals,
      caveats: metadata.detection.caveats,
    },
    schemaSummary: {
      family: metadata.schemaSummary.family,
      fieldCount: metadata.schemaSummary.fieldCount,
      requiredFieldCount: metadata.schemaSummary.requiredFieldCount,
      choiceListCount: metadata.schemaSummary.choiceListCount,
      settingCount: metadata.schemaSummary.settingCount,
      fields: metadata.schemaSummary.fields.map((field) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        required: field.required,
        evidenceNeed: field.evidenceNeed,
        hxlTag: field.hxlTag,
        choiceListName: field.choiceListName,
        source: field.source,
        status: field.status,
        caveats: field.caveats,
      })),
      caveats: metadata.schemaSummary.caveats,
    },
    evidenceMappings: metadata.evidenceMappings.map((mapping) => ({
      evidenceNeed: mapping.evidenceNeed,
      fieldNames: mapping.fieldNames,
      status: mapping.status,
      confidence: mapping.confidence,
      caveats: mapping.caveats,
    })),
    privacyAudit: metadata.privacyAudit,
    caveats: metadata.caveats,
  };
}

function buildPreparedDataSchema(dataset: Dataset) {
  const profileColumns = dataset.profile?.columns ?? [];
  const profileColumnNames = profileColumns.map((column) => column.columnName);
  const columns =
    dataset.columns ??
    (profileColumnNames.length > 0 ? profileColumnNames : Object.keys(dataset.data?.[0] ?? {}));
  return {
    datasetId: dataset.id,
    datasetName: dataset.name,
    rowCount: dataset.rowCount ?? dataset.data?.length ?? 0,
    columnCount: columns.length,
    fields: columns.map((name) => {
      const profile = profileColumns.find((column) => column.columnName === name);
      return {
        name,
        inferredType: profile?.inferredType ?? "unknown",
        missingPercentage: profile?.missingPercentage,
        uniqueCount: profile?.uniqueCount,
      };
    }),
  };
}

function buildProjectKitReadme(
  handoffPacket: ReturnType<typeof buildDecisionHandoffPacket>,
  schema: ReturnType<typeof buildPreparedDataSchema>,
) {
  const readiness = handoffPacket.decisionReadiness?.label ?? "Not assessed";
  return [
    "# Dashboard Copilot Project Kit",
    "",
    `Generated: ${handoffPacket.generatedAt}`,
    `Decision: ${handoffPacket.decisionContext.question}`,
    `Prepared dataset: ${schema.datasetName} (${schema.rowCount} rows, ${schema.columnCount} columns)`,
    `Decision readiness: ${readiness}`,
    "",
    "## Review Required",
    "",
    handoffPacket.reviewNotice,
    "Review evidence coverage, data quality, joins, transformations, and AI-assistance mode before operational use.",
    "",
    "## Files",
    "",
    "- `prepared-data.csv`: formula-neutralized prepared rows for second-pass analysis.",
    "- `decision-handoff-log.json`: decision context, evidence coverage, quality caveats, lineage, and review notice.",
    "- `dashboard-config.json`: chart recommendations, fields, caveats, and AI-assistance mode.",
    "- `prepared-data-schema.json`: field names, inferred types, missingness, and row/column counts.",
    "- `transformation-log.json`: row-preserving cleaning and join history.",
    "",
    "## Limitations",
    "",
    ...handoffPacket.limitations.map((limitation) => `- ${limitation}`),
  ].join("\n");
}
