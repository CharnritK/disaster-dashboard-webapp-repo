import type { DatasetProfile } from "@/types/dataset";
import type { DecisionBrief } from "@/types/decision";
import type {
  AIRecommendationResponse,
  ChartRecommendation,
  CleaningRecommendation,
  DashboardInsightFact,
  DashboardInsightType,
  DashboardRecommendation,
  DashboardInsight,
  JoinRecommendation,
  WorkflowContext
} from "@/types/recommendations";
import { isCleaningTransformType } from "./cleaningTransforms";
import { isUseCaseTemplateId } from "./decisionContext";
import { isCoordinateField } from "./locationFields";

const allowedModes = new Set(["single", "multi"]);
const DEFAULT_STRING_LIMIT = 500;

export type WorkflowContextLimits = {
  maxProfiles: number;
  maxColumnsPerProfile: number;
  maxSampleValuesPerColumn: number;
  maxStringLength: number;
  maxDashboardFacts: number;
  maxSummaryItems: number;
};

export const DEFAULT_WORKFLOW_CONTEXT_LIMITS: WorkflowContextLimits = {
  maxProfiles: 4,
  maxColumnsPerProfile: 80,
  maxSampleValuesPerColumn: 5,
  maxStringLength: 240,
  maxDashboardFacts: 14,
  maxSummaryItems: 8
};

const MAX_DECISION_EVIDENCE_ITEMS = 5;

export function parseWorkflowContext(
  input: unknown,
  limits: WorkflowContextLimits = DEFAULT_WORKFLOW_CONTEXT_LIMITS
): WorkflowContext | { error: string } {
  if (!isRecord(input)) return { error: "Request body must be a JSON object." };
  if (containsRawRowPayload(input)) {
    return { error: "Recommendation requests cannot include raw row data." };
  }
  if (!allowedModes.has(String(input.mode))) return { error: "mode must be single or multi." };
  if (!Array.isArray(input.profiles)) return { error: "profiles must be an array." };
  if (input.profiles.length === 0) return { error: "profiles must include at least one dataset profile." };
  if (input.profiles.length > limits.maxProfiles) {
    return { error: `profiles cannot include more than ${limits.maxProfiles} dataset profiles.` };
  }
  const profiles = input.profiles.map((profile) => parseDatasetProfile(profile, limits));
  if (profiles.some((profile) => !profile)) return { error: "profiles contains an invalid dataset profile." };
  const dashboardFacts = Array.isArray(input.dashboardFacts)
    ? input.dashboardFacts
        .map((fact) => parseDashboardInsightFact(fact, limits))
        .filter((fact): fact is DashboardInsightFact => Boolean(fact))
        .slice(0, limits.maxDashboardFacts)
    : undefined;
  return {
    mode: input.mode as WorkflowContext["mode"],
    profiles: profiles as DatasetProfile[],
    decisionContext: parseDecisionContext(input.decisionContext, limits),
    dashboardFacts,
    qualitySummary: stringArray(input.qualitySummary, limits.maxStringLength).slice(0, limits.maxSummaryItems),
    transformationSummary: stringArray(input.transformationSummary, limits.maxStringLength).slice(0, limits.maxSummaryItems)
  };
}

