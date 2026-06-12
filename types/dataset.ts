export type DatasetInputHints = {
  evidenceRole?: string;
  primaryField?: string;
  joinField?: string;
  timeField?: string;
  measurementUnit?: string;
  semanticNotes?: string;
};

export type DatasetFormatAssessmentStatus = "accepted" | "review" | "rejected";
export type DatasetFormatIssueSeverity = "info" | "warning" | "error";

export type DatasetFormatIssue = {
  severity: DatasetFormatIssueSeverity;
  title: string;
  detail: string;
  suggestedAction?: string;
};

export type DatasetFormatAssessment = {
  status: DatasetFormatAssessmentStatus;
  summary: string;
  fileType: "csv" | "xlsx";
  sheetName?: string;
  sheetCount?: number;
  issues: DatasetFormatIssue[];
  learningTips: string[];
};

export type Dataset = {
  id: string;
  name: string;
  originalFilename?: string;
  fileType: "csv" | "xlsx";
  sourceType: "upload" | "sample";
  rowCount?: number;
  columnCount?: number;
  columns?: string[];
  uploadedAt: string;
  inputHints?: DatasetInputHints;
  formatAssessment?: DatasetFormatAssessment;
  data?: Record<string, unknown>[];
  profile?: DatasetProfile;
  sampleRows?: Record<string, unknown>[];
};

export type DatasetProfile = {
  datasetId: string;
  rowCount?: number;
  columnCount?: number;
  columns: ColumnProfile[];
  duplicateRowCount?: number;
  inputHints?: DatasetInputHints;
  formatAssessment?: DatasetFormatAssessment;
  potentialPrimaryKeys: string[];
  potentialJoinFields: string[];
  potentialGeographicFields: string[];
  potentialDemographicFields: string[];
  potentialMetricFields: string[];
};

export type ColumnTopValue = {
  value: string;
  count: number;
  percentage: number;
};

export type ColumnNumericStats = {
  min: number;
  max: number;
  mean: number;
  median: number;
  q1: number;
  q3: number;
  negativeCount: number;
  zeroCount: number;
};

export type ColumnDateStats = {
  earliest: string;
  latest: string;
  validCount: number;
  invalidCount: number;
};

export type ColumnDescriptiveStats = {
  nonMissingCount: number;
  topValues: ColumnTopValue[];
  numeric?: ColumnNumericStats;
  date?: ColumnDateStats;
};

export type ColumnProfile = {
  columnName: string;
  inferredType: "string" | "number" | "date" | "boolean" | "unknown";
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  sampleValues: unknown[];
  descriptiveStats?: ColumnDescriptiveStats;
  isPotentialJoinField: boolean;
  isPotentialGeographicField: boolean;
  isPotentialDemographicField: boolean;
  isPotentialMetricField: boolean;
};
