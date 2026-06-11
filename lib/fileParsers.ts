import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB, SUPPORTED_FILE_TYPES } from "@/lib/config";
import type {
  Dataset,
  DatasetFormatAssessment,
  DatasetFormatIssue,
  DatasetInputHints,
} from "@/types/dataset";

export type ParseResult = { dataset?: Dataset; error?: string };
export type SampleDatasetKind = "single" | "multi" | "fragmented" | "quality-risk";
type ExcelRow = unknown[];
type ExcelSheet = { sheet: string; data: ExcelRow[] };

function extensionFor(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function parseCsv(text: string): Record<string, unknown>[] {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "\"" && inQuotes && next === "\"") {
      cell += "\"";
      i += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  const headers = buildHeaders(rows[0] ?? []);
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, coerceValue(values[index] ?? "")]))
  );
}

export function coerceValue(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (/^(true|false)$/i.test(trimmed)) return /^true$/i.test(trimmed);
  return trimmed;
}

export async function parseFile(file: File): Promise<ParseResult> {
  const ext = extensionFor(file.name);
  if (!SUPPORTED_FILE_TYPES.includes(ext as never)) {
    return { error: `${file.name} is not supported. Use CSV or XLSX.` };
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { error: `${file.name} is larger than the ${MAX_UPLOAD_SIZE_MB}MB upload limit.` };
  }

  try {
    if (ext === "csv") {
      const data = parseCsv(await file.text());
      const validationError = validateParsedTable(file.name, data);
      if (validationError) return { error: validationError };
      return { dataset: createTabularDataset(file.name, "csv", "upload", data) };
    }

    if (ext === "xlsx") {
      const { default: readWorkbook } = await import("read-excel-file/browser");
      const sheets = await readWorkbook(file) as ExcelSheet[];
      const selectedSheet = sheets[0];
      const rows = selectedSheet?.data ?? [];
      const formatAssessment = assessExcelTableRows(file.name, rows, {
        sheetName: selectedSheet?.sheet,
        sheetCount: sheets.length,
      });
      if (formatAssessment.status === "rejected") {
        return { error: formatRejectedAssessment(file.name, formatAssessment) };
      }
      const headers = buildHeaders(rows[0] ?? []);
      const data = rows.slice(1).map((row) =>
        Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null]))
      );
      const validationError = validateParsedTable(file.name, data);
      if (validationError) return { error: validationError };
      return {
        dataset: createTabularDataset(file.name, "xlsx", "upload", data, {
          formatAssessment,
        }),
      };
    }

    return { error: `${file.name} is not supported. Use CSV or XLSX.` };
  } catch {
    return { error: `We could not parse ${file.name}. Check the file format and try again.` };
  }
}