export function sanitizeAIRecommendationResponse(input: unknown, fallback: AIRecommendationResponse): AIRecommendationResponse {
  if (!isRecord(input) || !isRecord(input.recommendedPath)) return fallback;
  const recommendedPath = input.recommendedPath;
  return {
    ...fallback,
    summary: stringOr(input.summary, fallback.summary),
    recommendedPath: {
      title: stringOr(recommendedPath.title, fallback.recommendedPath.title),
      rationale: stringOr(recommendedPath.rationale, fallback.recommendedPath.rationale),
      confidence: numberBetween(recommendedPath.confidence, 0, 1, fallback.recommendedPath.confidence),
      actions: normalizeRecommendedActions(recommendedPath.actions, fallback.recommendedPath.actions)
    },
    assumptions: Array.isArray(input.assumptions) ? stringArray(input.assumptions).slice(0, 8) : fallback.assumptions,
    joinRecommendations: Array.isArray(input.joinRecommendations)
      ? input.joinRecommendations.map(parseJoinRecommendation).filter((join): join is JoinRecommendation => Boolean(join)).slice(0, 5)
      : fallback.joinRecommendations,
    cleaningRecommendations: Array.isArray(input.cleaningRecommendations)
      ? input.cleaningRecommendations
          .map(parseCleaningRecommendation)
          .filter((recommendation): recommendation is CleaningRecommendation => Boolean(recommendation))
          .slice(0, 5)
      : fallback.cleaningRecommendations,
    dashboardRecommendations: isRecord(input.dashboardRecommendations)
      ? parseDashboardRecommendation(input.dashboardRecommendations, fallback.dashboardRecommendations)
      : fallback.dashboardRecommendations,
    qualityConcerns: Array.isArray(input.qualityConcerns)
      ? input.qualityConcerns.slice(0, 8).filter(isRecord).map((concern) => ({
          title: stringOr(concern.title, "Quality concern"),
          severity: isSeverity(concern.severity) ? concern.severity : "info",
          rationale: stringOr(concern.rationale, "Review before using this in decisions.")
        }))
      : fallback.qualityConcerns
  };
}

function normalizeRecommendedActions(input: unknown, fallback: string[]) {
  if (!Array.isArray(input)) return fallback;
  const unsupportedActions = new Set(["skip join", "use dataset as-is"]);
  const actions = input
    .map(String)
    .filter((action) => !unsupportedActions.has(action.trim().toLowerCase()))
    .slice(0, 5);
  return actions.length > 0 ? actions : fallback;
}

function parseJoinRecommendation(input: unknown): JoinRecommendation | null {
  if (!isRecord(input)) return null;
  if (typeof input.sourceDatasetId !== "string" || typeof input.targetDatasetId !== "string") return null;
  const sourceColumns = stringArray(input.sourceColumns);
  const targetColumns = stringArray(input.targetColumns);
  if (sourceColumns.length === 0 || targetColumns.length === 0) return null;
  return {
    id: stringOr(input.id, `ai-join-${sourceColumns[0]}-${targetColumns[0]}`),
    sourceDatasetId: input.sourceDatasetId,
    targetDatasetId: input.targetDatasetId,
    sourceColumns: sourceColumns.slice(0, 2),
    targetColumns: targetColumns.slice(0, 2),
    joinType: input.joinType === "inner" || input.joinType === "outer" ? input.joinType : "left",
    confidenceScore: numberBetween(input.confidenceScore, 0, 1, 0.5),
    rationale: stringOr(input.rationale, "The model identified compatible fields."),
    risks: stringArray(input.risks).slice(0, 5),
    valueOverlapPercentage: optionalPercentage(input.valueOverlapPercentage),
    estimatedMatchRate: optionalPercentage(input.estimatedMatchRate)
  };
}

function parseCleaningRecommendation(input: unknown): CleaningRecommendation | null {
  if (!isRecord(input)) return null;
  const title = stringOr(input.title, "");
  const suggestedAction = stringOr(input.suggestedAction, "");
  const affectedColumns = stringArray(input.affectedColumns).slice(0, 8);
  const transform = parseCleaningTransform(input.transform, affectedColumns, `${title} ${suggestedAction}`);
  if (!title || !suggestedAction) return null;
  if (!transform) return null;
  return {
    id: stringOr(input.id, `clean-${slugify(title)}`),
    title,
    affectedColumns: affectedColumns.length ? affectedColumns : transform.columns,
    transform,
    suggestedAction,
    rationale: stringOr(input.rationale, "Review this cleaning recommendation before publishing."),
    confidence: numberBetween(input.confidence, 0, 1, 0.5)
  };
}

function parseCleaningTransform(input: unknown, fallbackColumns: string[], text: string): CleaningRecommendation["transform"] | null {
  const transformType = isRecord(input) && isCleaningTransformType(input.type)
    ? input.type
    : inferCleaningTransformType(text);
  if (!transformType) return null;
  const columns = isRecord(input)
    ? stringArray(input.columns).slice(0, 8)
    : [];
  const normalizedColumns = columns.length ? columns : fallbackColumns;
  if (normalizedColumns.length === 0) return null;
  return {
    type: transformType,
    columns: normalizedColumns
  };
}

