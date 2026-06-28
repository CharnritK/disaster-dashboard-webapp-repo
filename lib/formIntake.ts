import type { Dataset, DatasetInputHints } from "@/types/dataset";
import type { SuggestedDataCollectionTemplate } from "@/types/decision";
import type {
  FormDetectionStatus,
  FormEvidenceMapping,
  FormFamily,
  FormFieldSummary,
  FormIntakeMetadata,
  FormIntakeSourceKind,
  FormPrivacyAudit,
  XlsFormWorkbookRows,
} from "@/types/formIntake";

type FileType = "csv" | "xlsx";

type FormDatasetOptions = {
  filename?: string;
  datasetId?: string;
  uploadedAt?: string;
};

type RowDatasetOptions = {
  datasetId?: string;
  uploadedAt?: string;
};

type RowAnalysis = {
  columns: string[];
  metadata: FormIntakeMetadata;
  rows: Record<string, unknown>[];
};

type HxlDetection = {
  tagRowIndex: number;
  tagsByColumn: Map<string, string>;
};

type OchaDetection = {
  family: "ocha_3w" | "ocha_5w";
  confidence: number;
  signals: string[];
};

type TableDetection = {
  family: FormFamily;
  status: FormDetectionStatus;
  confidence: number;
  signals: string[];
  hxlTagRowIndex?: number;
  strippedHxlTagRow?: boolean;
  caveats: string[];
};

const DETERMINISTIC_UPLOADED_AT = "1970-01-01T00:00:00.000Z";

const RETAINED_METADATA = [
  "field_names",
  "field_labels",
  "hxl_tags",
  "schema_counts",
  "detection_status",
  "confidence_scores",
  "evidence_mapping",
  "privacy_audit",
  "caveats",
];

const EVIDENCE_RULES: {
  evidenceNeed: string;
  patterns: RegExp[];
  confidence: number;
}[] = [
  {
    evidenceNeed: "Admin geography",
    patterns: [/admin/i, /\badm\d?\b/i, /district/i, /province/i, /region/i, /where/i, /location/i, /p-?code/i, /site/i, /\barea\b/i],
    confidence: 0.86,
  },
  {
    evidenceNeed: "Timeframe/date",
    patterns: [/date/i, /when/i, /month/i, /period/i, /\bweek\b/i, /\btime\b/i],
    confidence: 0.82,
  },
  {
    evidenceNeed: "Affected population",
    patterns: [/affected/i, /beneficiar/i, /population/i, /household/i, /\bhh\b/i, /for whom/i, /forwhom/i, /people/i],
    confidence: 0.78,
  },
  {
    evidenceNeed: "Need severity",
    patterns: [/severity/i, /\bneed/i, /priority/i, /damage/i, /\bgap\b/i, /score/i],
    confidence: 0.72,
  },
  {
    evidenceNeed: "Service availability",
    patterns: [/service/i, /availability/i, /activity/i, /sector/i, /\bwhat\b/i, /intervention/i],
    confidence: 0.7,
  },
  {
    evidenceNeed: "Capacity signal",
    patterns: [/capacity/i, /stock/i, /staff/i, /supply/i, /coverage/i],
    confidence: 0.72,
  },
  {
    evidenceNeed: "Response gap",
    patterns: [/\bgap\b/i, /unmet/i, /coverage/i, /not covered/i],
    confidence: 0.72,
  },
];

export function createFormDatasetFromTemplate(
  template: SuggestedDataCollectionTemplate,
  options: FormDatasetOptions = {},
): Dataset {
  const filename = options.filename ?? `${slugify(template.title) || "form-template"}.csv`;
  const fields: FormFieldSummary[] = template.fields.map((field) => ({
    name: field.name,
    label: field.label,
    type: field.type,
    required: field.required,
    evidenceNeed: field.evidenceNeed,
    source: "suggested_template",
    status: "ready",
    caveats: field.caveat ? [field.caveat] : [],
  }));
  const metadata = buildMetadata({
    sourceKind: "suggested_template",
    family: "suggested_template",
    status: "detected",
    confidence: 1,
    rowCount: 0,
    fields,
    detectedSignals: ["suggested_data_collection_template"],
    caveats: [],
  });
  return buildDataset({
    filename,
    fileType: "csv",
    columns: fields.map((field) => field.name),
    rows: [],
    metadata,
    datasetId: options.datasetId,
    uploadedAt: options.uploadedAt,
  });
}

