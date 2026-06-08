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