function inferCleaningTransformType(text: string): CleaningRecommendation["transform"]["type"] | null {
  const lower = text.toLowerCase();
  if (lower.includes("trim") || lower.includes("whitespace")) return "trim_whitespace";
  if (lower.includes("blank") || lower.includes("empty string")) return "normalize_empty_strings";
  if (lower.includes("numeric") || lower.includes("number")) return "convert_numeric_strings";
  if (lower.includes("boolean") || lower.includes("true/false")) return "convert_boolean_strings";
  return null;
}

function parseDashboardRecommendation(input: unknown, fallback?: DashboardRecommendation): DashboardRecommendation | undefined {
  if (!isRecord(input)) return fallback;
  const charts = Array.isArray(input.charts)
    ? input.charts.map(parseChartRecommendation).filter((chart): chart is ChartRecommendation => Boolean(chart)).slice(0, 10)
    : fallback?.charts ?? [];
  const summaryMetrics = stringArray(input.summaryMetrics).slice(0, 6);
  const groupByFields = stringArray(input.groupByFields).slice(0, 6);
  const demographicFields = stringArray(input.demographicFields).slice(0, 6);
  const metricFields = stringArray(input.metricFields).slice(0, 6);
  const insights = Array.isArray(input.insights)
    ? input.insights.map(parseDashboardInsight).filter((insight): insight is DashboardInsight => Boolean(insight)).slice(0, 6)
    : fallback?.insights;
  return {
    summaryMetrics: summaryMetrics.length ? summaryMetrics : fallback?.summaryMetrics ?? [],
    groupByFields: groupByFields.length ? groupByFields : fallback?.groupByFields ?? [],
    demographicFields: demographicFields.length ? demographicFields : fallback?.demographicFields ?? [],
    metricFields: metricFields.length ? metricFields : fallback?.metricFields ?? [],
    charts,
    insights
  };
}

function parseChartRecommendation(input: unknown): ChartRecommendation | null {
  if (!isRecord(input)) return null;
  const chartType = isChartType(input.chartType) ? input.chartType : "bar";
  return {
    id: stringOr(input.id, `ai-chart-${chartType}`),
    chartType,
    title: stringOr(input.title, "Recommended chart"),
    subtitle: optionalString(input.subtitle),
    xField: optionalString(input.xField),
    yField: optionalString(input.yField),
    groupByField: optionalString(input.groupByField),
    metricField: optionalString(input.metricField),
    aggregation: isMetricAggregation(input.aggregation) ? input.aggregation : undefined,
    rationale: stringOr(input.rationale, "This chart supports the recommended dashboard path."),
    unit: optionalString(input.unit),
    timeScope: optionalString(input.timeScope),
    sourceNote: optionalString(input.sourceNote),
    annotations: parseAnnotations(input.annotations),
    qualityBadge: isQualityBadge(input.qualityBadge) ? input.qualityBadge : undefined,
    mobileBehavior: isMobileBehavior(input.mobileBehavior) ? input.mobileBehavior : undefined,
    sortBy: isSortBy(input.sortBy) ? input.sortBy : undefined,
    maxCategories: typeof input.maxCategories === "number" ? Math.round(numberBetween(input.maxCategories, 1, 50, 10)) : undefined,
    screenReaderSummary: optionalString(input.screenReaderSummary),
    section: isDashboardSection(input.section) ? input.section : undefined,
    priority: typeof input.priority === "number" ? numberBetween(input.priority, 0, 100, 50) : undefined,
    supportedInsightIds: stringArray(input.supportedInsightIds).slice(0, 6),
    geoKey: optionalString(input.geoKey),
    dataKey: optionalString(input.dataKey),
    measureType: isMeasureType(input.measureType) ? input.measureType : undefined,
    classificationMethod: isClassificationMethod(input.classificationMethod) ? input.classificationMethod : undefined,
    classCount: typeof input.classCount === "number" ? Math.round(numberBetween(input.classCount, 2, 9, 5)) : undefined,
    fallbackChartType: input.fallbackChartType === "bar" || input.fallbackChartType === "table" ? input.fallbackChartType : undefined
  };
}