export function createFormDatasetFromRows(
  filename: string,
  fileType: FileType,
  rows: Record<string, unknown>[],
  options: RowDatasetOptions = {},
): Dataset {
  const analysis = analyzeRows(rows);
  return buildDataset({
    filename,
    fileType,
    columns: analysis.columns,
    rows: analysis.rows,
    metadata: analysis.metadata,
    datasetId: options.datasetId,
    uploadedAt: options.uploadedAt,
  });
}

export function detectFormIntakeMetadata(
  rows: Record<string, unknown>[],
): FormIntakeMetadata {
  return analyzeRows(rows).metadata;
}

export function detectXlsFormSchema(
  workbookRows: XlsFormWorkbookRows,
): FormIntakeMetadata {
  const surveyRows = workbookRows.survey ?? [];
  const choiceListNames = uniqueStrings(
    (workbookRows.choices ?? [])
      .map((row) => readCell(row, ["list_name", "list name", "listName"]))
      .filter((value): value is string => Boolean(value)),
  );
  const choiceListNameSet = new Set(choiceListNames);
  const fields = surveyRows
    .map((row): FormFieldSummary | undefined => {
      const name = readCell(row, ["name"]);
      if (!name) return undefined;
      const type = readCell(row, ["type"]);
      const label = readLabel(row);
      return {
        name,
        label,
        type,
        required: isRequired(readCell(row, ["required"])),
        choiceListName: choiceListNameFor(type, choiceListNameSet),
        source: "xlsform_survey",
        status: type ? "ready" : "review_needed",
        caveats: type ? [] : ["Survey field is missing an XLSForm type."],
      };
    })
    .filter((field): field is FormFieldSummary => Boolean(field));
  const hasSchemaShape = surveyRows.some((row) => hasKey(row, "type") && hasKey(row, "name"));
  const status: FormDetectionStatus =
    fields.length > 0 && hasSchemaShape ? "detected" : "review_needed";
  const caveats =
    status === "detected"
      ? []
      : ["XLSForm schema could not be confidently inferred from survey rows."];
  return buildMetadata({
    sourceKind: "xlsform_schema",
    family: "xlsform",
    status,
    confidence: status === "detected" ? (choiceListNames.length > 0 ? 0.92 : 0.84) : 0.3,
    rowCount: fields.length,
    fields,
    detectedSignals: [
      ...(surveyRows.length > 0 ? ["survey_sheet"] : []),
      ...(choiceListNames.length > 0 ? ["choices_sheet"] : []),
      ...((workbookRows.settings ?? []).length > 0 ? ["settings_sheet"] : []),
      ...(hasSchemaShape ? ["xlsform_type_name_columns"] : []),
    ],
    choiceListCount: choiceListNames.length,
    settingCount: (workbookRows.settings ?? []).length,
    caveats,
  });
}

function analyzeRows(rows: Record<string, unknown>[]): RowAnalysis {
  const columns = columnsForRows(rows);
  const hxlDetection = detectHxlTagRow(rows, columns);
  const strippedRows = hxlDetection
    ? rows.filter((_row, index) => index !== hxlDetection.tagRowIndex)
    : rows;
  const fields = columns.map((column) =>
    fieldFromColumn(column, hxlDetection?.tagsByColumn.get(column)),
  );
  const ochaDetection = detectOchaTable(columns);
  const detection: TableDetection =
    hxlDetection
      ? {
          family: "hxl" as const,
          status: "detected" as const,
          confidence: 0.95,
          signals: ["hxl_tag_row", ...fieldsWithHxlTags(fields)],
          hxlTagRowIndex: hxlDetection.tagRowIndex,
          strippedHxlTagRow: true,
          caveats: [],
        }
      : ochaDetection
        ? {
            family: ochaDetection.family,
            status: "detected" as const,
            confidence: ochaDetection.confidence,
            signals: ochaDetection.signals,
            caveats: [],
          }
        : fallbackTableDetection(columns);

  const metadata = buildMetadata({
    sourceKind: "tabular_rows",
    family: detection.family,
    status: detection.status,
    confidence: detection.confidence,
    rowCount: strippedRows.length,
    fields,
    detectedSignals: detection.signals,
    hxlTagRowIndex: detection.hxlTagRowIndex,
    strippedHxlTagRow: detection.strippedHxlTagRow,
    caveats: detection.caveats,
  });

  return {
    columns,
    metadata,
    rows: strippedRows.map((row) => copyRow(row, columns)),
  };
}

