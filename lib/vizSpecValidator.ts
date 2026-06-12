import type { ChartRecommendation } from "@/types/recommendations";

export type VizSpecIssue = {
  id: string;
  severity: "warning" | "error";
  message: string;
};

export function validateVizSpec(chart: ChartRecommendation): VizSpecIssue[] {
  const issues: VizSpecIssue[] = [];

  if (!chart.title.trim()) {
    issues.push({
      id: "missing-title",
      severity: "error",
      message: "Chart title is required.",
    });
  }

  if (!chart.rationale.trim()) {
    issues.push({
      id: "missing-rationale",
      severity: "error",
      message: "Chart rationale is required.",
    });
  }

  if (chart.chartType === "bar" && chart.sortBy && chart.sortBy !== "value_desc" && chart.sortBy !== "label_asc") {
    issues.push({
      id: "bar-sort",
      severity: "warning",
      message: "Bar charts should sort by value or label, not time.",
    });
  }

  if (chart.chartType === "line" && chart.sortBy && chart.sortBy !== "time_asc") {
    issues.push({
      id: "line-sort",
      severity: "warning",
      message: "Line charts should sort time ascending.",
    });
  }

  if (chart.chartType === "choropleth" && chart.measureType === "count") {
    issues.push({
      id: "raw-count-choropleth",
      severity: "error",
      message: "Raw counts must not be encoded as choropleth area fill.",
    });
  }

  if (!chart.screenReaderSummary) {
    issues.push({
      id: "screen-reader-summary",
      severity: "warning",
      message: "Chart should include a screen reader summary after policy enforcement.",
    });
  }

  if (!chart.mobileBehavior) {
    issues.push({
      id: "mobile-behavior",
      severity: "warning",
      message: "Chart should include mobile behavior after policy enforcement.",
    });
  }

  return issues;
}