function parseAnnotations(input: unknown): ChartRecommendation["annotations"] {
  if (!Array.isArray(input)) return undefined;
  const annotations = input
    .filter(isRecord)
    .map((annotation, index) => ({
      id: stringOr(annotation.id, `annotation-${index + 1}`),
      label: stringOr(annotation.label, ""),
      xValue: typeof annotation.xValue === "string" || typeof annotation.xValue === "number"
        ? annotation.xValue
        : undefined,
      yValue: typeof annotation.yValue === "number" && Number.isFinite(annotation.yValue)
        ? annotation.yValue
        : undefined,
      value: typeof annotation.value === "number" && Number.isFinite(annotation.value)
        ? annotation.value
        : undefined,
      tone: isAnnotationTone(annotation.tone) ? annotation.tone : undefined,
    }))
    .filter((annotation) => annotation.label)
    .slice(0, 4);
  return annotations.length ? annotations : undefined;
}

function parseDashboardInsight(input: unknown): DashboardInsight | null {
  if (!isRecord(input)) return null;
  const title = stringOr(input.title, "");
  const description = stringOr(input.description, "");
  if (!title || !description) return null;
  return {
    id: stringOr(input.id, `insight-${slugify(title)}`),
    title,
    description,
    severity: isSeverity(input.severity) ? input.severity : "info",
    insightType: isInsightType(input.insightType) ? input.insightType : undefined,
    evidence: stringArray(input.evidence).slice(0, 4),
    recommendedAction: typeof input.recommendedAction === "string" ? input.recommendedAction : undefined,
    confidence: typeof input.confidence === "number" ? numberBetween(input.confidence, 0, 1, 0.5) : undefined,
    linkedChartId: typeof input.linkedChartId === "string" ? input.linkedChartId : undefined
  };
}

function parseDashboardInsightFact(input: unknown, limits: WorkflowContextLimits): DashboardInsightFact | null {
  if (!isRecord(input)) return null;
  const title = stringOr(input.title, "", limits.maxStringLength);
  const description = stringOr(input.description, "", limits.maxStringLength);
  const evidence = stringArray(input.evidence, limits.maxStringLength).slice(0, 5);
  if (!title || !description || evidence.length === 0) return null;
  return {
    id: stringOr(input.id, `fact-${slugify(title)}`, limits.maxStringLength),
    insightType: isInsightType(input.insightType) ? input.insightType : "coverage",
    title,
    description,
    severity: isSeverity(input.severity) ? input.severity : "info",
    evidence,
    recommendedAction: typeof input.recommendedAction === "string" ? truncateString(input.recommendedAction, limits.maxStringLength) : undefined,
    metricField: typeof input.metricField === "string" ? truncateString(input.metricField, limits.maxStringLength) : undefined,
    groupField: typeof input.groupField === "string" ? truncateString(input.groupField, limits.maxStringLength) : undefined,
    categoryField: typeof input.categoryField === "string" ? truncateString(input.categoryField, limits.maxStringLength) : undefined,
    linkedChartId: typeof input.linkedChartId === "string" ? truncateString(input.linkedChartId, limits.maxStringLength) : undefined,
    confidence: typeof input.confidence === "number" ? numberBetween(input.confidence, 0, 1, 0.5) : 0.5
  };
}

