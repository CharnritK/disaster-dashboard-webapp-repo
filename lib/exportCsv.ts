export function toCsv(rows: Record<string, unknown>[]): string {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => {
    const text = neutralizeSpreadsheetFormula(value === null || value === undefined ? "" : String(value));
    return /[",\n\r]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
  };
  return [
    columns.map(escape).join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))
  ].join("\n");
}

export function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function neutralizeSpreadsheetFormula(value: string) {
  return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}
