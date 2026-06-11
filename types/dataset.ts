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

export type ColumnProfile = {
  columnName: string;
  inferredType: "string" | "number" | "date" | "boolean" | "unknown";
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  sampleValues: unknown[];
  isPotentialJoinField: boolean;
  isPotentialGeographicField: boolean;
  isPotentialDemographicField: boolean;
  isPotentialMetricField: boolean;
};