export function minimizeProfiles(profiles: DatasetProfile[]) {
  return profiles.map((profile) => ({
    datasetId: profile.datasetId,
    rowCount: profile.rowCount,
    columnCount: profile.columnCount,
    duplicateRowCount: profile.duplicateRowCount,
    potentialPrimaryKeys: profile.potentialPrimaryKeys,
    potentialJoinFields: profile.potentialJoinFields,
    potentialGeographicFields: profile.potentialGeographicFields,
    potentialDemographicFields: profile.potentialDemographicFields,
    potentialMetricFields: profile.potentialMetricFields,
    inputHints: minimizeInputHints(profile.inputHints),
    formatAssessment: minimizeFormatAssessment(profile.formatAssessment),
    columns: profile.columns.map((column) => ({
      columnName: column.columnName,
      inferredType: column.inferredType,
      missingPercentage: column.missingPercentage,
      uniqueCount: column.uniqueCount,
      sampleValues: isCoordinateField(column.columnName)
        ? []
        : column.sampleValues.slice(0, 3)
    })),
  }));
}

function parseDatasetProfile(input: unknown, limits: WorkflowContextLimits): DatasetProfile | null {
  if (!isRecord(input) || typeof input.datasetId !== "string") return null;
  const arrays = [
    "potentialPrimaryKeys",
    "potentialJoinFields",
    "potentialGeographicFields",
    "potentialDemographicFields",
    "potentialMetricFields"
  ];
  for (const key of arrays) {
    if (!Array.isArray(input[key])) return null;
  }
  if (Array.isArray(input.columns) && input.columns.length > limits.maxColumnsPerProfile) return null;
  return {
    datasetId: truncateString(input.datasetId, limits.maxStringLength),
    rowCount: optionalNumber(input.rowCount),
    columnCount: optionalNumber(input.columnCount),
    duplicateRowCount: optionalNumber(input.duplicateRowCount),
    columns: Array.isArray(input.columns) ? input.columns.filter(isRecord).map((column) => ({
      columnName: stringOr(column.columnName, "unknown", limits.maxStringLength),
      inferredType: isColumnType(column.inferredType) ? column.inferredType : "unknown",
      missingCount: numberBetween(column.missingCount, 0, Number.MAX_SAFE_INTEGER, 0),
      missingPercentage: numberBetween(column.missingPercentage, 0, 100, 0),
      uniqueCount: numberBetween(column.uniqueCount, 0, Number.MAX_SAFE_INTEGER, 0),
      sampleValues: Array.isArray(column.sampleValues)
        ? column.sampleValues
            .slice(0, limits.maxSampleValuesPerColumn)
            .map((value) => truncateString(String(value), limits.maxStringLength))
        : [],
      isPotentialJoinField: Boolean(column.isPotentialJoinField),
      isPotentialGeographicField: Boolean(column.isPotentialGeographicField),
      isPotentialDemographicField: Boolean(column.isPotentialDemographicField),
      isPotentialMetricField: Boolean(column.isPotentialMetricField)
    })) : [],
    potentialPrimaryKeys: stringArray(input.potentialPrimaryKeys, limits.maxStringLength).slice(0, limits.maxColumnsPerProfile),
    potentialJoinFields: stringArray(input.potentialJoinFields, limits.maxStringLength).slice(0, limits.maxColumnsPerProfile),
    potentialGeographicFields: stringArray(input.potentialGeographicFields, limits.maxStringLength).slice(0, limits.maxColumnsPerProfile),
    potentialDemographicFields: stringArray(input.potentialDemographicFields, limits.maxStringLength).slice(0, limits.maxColumnsPerProfile),
    potentialMetricFields: stringArray(input.potentialMetricFields, limits.maxStringLength).slice(0, limits.maxColumnsPerProfile),
    inputHints: parseInputHints(input.inputHints, limits),
    formatAssessment: parseFormatAssessment(input.formatAssessment, limits),
  };
}

function minimizeInputHints(inputHints: DatasetProfile["inputHints"]) {
  if (!inputHints) return undefined;
  return compactRecord({
    evidenceRole: optionalString(inputHints.evidenceRole, DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength),
    primaryField: optionalString(inputHints.primaryField, DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength),
    joinField: optionalString(inputHints.joinField, DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength),
    timeField: optionalString(inputHints.timeField, DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength),
    measurementUnit: optionalString(inputHints.measurementUnit, DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength),
    semanticNotes: optionalString(inputHints.semanticNotes, DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength),
  });
}

