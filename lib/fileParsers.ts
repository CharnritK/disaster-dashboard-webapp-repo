import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB, SUPPORTED_FILE_TYPES } from "@/lib/config";
import type { Dataset } from "@/types/dataset";

export type ParseResult = { dataset?: Dataset; error?: string };

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
      const { readSheet } = await import("read-excel-file/browser");
      const rows = await readSheet(file);
      const headers = buildHeaders(rows[0] ?? []);
      const data = rows.slice(1).map((row) =>
        Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null]))
      );
      const validationError = validateParsedTable(file.name, data);
      if (validationError) return { error: validationError };
      return { dataset: createTabularDataset(file.name, "xlsx", "upload", data) };
    }

    return { error: `${file.name} is not supported. Use CSV or XLSX.` };
  } catch {
    return { error: `We could not parse ${file.name}. Check the file format and try again.` };
  }
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
  data: Record<string, unknown>[]
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
    data,
    sampleRows: data.slice(0, 5)
  };
}

export async function loadSampleDatasets(kind: "single" | "multi"): Promise<Dataset[]> {
  const needsText = await fetch("/samples/needs_assessment.csv").then((response) => response.text());
  const needs = createTabularDataset("needs_assessment.csv", "csv", "sample", parseCsv(needsText));
  if (kind === "single") return [needs];

  const populationText = await fetch("/samples/population.csv").then((response) => response.text());
  return [
    needs,
    createTabularDataset("population.csv", "csv", "sample", parseCsv(populationText))
  ];
}
