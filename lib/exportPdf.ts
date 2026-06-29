import type { jsPDF } from "jspdf";
import type { DecisionReadinessResult } from "@/types/decision";
import type { QualityCheckResult } from "@/types/quality";
import type { TransformationStep } from "@/types/transformations";
import { captureElementAsPngDataUrl } from "./exportCapture";
import { watermarkLabelForStatus } from "./readinessGate";

export type DashboardPdfOptions = {
  filename: string;
  title: string;
  metadata: string[];
  decisionReadiness?: DecisionReadinessResult;
  qualityResults: QualityCheckResult[];
  transformationLog: TransformationStep[];
};

type Pdf = InstanceType<typeof jsPDF>;

type PdfBlock =
  | {
      type: "element";
      element: HTMLElement;
      layout?: "full" | "card";
      spacing?: number;
    }
  | { type: "heading"; title: string };

export function formatPdfTimestamp(date = new Date()) {
  return `${date.toISOString().slice(0, 19).replace("T", " ")} UTC`;
}

export async function exportElementAsPdf(
  element: HTMLElement,
  options: DashboardPdfOptions,
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const watermarkLabel = watermarkLabelForStatus(
    options.decisionReadiness?.status,
  );
  let cursor = margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  cursor = writeWrappedLine(
    pdf,
    options.title,
    margin,
    cursor,
    contentWidth,
    pageHeight,
    margin,
    16,
  );
  cursor += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  for (const line of options.metadata) {
    cursor = writeWrappedLine(
      pdf,
      line,
      margin,
      cursor,
      contentWidth,
      pageHeight,
      margin,
    );
  }
  cursor += 12;

  if (options.decisionReadiness) {
    cursor = writeDecisionReadinessSection(
      pdf,
      options.decisionReadiness,
      margin,
      cursor,
      contentWidth,
      pageHeight,
    );
  }

  const blocks = dashboardPdfBlocks(element);
  for (let index = 0; index < blocks.length;) {
    const block = blocks[index];
    if (block.type === "heading") {
      cursor = writeBlockHeading(pdf, block.title, margin, cursor, pageHeight);
      index += 1;
      continue;
    }
    if (block.layout === "card") {
      const row = [block];
      index += 1;
      while (index < blocks.length && row.length < 2) {
        const candidate = blocks[index];
        if (!isCardBlock(candidate)) break;
        row.push(candidate);
        index += 1;
      }
      cursor = await addElementRow(
        pdf,
        row,
        margin,
        cursor,
        contentWidth,
        pageHeight,
        14,
      );
      continue;
    }
    cursor = await addElementBlock(
      pdf,
      block.element,
      margin,
      cursor,
      contentWidth,
      pageHeight,
      block.spacing ?? 14,
    );
    index += 1;
  }

  cursor = addPageIfNeeded(pdf, cursor, 48, pageHeight, margin);
  cursor = writeBlockHeading(
    pdf,
    "Data Quality Summary",
    margin,
    cursor,
    pageHeight,
  );
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const qualityLines = qualityLinesForPdf(options.qualityResults);
  for (const line of qualityLines.slice(0, 12)) {
    cursor = writeWrappedLine(
      pdf,
      line,
      margin,
      cursor,
      contentWidth,
      pageHeight,
      margin,
    );
  }

  cursor += 14;
  cursor = addPageIfNeeded(pdf, cursor, 48, pageHeight, margin);
  cursor = writeBlockHeading(
    pdf,
    "Transformation Summary",
    margin,
    cursor,
    pageHeight,
  );
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const transformationLines = options.transformationLog.length
    ? options.transformationLog
        .slice(-14)
        .map(
          (step) =>
            `${step.stepType.replaceAll("_", " ")}: ${step.description}`,
        )
    : ["No transformation steps were recorded."];
  for (const line of transformationLines) {
    cursor = writeWrappedLine(
      pdf,
      line,
      margin,
      cursor,
      contentWidth,
      pageHeight,
      margin,
    );
  }

  if (watermarkLabel) {
    writeReviewWatermark(pdf, watermarkLabel, pageWidth, pageHeight, margin);
  }

  pdf.save(options.filename);
}

function writeDecisionReadinessSection(
  pdf: Pdf,
  readiness: DecisionReadinessResult,
  margin: number,
  cursor: number,
  contentWidth: number,
  pageHeight: number,
) {
  cursor = addPageIfNeeded(pdf, cursor, 48, pageHeight, margin);
  cursor = writeBlockHeading(
    pdf,
    "Decision Readiness",
    margin,
    cursor,
    pageHeight,
  );
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const readinessLines = [
    `${readiness.title}: ${readiness.summary}`,
    ...readiness.caveats.map((caveat) => `Caveat: ${caveat}`),
  ];
  for (const line of readinessLines.slice(0, 8)) {
    cursor = writeWrappedLine(
      pdf,
      line,
      margin,
      cursor,
      contentWidth,
      pageHeight,
      margin,
    );
  }
  return cursor + 10;
}

export function qualityLinesForPdf(qualityResults: QualityCheckResult[]) {
  const actionableQuality = qualityResults.filter(
    (result) => result.status !== "pass",
  );
  return actionableQuality.length
    ? actionableQuality.map((result) =>
        [
          `${result.status.toUpperCase()}: ${result.description}`,
          result.caveat ? `Caveat: ${result.caveat}` : undefined,
        ]
          .filter(Boolean)
          .join(" "),
      )
    : ["No quality checks require attention."];
}