function minimizeFormatAssessment(formatAssessment: DatasetProfile["formatAssessment"]) {
  if (!formatAssessment) return undefined;
  return {
    status: formatAssessment.status,
    summary: truncateString(stripHtml(formatAssessment.summary), DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength),
    fileType: formatAssessment.fileType,
    sheetName: formatAssessment.sheetName
      ? truncateString(stripHtml(formatAssessment.sheetName), DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength)
      : undefined,
    sheetCount: formatAssessment.sheetCount,
    issues: formatAssessment.issues.slice(0, 5).map((issue) => ({
      severity: issue.severity,
      title: truncateString(stripHtml(issue.title), DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength),
      detail: truncateString(stripHtml(issue.detail), DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength),
      suggestedAction: issue.suggestedAction
        ? truncateString(stripHtml(issue.suggestedAction), DEFAULT_WORKFLOW_CONTEXT_LIMITS.maxStringLength)
        : undefined,
    })),
  };
}

function parseInputHints(input: unknown, limits: WorkflowContextLimits): DatasetProfile["inputHints"] {
  if (!isRecord(input)) return undefined;
  return compactRecord({
    evidenceRole: optionalString(input.evidenceRole, limits.maxStringLength),
    primaryField: optionalString(input.primaryField, limits.maxStringLength),
    joinField: optionalString(input.joinField, limits.maxStringLength),
    timeField: optionalString(input.timeField, limits.maxStringLength),
    measurementUnit: optionalString(input.measurementUnit, limits.maxStringLength),
    semanticNotes: optionalString(input.semanticNotes, limits.maxStringLength),
  });
}

function parseFormatAssessment(input: unknown, limits: WorkflowContextLimits): DatasetProfile["formatAssessment"] {
  if (!isRecord(input)) return undefined;
  const status =
    input.status === "accepted" || input.status === "review" || input.status === "rejected"
      ? input.status
      : undefined;
  const fileType = input.fileType === "csv" || input.fileType === "xlsx" ? input.fileType : "xlsx";
  if (!status) return undefined;
  return {
    status,
    summary: stringOr(input.summary, "", limits.maxStringLength),
    fileType,
    sheetName: optionalString(input.sheetName, limits.maxStringLength),
    sheetCount: optionalNumber(input.sheetCount),
    issues: Array.isArray(input.issues)
      ? input.issues
          .filter(isRecord)
          .slice(0, 5)
          .map((issue) => ({
            severity: isFormatIssueSeverity(issue.severity) ? issue.severity : "info",
            title: stringOr(issue.title, "Format note", limits.maxStringLength),
            detail: stringOr(issue.detail, "Review the uploaded file format.", limits.maxStringLength),
            suggestedAction: optionalString(issue.suggestedAction, limits.maxStringLength),
          }))
      : [],
    learningTips: stringArray(input.learningTips, limits.maxStringLength).slice(0, 5),
  };
}

