export type FormFamily =
  | "generic_table"
  | "hxl"
  | "ocha_3w"
  | "ocha_5w"
  | "suggested_template"
  | "xlsform";

export type FormIntakeSourceKind =
  | "suggested_template"
  | "tabular_rows"
  | "xlsform_schema";

export type FormDetectionStatus =
  | "detected"
  | "not_detected"
  | "review_needed";

export type FormEvidenceMappingStatus =
  | "ambiguous"
  | "mapped"
  | "missing";

export type FormFieldSource =
  | "column"
  | "suggested_template"
  | "xlsform_survey";

export type FormFieldSummary = {
  name: string;
  label?: string;
  type?: string;
  required?: boolean;
  evidenceNeed?: string;
  hxlTag?: string;
  choiceListName?: string;
  source: FormFieldSource;
  status: "ready" | "review_needed";
  caveats: string[];
};

export type FormDetectionSummary = {
  sourceType: "form";
  sourceKind: FormIntakeSourceKind;
  family: FormFamily;
  status: FormDetectionStatus;
  confidence: number;
  rowCount: number;
  fieldCount: number;
  detectedSignals: string[];
  hxlTagRowIndex?: number;
  strippedHxlTagRow?: boolean;
  caveats: string[];
};

export type FormEvidenceMapping = {
  evidenceNeed: string;
  fieldNames: string[];
  status: FormEvidenceMappingStatus;
  confidence: number;
  caveats: string[];
};

export type FormSchemaSummary = {
  family: FormFamily;
  fieldCount: number;
  requiredFieldCount: number;
  choiceListCount?: number;
  settingCount?: number;
  fields: FormFieldSummary[];
  caveats: string[];
};

export type FormPrivacyAudit = {
  metadataOnly: true;
  rawRowValuesIncluded: false;
  uploadedFileIncluded: false;
  preparedRowsIncluded: false;
  promptTextIncluded: false;
  retainedMetadata: string[];
  caveats: string[];
};

export type FormIntakeMetadata = {
  sourceType: "form";
  family: FormFamily;
  detection: FormDetectionSummary;
  schemaSummary: FormSchemaSummary;
  evidenceMappings: FormEvidenceMapping[];
  privacyAudit: FormPrivacyAudit;
  caveats: string[];
};

export type XlsFormWorkbookRows = {
  survey?: Record<string, unknown>[];
  choices?: Record<string, unknown>[];
  settings?: Record<string, unknown>[];
};