function dashboardPdfBlocks(element: HTMLElement): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  const metrics = element.querySelector<HTMLElement>(".metric-grid");
  const insights = element.querySelector<HTMLElement>(".dashboard-insights");
  if (metrics) blocks.push({ type: "element", element: metrics, layout: "full" });
  if (insights) blocks.push({ type: "element", element: insights, layout: "full" });

  for (const section of Array.from(
    element.querySelectorAll<HTMLElement>(".dashboard-section"),
  )) {
    const title = section
      .querySelector<HTMLElement>(".dashboard-section-heading h2")
      ?.textContent?.trim();
    if (title) blocks.push({ type: "heading", title });
    const cards = Array.from(
      section.querySelectorAll<HTMLElement>(".dashboard-grid > .chart-card"),
    );
    if (cards.length > 0) {
      blocks.push(
        ...cards.map((card) => ({
          type: "element" as const,
          element: card,
          layout: pdfLayoutForCard(card),
        })),
      );
    } else {
      blocks.push({ type: "element", element: section, layout: "full" });
    }
  }

  return blocks;
}

function pdfLayoutForCard(card: HTMLElement): "full" | "card" {
  if (
    card.classList.contains("featured") ||
    card.classList.contains("chart-card-summary") ||
    card.classList.contains("chart-card-missingness") ||
    card.classList.contains("chart-card-table")
  ) {
    return "full";
  }
  return "card";
}

function isCardBlock(
  block: PdfBlock,
): block is Extract<PdfBlock, { type: "element" }> {
  return block.type === "element" && block.layout === "card";
}

async function addElementRow(
  pdf: Pdf,
  blocks: Extract<PdfBlock, { type: "element" }>[],
  margin: number,
  cursor: number,
  contentWidth: number,
  pageHeight: number,
  spacing: number,
) {
  const gap = 12;
  const imageWidth = (contentWidth - gap) / 2;
  const images = await Promise.all(
    blocks.map(async (block) => {
      const imageData = await captureElementAsPngDataUrl(block.element, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const imageProps = pdf.getImageProperties(imageData);
      return {
        imageData,
        imageHeight: (imageProps.height * imageWidth) / imageProps.width,
      };
    }),
  );
  const rowHeight = Math.max(...images.map((image) => image.imageHeight), 0);

  cursor = addPageIfNeeded(
    pdf,
    cursor,
    rowHeight + spacing,
    pageHeight,
    margin,
  );

  images.forEach((image, index) => {
    pdf.addImage(
      image.imageData,
      "PNG",
      margin + index * (imageWidth + gap),
      cursor,
      imageWidth,
      image.imageHeight,
    );
  });

  return cursor + rowHeight + spacing;
}

async function addElementBlock(
  pdf: Pdf,
  element: HTMLElement,
  margin: number,
  cursor: number,
  contentWidth: number,
  pageHeight: number,
  spacing: number,
) {
  const imageData = await captureElementAsPngDataUrl(element, {
    backgroundColor: "#ffffff",
  });
  const imageProps = pdf.getImageProperties(imageData);
  const imageWidth = contentWidth;
  const imageHeight = (imageProps.height * imageWidth) / imageProps.width;
  const pageContentHeight = pageHeight - margin * 2;

  if (imageHeight <= pageContentHeight) {
    cursor = addPageIfNeeded(
      pdf,
      cursor,
      imageHeight + spacing,
      pageHeight,
      margin,
    );
    pdf.addImage(imageData, "PNG", margin, cursor, imageWidth, imageHeight);
    return cursor + imageHeight + spacing;
  }

  cursor = addPageIfNeeded(pdf, cursor, pageContentHeight, pageHeight, margin);
  let imageOffset = 0;
  let availableHeight = pageHeight - cursor - margin;
  pdf.addImage(
    imageData,
    "PNG",
    margin,
    cursor - imageOffset,
    imageWidth,
    imageHeight,
  );
  imageOffset += availableHeight;

  while (imageOffset < imageHeight) {
    pdf.addPage();
    cursor = margin;
    availableHeight = pageHeight - margin * 2;
    pdf.addImage(
      imageData,
      "PNG",
      margin,
      cursor - imageOffset,
      imageWidth,
      imageHeight,
    );
    imageOffset += availableHeight;
  }

  return margin + spacing;
}

function writeBlockHeading(
  pdf: Pdf,
  title: string,
  margin: number,
  cursor: number,
  pageHeight: number,
) {
  cursor = addPageIfNeeded(pdf, cursor, 28, pageHeight, margin);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(title, margin, cursor);
  return cursor + 20;
}

function writeWrappedLine(
  pdf: Pdf,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  pageHeight: number,
  margin: number,
  lineHeight = 13,
) {
  const lines = pdf.splitTextToSize(text, maxWidth);
  const requiredHeight = lines.length * lineHeight;
  y = addPageIfNeeded(pdf, y, requiredHeight, pageHeight, margin);
  pdf.text(lines, x, y);
  return y + requiredHeight;
}

function addPageIfNeeded(
  pdf: Pdf,
  cursor: number,
  requiredHeight: number,
  pageHeight: number,
  margin: number,
) {
  if (cursor + requiredHeight <= pageHeight - margin) return cursor;
  pdf.addPage();
  return margin;
}

function writeReviewWatermark(
  pdf: Pdf,
  label: string,
  pageWidth: number,
  pageHeight: number,
  margin: number,
) {
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(127, 29, 29);
    pdf.text(
      label,
      Math.max(margin, pageWidth - margin - pdf.getTextWidth(label)),
      pageHeight - 18,
    );
  }
  pdf.setTextColor(0, 0, 0);
}
