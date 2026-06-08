import type { Dataset } from "@/types/dataset";
import type { QualityCheckResult } from "@/types/quality";

export function runQualityChecks(dataset: Dataset): QualityCheckResult[] {
  const rows = dataset.data ?? [];
  const columns = dataset.columns ?? Object.keys(rows[0] ?? {});
  const results: QualityCheckResult[] = [];

  const duplicateCount = rows.length - new Set(rows.map((row) => JSON.stringify(row))).size;
  results.push({
    id: "duplicates",
    checkType: "Duplicate records",
    status: duplicateCount > 0 ? "warning" : "pass",
    severity: duplicateCount > 0 ? "medium" : "info",
    description: duplicateCount > 0 ? `${duplicateCount} duplicate records were found.` : "No duplicate records were found.",
    affectedRowCount: duplicateCount,
    suggestedAction: duplicateCount > 0 ? "Proceed, but keep duplicate count visible in the dashboard quality panel." : "No action needed."
  });

  for (const column of columns) {
    const missing = rows.filter((row) => row[column] === null || row[column] === undefined || String(row[column]).trim() === "").length;
    if (missing > 0) {
      const pct = Math.round((missing / Math.max(rows.length, 1)) * 1000) / 10;
      results.push({
        id: `missing-${column}`,
        checkType: "Missing values",
        status: pct > 25 ? "fail" : "warning",
        severity: pct > 25 ? "high" : "medium",
        description: `${pct}% of records are missing ${column}.`,
        affectedColumns: [column],
        affectedRowCount: missing,
        suggestedAction: pct > 25 ? `Avoid charts that rely on ${column} unless reviewed.` : `Proceed and show a warning for ${column}.`
      });
    }
  }

  const joinFlags = rows.filter((row) => typeof row.__join_matched === "boolean");
  const unmatched = joinFlags.filter((row) => row.__join_matched === false).length;
  if (joinFlags.length > 0) {
    const matchRate = Math.round(((joinFlags.length - unmatched) / Math.max(joinFlags.length, 1)) * 1000) / 10;
    results.push({
      id: "join-completeness",
      checkType: "Join completeness",
      status: matchRate < 80 ? "fail" : unmatched > 0 ? "warning" : "pass",
      severity: matchRate < 80 ? "high" : unmatched > 0 ? "medium" : "info",
      description: `${matchRate}% of records matched during harmonization. ${unmatched} records were unmatched.`,
      affectedRowCount: unmatched,
      suggestedAction: matchRate < 80 ? "Review the join fields before using this dashboard." : "Proceed and keep join completeness visible in the dashboard."
    });
  }

  for (const column of columns) {
    const profileColumn = dataset.profile?.columns.find((candidate) => candidate.columnName === column);
    const inconsistent = profileColumn ? countTypeInconsistencies(rows, column, profileColumn.inferredType) : 0;
    if (inconsistent > 0) {
      results.push({
        id: `type-inconsistency-${column}`,
        checkType: "Field type inconsistencies",
        status: "warning",
        severity: "medium",
        description: `${inconsistent} values in ${column} do not match the inferred ${profileColumn?.inferredType} type.`,
        affectedColumns: [column],
        affectedRowCount: inconsistent,
        suggestedAction: `Review ${column} before relying on it for metrics or grouping.`
      });
    }

    const values = rows.map((row) => row[column]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (values.length >= 5) {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const outliers = values.filter((value) => value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr).length;
      if (outliers > 0) {
        results.push({
          id: `outliers-${column}`,
          checkType: "Numeric outliers",
          status: "warning",
          severity: "low",
          description: `${outliers} possible outliers were detected in ${column}.`,
          affectedColumns: [column],
          affectedRowCount: outliers,
          suggestedAction: "Keep the values and review if they drive a key decision."
        });
      }
    }
  }

  return results.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function severityRank(severity: QualityCheckResult["severity"]) {
  return { info: 0, low: 1, medium: 2, high: 3 }[severity];
}

function countTypeInconsistencies(rows: Record<string, unknown>[], column: string, inferredType: string) {
  if (inferredType === "unknown" || inferredType === "string") return 0;
  return rows.filter((row) => {
    const value = row[column];
    if (value === null || value === undefined || String(value).trim() === "") return false;
    if (inferredType === "number") return typeof value !== "number" || !Number.isFinite(value);
    if (inferredType === "boolean") return typeof value !== "boolean";
    if (inferredType === "date") return Number.isNaN(Date.parse(String(value)));
    return false;
  }).length;
}
