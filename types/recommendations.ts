import type { DatasetProfile } from "./dataset";
import type { DecisionBrief } from "./decision";

export type DashboardSection =
  | "overview"
  | "location"
  | "comparisons"
  | "quality"
  | "details";

export type DashboardInsightType =
  | "trend"
  | "outlier"
  | "quality"
  | "coverage"
  | "comparison"
  | "concentration"
  | "distribution";

export type MetricAggregation = "sum" | "average" | "count";
export type RecommendationScope = "workflow" | "dashboard";
export type AnnotationTone = "neutral" | "success" | "warn" | "alert";
export type MobileBehavior =
  | "auto"
  | "top5"
  | "collapse-legend"
  | "table-fallback";
export type QualityBadge = "ok" | "warn" | "block";
export type SortBy = "time_asc" | "value_desc" | "label_asc";
export type MeasureType = "count" | "rate" | "ratio" | "density" | "index";
export type ClassificationMethod = "quantile" | "jenks" | "equal_interval";
export type CleaningTransformType =
  | "trim_whitespace"
  | "normalize_empty_strings"
  | "convert_numeric_strings"
  | "convert_boolean_strings";

export type AnnotationSpec = {
  id: string;
  label: string;
  xValue?: string | number;
  yValue?: number;
  value?: number;
  tone?: AnnotationTone;
};

export type CleaningTransform = {
  type: CleaningTransformType;
  columns: string[];
};

export type JoinRecommendation = {
  id: string;
  sourceDatasetId: string;
  targetDatasetId: string;
  sourceColumns: string[];
  targetColumns: string[];
  joinType: "left" | "inner" | "outer";
  confidenceScore: number;
  rationale: string;
  risks: string[];
  valueOverlapPercentage?: number;
  estimatedMatchRate?: number;
};

export type ChartRecommendation = {
  id: string;
  chartType:
    | "bar"
    | "area"
    | "choropleth"
    | "line"
    | "map"
    | "pie"
    | "table"
    | "summary"
    | "scatter"
    | "missingness"
    | "stacked-area"
    | "small-multiples";
  title: string;
  subtitle?: string;
  xField?: string;
  yField?: string;
  groupByField?: string;
  metricField?: string;
  aggregation?: MetricAggregation;
  rationale: string;
  unit?: string;
  timeScope?: string;
  sourceNote?: string;
  annotations?: AnnotationSpec[];
  qualityBadge?: QualityBadge;
  mobileBehavior?: MobileBehavior;
  sortBy?: SortBy;
  maxCategories?: number;
  screenReaderSummary?: string;
  section?: DashboardSection;
  priority?: number;
  supportedInsightIds?: string[];
  geoKey?: string;
  dataKey?: string;
  measureType?: MeasureType;
  classificationMethod?: ClassificationMethod;
  classCount?: number;
  fallbackChartType?: "bar" | "table";
};

export type DashboardRecommendation = {
  summaryMetrics: string[];
  groupByFields: string[];
  demographicFields: string[];
  metricFields: string[];
  charts: ChartRecommendation[];
  insights?: DashboardInsight[];
};

export type QualityConcern = {
  title: string;
  severity: "info" | "low" | "medium" | "high";
  rationale: string;
};

export type CleaningRecommendation = {
  id: string;
  title: string;
  affectedColumns: string[];
  transform: CleaningTransform;
  suggestedAction: string;
  rationale: string;
  confidence: number;
};

export type DashboardInsight = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "low" | "medium" | "high";
  insightType?: DashboardInsightType;
  evidence?: string[];
  recommendedAction?: string;
  confidence?: number;
  linkedChartId?: string;
};

export type DashboardInsightFact = {
  id: string;
  insightType: DashboardInsightType;
  title: string;
  description: string;
  severity: "info" | "low" | "medium" | "high";
  evidence: string[];
  recommendedAction?: string;
  metricField?: string;
  groupField?: string;
  categoryField?: string;
  linkedChartId?: string;
  confidence: number;
};

export type AIRecommendationResponse = {
  summary: string;
  source?: "deterministic" | "llm";
  fallbackReason?:
    | "missing_api_key"
    | "unsupported_provider"
    | "app_rate_limit"
    | "invalid_request"
    | "request_too_large"
    | "provider_rate_limit"
    | "provider_unavailable"
    | "request_timeout"
    | "network_error"
    | "model_response_truncated"
    | "model_response_invalid";
  retryAfterSeconds?: number;
  fallbackMessage?: string;
  recommendedPath: {
    title: string;
    rationale: string;
    confidence: number;
    actions: string[];
  };
  joinRecommendations?: JoinRecommendation[];
  cleaningRecommendations?: CleaningRecommendation[];
  dashboardRecommendations?: DashboardRecommendation;
  qualityConcerns?: QualityConcern[];
  assumptions: string[];
};

export type WorkflowContext = {
  mode: "single" | "multi";
  profiles: DatasetProfile[];
  decisionContext?: DecisionBrief;
  dashboardFacts?: DashboardInsightFact[];
  qualitySummary?: string[];
  transformationSummary?: string[];
};
