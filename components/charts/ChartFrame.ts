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
  const sourceId = `${id}-source`;
  const describedBy = [descriptionId, sourceId].join(" ");
  const badgeLabel = qualityBadgeLabel(qualityBadge);
  const effectiveScreenReaderSummary =
    screenReaderSummary ??
    `${title}. Review required because an accessible chart summary was not provided.`;
  const effectiveSourceNote =
    sourceNote ??
    "Source and method note missing. Review the chart rationale and underlying dataset before using this view.";

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
      effectiveScreenReaderSummary,
    ),
    createElement("div", { className: "chart-body" }, children),
    createElement(
      "footer",
      {
        className: [
          "chart-source-note",
          sourceNote ? "" : "missing-metadata",
        ]
          .filter(Boolean)
          .join(" "),
        id: sourceId,
      },
      effectiveSourceNote,
    ),
  );
}