export function assessExcelTableRows(
  filename: string,
  rows: ExcelRow[],
  context: { sheetName?: string; sheetCount?: number } = {},
): DatasetFormatAssessment {
  const issues: DatasetFormatIssue[] = [];
  const learningTips = new Set<string>();
  const addIssue = (issue: DatasetFormatIssue, tip?: string) => {
    issues.push(issue);
    if (tip) learningTips.add(tip);
  };

  if ((context.sheetCount ?? 0) > 1) {
    addIssue(
      {
        severity: "warning",
        title: "Workbook has multiple sheets",
        detail: `Only the first sheet${context.sheetName ? ` (${context.sheetName})` : ""} will be parsed for this upload.`,
        suggestedAction: "Upload one clean table per file or export the sheet you want as its own CSV/XLSX file.",
      },
      "Use one worksheet per upload when the sheets mean different things.",
    );
  }

  if (rows.length === 0) {
    addIssue(
      {
        severity: "error",
        title: "No readable rows",
        detail: "The workbook did not contain a readable table on the selected sheet.",
        suggestedAction: "Move the data into a normal worksheet with headers in row 1 and records below.",
      },
      "Put one header row at the top, then one record per row below it.",
    );
    return buildFormatAssessment("xlsx", context, issues, learningTips);
  }

  const headerRow = rows[0] ?? [];
  const headerWidth = rowWidth(headerRow);
  const headerCellCount = nonEmptyCellCount(headerRow);
  const nextRowCellCount = nonEmptyCellCount(rows[1] ?? []);

  if (headerCellCount === 0) {
    addIssue(
      {
        severity: "error",
        title: "Header row is empty",
        detail: "Row 1 is blank, so the app cannot identify column names.",
        suggestedAction: "Delete blank rows above the table and put field names in row 1.",
      },
      "Avoid title blocks, logos, blank rows, or instructions above the data table.",
    );
  } else if (headerCellCount === 1 && nextRowCellCount >= 2) {
    addIssue(
      {
        severity: "error",
        title: "Row 1 looks like a title, not headers",
        detail: "The first row has one filled cell, while the next row looks more like column headers.",
        suggestedAction: "Remove title or instruction rows so row 1 contains the actual column headers.",
      },
      "Do not use merged-title rows above Excel tables; use plain column headers in the first row.",
    );
  } else if (headerCellCount < 2) {
    addIssue(
      {
        severity: "error",
        title: "Too few columns",
        detail: "The selected sheet has fewer than two usable column headers.",
        suggestedAction: "Use a rectangular table with separate columns for geography, date, measures, source, and notes.",
      },
      "A dashboard-ready table usually needs at least a location/key column and one measure or status column.",
    );
  }

  const dataRows = rows.slice(1);
  const populatedDataRows = dataRows.filter((row) => nonEmptyCellCount(row) > 0);
  if (populatedDataRows.length === 0) {
    addIssue(
      {
        severity: "error",
        title: "No data rows",
        detail: "The sheet has headers but no filled records underneath.",
        suggestedAction: "Add one row per area, site, household group, or observation.",
      },
      "Headers alone are not enough; each row should describe one observation.",
    );
  }

  const headerLabels = headerRow.slice(0, headerWidth).map((value) => String(value ?? "").trim());
  const blankHeaderCount = headerLabels.filter((value) => value === "").length;
  if (blankHeaderCount > 0) {
    addIssue(
      {
        severity: "warning",
        title: "Blank column headers",
        detail: `${blankHeaderCount} column${blankHeaderCount === 1 ? "" : "s"} will be renamed to generic column names.`,
        suggestedAction: "Name every column with a short, stable label such as admin_code, severity_score, or affected_population.",
      },
      "Agents understand field meaning better from explicit, stable column names.",
    );
  }

  const duplicateHeaders = duplicatedLabels(headerLabels);
  if (duplicateHeaders.length > 0) {
    addIssue(
      {
        severity: "warning",
        title: "Duplicate column headers",
        detail: `Repeated header${duplicateHeaders.length === 1 ? "" : "s"} detected: ${duplicateHeaders.slice(0, 4).join(", ")}.`,
        suggestedAction: "Rename duplicate fields before upload so each column has a unique meaning.",
      },
      "Avoid repeated headers; the app can rename them, but reviewers may misunderstand the fields.",
    );
  }

  const nonTextHeaderCount = headerRow.filter((value) => !isBlankCell(value) && typeof value !== "string").length;
  if (nonTextHeaderCount > 0) {
    addIssue(
      {
        severity: "warning",
        title: "Headers are not plain text",
        detail: `${nonTextHeaderCount} header cell${nonTextHeaderCount === 1 ? "" : "s"} look like numbers, dates, or booleans.`,
        suggestedAction: "Use text labels for headers and put dates or measurements in the rows underneath.",
      },
      "Column headers should be names, not data values.",
    );
  }

  const interiorBlankRows = dataRows
    .slice(0, -1)
    .filter((row) => nonEmptyCellCount(row) === 0)
    .length;
  if (interiorBlankRows > 0) {
    addIssue(
      {
        severity: "warning",
        title: "Blank rows split the table",
        detail: `${interiorBlankRows} blank row${interiorBlankRows === 1 ? "" : "s"} appear inside the data area.`,
        suggestedAction: "Remove blank separator rows so the sheet is one continuous table.",
      },
      "Do not use blank rows to visually separate groups inside machine-readable data.",
    );
  }

  const sectionRowCount = populatedDataRows.filter((row) => nonEmptyCellCount(row) === 1).length;
  if (populatedDataRows.length >= 4 && sectionRowCount / populatedDataRows.length >= 0.2) {
    addIssue(
      {
        severity: "warning",
        title: "Section or subtotal rows detected",
        detail: `${sectionRowCount} populated row${sectionRowCount === 1 ? "" : "s"} have only one filled cell, which often means group labels or subtotals are mixed into the table.`,
        suggestedAction: "Move group labels into their own column and remove subtotal rows before upload.",
      },
      "Every row should have the same meaning; avoid section headings inside the data body.",
    );
  }

  const rowsWithExtraCells = populatedDataRows.filter((row) => rowWidth(row) > headerWidth).length;
  if (headerWidth > 0 && rowsWithExtraCells > 0) {
    addIssue(
      {
        severity: "warning",
        title: "Data extends beyond headers",
        detail: `${rowsWithExtraCells} row${rowsWithExtraCells === 1 ? "" : "s"} include filled cells past the named header range.`,
        suggestedAction: "Add missing headers or remove stray cells to keep the table rectangular.",
      },
      "A usable table is rectangular: every populated column has a header.",
    );
  }

  const populatedCellSlots = Math.max(1, populatedDataRows.length * Math.max(1, headerWidth));
  const blankDataCells = populatedDataRows.reduce(
    (sum, row) => sum + Array.from({ length: headerWidth }).filter((_, index) => isBlankCell(row[index])).length,
    0,
  );
  if (populatedDataRows.length > 0 && blankDataCells / populatedCellSlots >= 0.4) {
    addIssue(
      {
        severity: "warning",
        title: "Many blank cells",
        detail: `${Math.round((blankDataCells / populatedCellSlots) * 100)}% of cells in the named table area are blank.`,
        suggestedAction: "Check whether columns are optional, values are missing, or multiple tables were pasted into one sheet.",
      },
      "Blank values are allowed, but heavy missingness should be explained in the semantic note.",
    );
  }

  const widePeriodHeaders = headerLabels.filter(looksLikePeriodHeader).length;
  if (headerWidth >= 8 && widePeriodHeaders >= 3) {
    addIssue(
      {
        severity: "warning",
        title: "Wide period columns detected",
        detail: "Several headers look like months, years, or dates. This may be a pivoted table.",
        suggestedAction: "For time-series dashboards, prefer columns like admin_code, observation_date, metric_name, and value.",
      },
      "Agents read long-format tables more reliably than pivoted month-by-month Excel layouts.",
    );
  }

  const formulaLikeValues = populatedDataRows
    .flatMap((row) => row.slice(0, headerWidth))
    .filter(isFormulaLikeString).length;
  if (formulaLikeValues > 0) {
    addIssue(
      {
        severity: "warning",
        title: "Formula-like values detected",
        detail: `${formulaLikeValues} value${formulaLikeValues === 1 ? "" : "s"} begin with spreadsheet formula characters.`,
        suggestedAction: "Paste values instead of formulas before upload when possible.",
      },
      "Upload values, not formulas, when a reviewer or agent needs to interpret the dataset.",
    );
  }

  if (issues.length === 0) {
    learningTips.add("This looks machine-readable: one header row, one record per row, and stable columns.");
  }

  return buildFormatAssessment("xlsx", context, issues, learningTips);
}