function buildDataset({
  filename,
  fileType,
  columns,
  rows,
  metadata,
  datasetId,
  uploadedAt,
}: {
  filename: string;
  fileType: FileType;
  columns: string[];
  rows: Record<string, unknown>[];
  metadata: FormIntakeMetadata;
  datasetId?: string;
  uploadedAt?: string;
}): Dataset {
  const inputHints: DatasetInputHints = {
    formFamily: metadata.family,
    formSourceKind: metadata.detection.sourceKind,
    formDetection: metadata.detection,
    formEvidenceMappings: metadata.evidenceMappings,
    formMetadata: metadata,
  };
  return {
    id: datasetId ?? stableDatasetId(filename, columns, rows.length, metadata.family),
    name: datasetName(filename),
    originalFilename: filename,
    fileType,
    sourceType: "form",
    uploadedAt: uploadedAt ?? DETERMINISTIC_UPLOADED_AT,
    rowCount: rows.length,
    columnCount: columns.length,
    columns,
    inputHints,
    data: rows,
    sampleRows: rows.slice(0, 5),
  };
}

function buildMetadata({
  sourceKind,
  family,
  status,
  confidence,
  rowCount,
  fields,
  detectedSignals,
  hxlTagRowIndex,
  strippedHxlTagRow,
  choiceListCount,
  settingCount,
  caveats,
}: {
  sourceKind: FormIntakeSourceKind;
  family: FormFamily;
  status: FormDetectionStatus;
  confidence: number;
  rowCount: number;
  fields: FormFieldSummary[];
  detectedSignals: string[];
  hxlTagRowIndex?: number;
  strippedHxlTagRow?: boolean;
  choiceListCount?: number;
  settingCount?: number;
  caveats: string[];
}): FormIntakeMetadata {
  const safeCaveats = uniqueStrings(caveats);
  const evidenceMappings = buildEvidenceMappings(fields);
  return {
    sourceType: "form",
    family,
    detection: {
      sourceType: "form",
      sourceKind,
      family,
      status,
      confidence: clampConfidence(confidence),
      rowCount,
      fieldCount: fields.length,
      detectedSignals: uniqueStrings(detectedSignals),
      hxlTagRowIndex,
      strippedHxlTagRow,
      caveats: safeCaveats,
    },
    schemaSummary: {
      family,
      fieldCount: fields.length,
      requiredFieldCount: fields.filter((field) => field.required).length,
      choiceListCount,
      settingCount,
      fields,
      caveats: safeCaveats,
    },
    evidenceMappings,
    privacyAudit: buildPrivacyAudit(sourceKind),
    caveats: safeCaveats,
  };
}

function buildPrivacyAudit(sourceKind: FormIntakeSourceKind): FormPrivacyAudit {
  return {
    metadataOnly: true,
    rawRowValuesIncluded: false,
    uploadedFileIncluded: false,
    preparedRowsIncluded: false,
    promptTextIncluded: false,
    retainedMetadata: RETAINED_METADATA,
    caveats: [
      sourceKind === "tabular_rows"
        ? "Detected form metadata excludes submitted row values; row data remains only on the dataset object for session workflow use."
        : "Detected form metadata summarizes schema only and excludes uploaded files, prompts, and prepared rows.",
    ],
  };
}

