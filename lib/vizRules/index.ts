import type {
  ChartRecommendation,
  MobileBehavior,
  QualityBadge,
  SortBy,
} from "@/types/recommendations";

export const vizColors = {
  neutral: {
    text: "#171717",
    mutedText: "#5f656d",
    grid: "#deded8",
    panel: "#ffffff",
    context: "#8a9098",
  },
  emphasis: {
    primary: "#005AB5",
  },
  categorical: [
    "#005AB5",
    "#7B3294",
    "#A56315",
    "#235F58",
    "#4B5563",
    "#B42318",
  ],
  sequential: [
    "#F1F7FF",
    "#B9D7FF",
    "#6EA8FE",
    "#2D5BE3",
    "#173B8F",
  ],
  quality: {
    ok: "#235F58",
    warn: "#A56315",
    block: "#B42318",
    unknown: "#4B5563",
  },
  disasterStatus: {
    unknown: "#6B7280",
    unstable: "#B42318",
    stabilizing: "#A56315",
    stable: "#235F58",
    administrative: "#005AB5",
  },
} as const;

export const VIZ_POLICY_DEFAULTS = {
  maxPieCategories: 5,
  maxMapClasses: 7,
  maxMobileCategories: 5,
} as const;

export function defaultSort(
  chartType: ChartRecommendation["chartType"],
): SortBy | undefined {
  if (chartType === "bar" || chartType === "area" || chartType === "table") {
    return "value_desc";
  }
  if (chartType === "line" || chartType === "stacked-area") return "time_asc";
  if (chartType === "pie") return "label_asc";
  return undefined;
}

export function defaultMobileBehavior(
  chartType: ChartRecommendation["chartType"],
  categoryCount: number,
): MobileBehavior {
  if (chartType === "table") return "table-fallback";
  if (chartType === "pie") return "collapse-legend";
  if (categoryCount > VIZ_POLICY_DEFAULTS.maxMobileCategories) return "top5";
  return "auto";
}

export function qualityBadgeLabel(badge: QualityBadge) {
  if (badge === "block") return "Chart blocked";
  if (badge === "warn") return "Chart needs review";
  return "Chart check clear";
}

export function qualityBadgeTone(badge: QualityBadge) {
  if (badge === "block") return "alert";
  if (badge === "warn") return "warn";
  return "success";
}