function parseDecisionContext(
  input: unknown,
  limits: WorkflowContextLimits,
): DecisionBrief | undefined {
  if (!isRecord(input)) return undefined;
  if (!isUseCaseTemplateId(input.useCaseId)) return undefined;
  const requiredEvidence = stringArray(
    input.requiredEvidence,
    limits.maxStringLength,
  )
    .map(stripHtml)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_DECISION_EVIDENCE_ITEMS);
  return {
    useCaseId: input.useCaseId,
    decisionQuestion: stringOr(input.decisionQuestion, "", limits.maxStringLength),
    intendedAction: stringOr(input.intendedAction, "", limits.maxStringLength),
    decisionMaker: stringOr(input.decisionMaker, "", limits.maxStringLength),
    geographyScope: stringOr(input.geographyScope, "", limits.maxStringLength),
    timeframe: stringOr(input.timeframe, "", limits.maxStringLength),
    requiredEvidence,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function containsRawRowPayload(value: unknown, depth = 0): boolean {
  if (depth > 6) return false;
  if (Array.isArray(value)) {
    return value.some((item) => containsRawRowPayload(item, depth + 1));
  }
  if (!isRecord(value)) return false;
  for (const [key, child] of Object.entries(value)) {
    if (
      (key === "rows" || key === "data" || key === "sampleRows") &&
      Array.isArray(child)
    ) {
      return true;
    }
    if (containsRawRowPayload(child, depth + 1)) return true;
  }
  return false;
}

function stringOr(value: unknown, fallback: string, maxLength = DEFAULT_STRING_LIMIT) {
  return typeof value === "string" && value.trim() ? truncateString(stripHtml(value.trim()), maxLength) : fallback;
}

function optionalString(value: unknown, maxLength = DEFAULT_STRING_LIMIT) {
  return typeof value === "string" && value.trim()
    ? truncateString(stripHtml(value.trim()), maxLength)
    : undefined;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function optionalPercentage(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const percent = value > 0 && value <= 1 ? value * 100 : value;
  return Math.round(numberBetween(percent, 0, 100, percent) * 10) / 10;
}

function stringArray(value: unknown, maxLength = DEFAULT_STRING_LIMIT) {
  return Array.isArray(value) ? value.map((item) => truncateString(stripHtml(String(item)), maxLength)) : [];
}

function numberBetween(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "recommendation";
}

function truncateString(value: string, maxLength: number) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function isColumnType(value: unknown): value is DatasetProfile["columns"][number]["inferredType"] {
  return value === "string" || value === "number" || value === "date" || value === "boolean" || value === "unknown";
}

function isSeverity(value: unknown): value is "info" | "low" | "medium" | "high" {
  return value === "info" || value === "low" || value === "medium" || value === "high";
}

function isFormatIssueSeverity(value: unknown): value is NonNullable<DatasetProfile["formatAssessment"]>["issues"][number]["severity"] {
  return value === "info" || value === "warning" || value === "error";
}

function compactRecord<T extends Record<string, string | undefined>>(record: T) {
  const entries = Object.entries(record).filter(([, value]) => Boolean(value));
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries) as {
    [K in keyof T]?: string;
  };
}

function isDashboardSection(value: unknown): value is ChartRecommendation["section"] {
  return value === "overview" || value === "location" || value === "comparisons" || value === "quality" || value === "details";
}

function isMetricAggregation(value: unknown): value is ChartRecommendation["aggregation"] {
  return value === "sum" || value === "average" || value === "count";
}

function isAnnotationTone(value: unknown): value is NonNullable<NonNullable<ChartRecommendation["annotations"]>[number]["tone"]> {
  return value === "neutral" || value === "success" || value === "warn" || value === "alert";
}

function isMobileBehavior(value: unknown): value is ChartRecommendation["mobileBehavior"] {
  return value === "auto" || value === "top5" || value === "collapse-legend" || value === "table-fallback";
}

function isQualityBadge(value: unknown): value is ChartRecommendation["qualityBadge"] {
  return value === "ok" || value === "warn" || value === "block";
}

function isSortBy(value: unknown): value is ChartRecommendation["sortBy"] {
  return value === "time_asc" || value === "value_desc" || value === "label_asc";
}

function isMeasureType(value: unknown): value is ChartRecommendation["measureType"] {
  return value === "count" || value === "rate" || value === "ratio" || value === "density" || value === "index";
}

function isClassificationMethod(value: unknown): value is ChartRecommendation["classificationMethod"] {
  return value === "quantile" || value === "jenks" || value === "equal_interval";
}

function isInsightType(value: unknown): value is DashboardInsightType {
  return (
    value === "trend" ||
    value === "outlier" ||
    value === "quality" ||
    value === "coverage" ||
    value === "comparison" ||
    value === "concentration" ||
    value === "distribution"
  );
}

function isChartType(value: unknown): value is ChartRecommendation["chartType"] {
  return (
    value === "bar" ||
    value === "area" ||
    value === "choropleth" ||
    value === "line" ||
    value === "map" ||
    value === "pie" ||
    value === "table" ||
    value === "summary" ||
    value === "scatter" ||
    value === "missingness" ||
    value === "stacked-area" ||
    value === "small-multiples"
  );
}