function buildHeaders(values: unknown[]) {
  const counts = new Map<string, number>();
  return values.map((value, index) => {
    const base = String(value ?? "").trim() || `column_${index + 1}`;
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

function validateParsedTable(filename: string, data: Record<string, unknown>[]) {
  if (data.length === 0) {
    return `${filename} does not include any data rows.`;
  }
  const columns = Object.keys(data[0] ?? {});
  if (columns.length === 0) {
    return `${filename} does not include any column headers.`;
  }
  return undefined;
}

export function createTabularDataset(
  filename: string,
  fileType: "csv" | "xlsx",
  sourceType: "upload" | "sample",
  data: Record<string, unknown>[],
  options: {
    inputHints?: DatasetInputHints;
    formatAssessment?: DatasetFormatAssessment;
  } = {},
): Dataset {
  const columns = Object.keys(data[0] ?? {});
  return {
    id: crypto.randomUUID(),
    name: filename.replace(/\.(csv|xlsx)$/i, ""),
    originalFilename: filename,
    fileType,
    sourceType,
    uploadedAt: new Date().toISOString(),
    rowCount: data.length,
    columnCount: columns.length,
    columns,
    inputHints: options.inputHints,
    formatAssessment: options.formatAssessment,
    data,
    sampleRows: data.slice(0, 5)
  };
}

export async function loadSampleDatasets(kind: SampleDatasetKind): Promise<Dataset[]> {
  const filenames: Record<SampleDatasetKind, string[]> = {
    single: ["needs_assessment.csv"],
    multi: ["needs_assessment.csv", "population.csv"],
    fragmented: [
      "demo_needs_assessment.csv",
      "demo_population_baseline.csv",
      "demo_service_capacity.csv",
    ],
    "quality-risk": ["demo_quality_risk.csv"],
  };

  return Promise.all(
    filenames[kind].map(async (filename) => {
      const text = await fetch(`/samples/${filename}`).then((response) => response.text());
      return createTabularDataset(filename, "csv", "sample", parseCsv(text));
    }),
  );
}

function buildFormatAssessment(
  fileType: "csv" | "xlsx",
  context: { sheetName?: string; sheetCount?: number },
  issues: DatasetFormatIssue[],
  learningTips: Set<string>,
): DatasetFormatAssessment {
  const hasErrors = issues.some((issue) => issue.severity === "error");
  const hasWarnings = issues.some((issue) => issue.severity === "warning");
  const status = hasErrors ? "rejected" : hasWarnings ? "review" : "accepted";
  return {
    status,
    summary:
      status === "accepted"
        ? "The table shape looks acceptable for profiling."
        : status === "review"
          ? "The file was parsed, but reviewers should fix or explain the format caveats."
          : "The file is not upload-ready because the table shape is ambiguous.",
    fileType,
    sheetName: context.sheetName,
    sheetCount: context.sheetCount,
    issues,
    learningTips: Array.from(learningTips),
  };
}

function formatRejectedAssessment(filename: string, assessment: DatasetFormatAssessment) {
  const reasons = assessment.issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => `${issue.title}: ${issue.detail}`)
    .join(" ");
  const tip = assessment.learningTips[0] ? ` ${assessment.learningTips[0]}` : "";
  return `${filename} is not upload-ready. ${reasons}${tip}`;
}

function nonEmptyCellCount(row: ExcelRow) {
  return row.filter((value) => !isBlankCell(value)).length;
}

function rowWidth(row: ExcelRow) {
  for (let index = row.length - 1; index >= 0; index -= 1) {
    if (!isBlankCell(row[index])) return index + 1;
  }
  return 0;
}

function isBlankCell(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

function duplicatedLabels(labels: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const label of labels) {
    const normalized = label.trim().toLowerCase();
    if (!normalized) continue;
    if (seen.has(normalized)) duplicates.add(label.trim());
    seen.add(normalized);
  }
  return Array.from(duplicates);
}

function looksLikePeriodHeader(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return (
    /^(19|20)\d{2}$/.test(normalized) ||
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*([-\s_]\d{2,4})?$/.test(normalized) ||
    /^\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?$/.test(normalized) ||
    /^\d{4}[/-]\d{1,2}([/-]\d{1,2})?$/.test(normalized)
  );
}

function isFormulaLikeString(value: unknown) {
  return typeof value === "string" && /^[=+\-@]/.test(value.trim());
}
