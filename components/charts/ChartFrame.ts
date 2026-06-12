import { createElement, type ReactNode } from "react";
import type { QualityBadge } from "@/types/recommendations";
import { qualityBadgeLabel, qualityBadgeTone } from "@/lib/vizRules";

export type ChartFrameProps = {
  id: string;
  title: string;
  subtitle?: string;
  sourceNote?: string;
  screenReaderSummary?: string;
  qualityBadge?: QualityBadge;
  className?: string;
  children: ReactNode;
};

export function ChartFrame({
  id,
  title,
  subtitle,
  sourceNote,
  screenReaderSummary,
  qualityBadge = "ok",
  className,
  children,
}: ChartFrameProps) {
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const sourceId = sourceNote ? `${id}-source` : undefined;
  const describedBy = [descriptionId, sourceId].filter(Boolean).join(" ");
  const badgeLabel = qualityBadgeLabel(qualityBadge);

  return createElement(
    "article",
    {
      "aria-describedby": describedBy,
      "aria-labelledby": titleId,
      className: [
        "card",
        "chart-card",
        `quality-${qualityBadge}`,
        className,
      ]
        .filter(Boolean)
        .join(" "),
      "data-quality": qualityBadge,
      id,
    },
    createElement(
      "header",
      { className: "chart-card-header" },
      createElement(
        "div",
        { className: "chart-title-group" },
        createElement("h3", { id: titleId }, title),
        subtitle
          ? createElement("p", { className: "chart-subtitle" }, subtitle)
          : null,
      ),
      createElement(
        "span",
        {
          "aria-label": `Data quality: ${badgeLabel}`,
          className: `quality-pill ${qualityBadgeTone(qualityBadge)}`,
        },
        badgeLabel,
      ),
    ),
    createElement(
      "p",
      { className: "sr-only", id: descriptionId },
      screenReaderSummary ?? subtitle ?? title,
    ),
    createElement("div", { className: "chart-body" }, children),
    sourceNote
      ? createElement(
          "footer",
          { className: "chart-source-note", id: sourceId },
          sourceNote,
        )
      : null,
  );
}