function buildEvidenceMappings(fields: FormFieldSummary[]): FormEvidenceMapping[] {
  const exactMappings = new Map<string, string[]>();
  fields.forEach((field) => {
    if (!field.evidenceNeed) return;
    exactMappings.set(field.evidenceNeed, [
      ...(exactMappings.get(field.evidenceNeed) ?? []),
      field.name,
    ]);
  });

  const mappings: FormEvidenceMapping[] = Array.from(exactMappings.entries()).map(
    ([evidenceNeed, fieldNames]) => ({
      evidenceNeed,
      fieldNames,
      status: "mapped",
      confidence: 1,
      caveats: [],
    }),
  );
  const mappedNeeds = new Set(mappings.map((mapping) => mapping.evidenceNeed));

  EVIDENCE_RULES.forEach((rule) => {
    if (mappedNeeds.has(rule.evidenceNeed)) return;
    const matchedFields = fields.filter((field) => fieldMatchesRule(field, rule.patterns));
    if (matchedFields.length === 0) return;
    mappings.push({
      evidenceNeed: rule.evidenceNeed,
      fieldNames: matchedFields.map((field) => field.name),
      status: matchedFields.length <= 2 ? "mapped" : "ambiguous",
      confidence: matchedFields.length <= 2 ? rule.confidence : Math.max(0.52, rule.confidence - 0.18),
      caveats:
        matchedFields.length <= 2
          ? []
          : [`Multiple fields may support ${rule.evidenceNeed.toLowerCase()}; review mapping before relying on it.`],
    });
  });

  return mappings;
}

function fieldMatchesRule(field: FormFieldSummary, patterns: RegExp[]) {
  const searchable = [field.name, field.label, field.hxlTag]
    .filter((value): value is string => Boolean(value))
    .join(" ");
  return patterns.some((pattern) => pattern.test(searchable));
}

function fieldFromColumn(column: string, hxlTag?: string): FormFieldSummary {
  return {
    name: column,
    label: displayLabel(column),
    hxlTag,
    source: "column",
    status: "ready",
    caveats: [],
  };
}

function fieldsWithHxlTags(fields: FormFieldSummary[]) {
  return fields
    .filter((field) => field.hxlTag)
    .map((field) => `hxl_tag:${field.name}`);
}

function detectHxlTagRow(rows: Record<string, unknown>[], columns: string[]): HxlDetection | undefined {
  if (rows.length === 0 || columns.length === 0) return undefined;
  const rowSearchLimit = Math.min(rows.length, 3);
  for (let rowIndex = 0; rowIndex < rowSearchLimit; rowIndex += 1) {
    const row = rows[rowIndex];
    const nonEmptyCells = columns
      .map((column) => asTrimmedString(row[column]))
      .filter((value): value is string => Boolean(value));
    if (nonEmptyCells.length === 0) continue;
    const hxlCells = nonEmptyCells.filter(isHxlTag);
    if (hxlCells.length >= 2 && hxlCells.length / nonEmptyCells.length >= 0.5) {
      return {
        tagRowIndex: rowIndex,
        tagsByColumn: new Map(
          columns
            .map((column): [string, string] | undefined => {
              const value = asTrimmedString(row[column]);
              return value && isHxlTag(value) ? [column, value] : undefined;
            })
            .filter((entry): entry is [string, string] => Boolean(entry)),
        ),
      };
    }
  }
  return undefined;
}

function isHxlTag(value: string) {
  return /^#[A-Za-z][A-Za-z0-9_]*(?:\+[A-Za-z][A-Za-z0-9_]*)*$/.test(value);
}

function detectOchaTable(columns: string[]): OchaDetection | undefined {
  const matches = {
    who: matchColumn(columns, [/^who$/, /organi[sz]ation/, /\borg\b/, /agency/, /partner/, /actor/]),
    what: matchColumn(columns, [/^what$/, /activity/, /service/, /sector/, /intervention/, /response/]),
    where: matchColumn(columns, [/^where$/, /district/, /admin/, /location/, /site/, /pcode/, /province/, /region/, /^adm\d?$/]),
    when: matchColumn(columns, [/^when$/, /date/, /month/, /period/, /\bweek\b/, /\btime\b/]),
    whom: matchColumn(columns, [/^forwhom$/, /beneficiar/, /affected/, /population/, /household/, /target/]),
    why: matchColumn(columns, [/^why$/, /\bneed/, /severity/, /gap/, /priority/, /reason/]),
  };
  if (!matches.who || !matches.what || !matches.where) return undefined;
  const presentSignals = Object.entries(matches)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([slot, column]) => `ocha_${slot}:${column}`);
  const isFiveW = Boolean(matches.when && (matches.whom || matches.why));
  return {
    family: isFiveW ? "ocha_5w" : "ocha_3w",
    confidence: isFiveW ? 0.88 : 0.76,
    signals: presentSignals,
  };
}

function fallbackTableDetection(columns: string[]) {
  if (columns.length === 0) {
    return {
      family: "generic_table" as const,
      status: "not_detected" as const,
      confidence: 0,
      signals: [] as string[],
      caveats: ["No columns were available for form intake detection."],
    };
  }
  return {
    family: "generic_table" as const,
    status: "review_needed" as const,
    confidence: Math.min(0.45, 0.18 + columns.length * 0.04),
    signals: ["tabular_headers_present"],
    caveats: [
      "Form family could not be confidently inferred from metadata-safe headers; review before treating this as a known form standard.",
    ],
  };
}

function matchColumn(columns: string[], patterns: RegExp[]) {
  return columns.find((column) => {
    const normalized = normalizeColumn(column);
    return patterns.some((pattern) => pattern.test(normalized) || pattern.test(column));
  });
}

function columnsForRows(rows: Record<string, unknown>[]) {
  const columns: string[] = [];
  const seen = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row).forEach((column) => {
      if (seen.has(column)) return;
      seen.add(column);
      columns.push(column);
    });
  });
  return columns;
}

function copyRow(row: Record<string, unknown>, columns: string[]) {
  return Object.fromEntries(columns.map((column) => [column, row[column]]));
}

function readCell(row: Record<string, unknown>, keys: string[]) {
  const foundKey = keys
    .map(normalizeKey)
    .map((candidate) => Object.keys(row).find((key) => normalizeKey(key) === candidate))
    .find((key): key is string => Boolean(key));
  return foundKey ? safeText(row[foundKey]) : undefined;
}

function readLabel(row: Record<string, unknown>) {
  const directLabel = readCell(row, ["label"]);
  if (directLabel) return directLabel;
  const translatedLabelKey = Object.keys(row).find((key) => normalizeKey(key).startsWith("label"));
  return translatedLabelKey ? safeText(row[translatedLabelKey]) : undefined;
}

function hasKey(row: Record<string, unknown>, key: string) {
  const normalizedKey = normalizeKey(key);
  return Object.keys(row).some((rowKey) => normalizeKey(rowKey) === normalizedKey);
}

function choiceListNameFor(type: string | undefined, choices: Set<string>) {
  if (!type) return undefined;
  const parts = type.split(/\s+/).filter(Boolean);
  if (parts.length < 2 || !/^select_(one|multiple)$/i.test(parts[0])) return undefined;
  return choices.size === 0 || choices.has(parts[1]) ? parts[1] : undefined;
}

function isRequired(value: string | undefined) {
  return /^(yes|true|1|required)$/i.test(value ?? "");
}

function asTrimmedString(value: unknown) {
  const text = safeText(value);
  return text && text.length > 0 ? text : undefined;
}

function safeText(value: unknown, maxLength = 160) {
  if (value === null || value === undefined) return undefined;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function displayLabel(value: string) {
  const label = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  if (!label) return value;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function normalizeColumn(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeKey(value: string) {
  return normalizeColumn(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function clampConfidence(value: number) {
  return Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
}

function datasetName(filename: string) {
  return filename.replace(/\.(csv|xlsx)$/i, "") || "form-dataset";
}

function stableDatasetId(
  filename: string,
  columns: string[],
  rowCount: number,
  family: FormFamily,
) {
  const base = `${filename}|${family}|${rowCount}|${columns.join("|")}`;
  return `form-${slugify(datasetName(filename)) || "dataset"}-${fnv1a(base)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function fnv1a(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
