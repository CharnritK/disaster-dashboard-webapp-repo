import { captureElementAsPngDataUrl } from "./exportCapture";

export type DashboardPngOptions = {
  watermarkLabel?: string | null;
};

export async function exportElementAsPng(
  element: HTMLElement,
  filename: string,
  options: DashboardPngOptions = {},
) {
  const watermark = options.watermarkLabel
    ? createExportWatermark(options.watermarkLabel)
    : null;
  const previousPosition = element.style.position ?? "";
  let restorePosition = false;

  try {
    if (watermark) {
      restorePosition = !hasPositioningContext(element);
      if (restorePosition) element.style.position = "relative";
      element.appendChild(watermark);
    }

    const dataUrl = await captureElementAsPngDataUrl(element);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  } finally {
    watermark?.remove();
    if (restorePosition) element.style.position = previousPosition;
  }
}

function hasPositioningContext(element: HTMLElement) {
  const inlinePosition = element.style.position;
  if (inlinePosition && inlinePosition !== "static") return true;
  if (typeof window === "undefined" || !window.getComputedStyle) return false;
  return window.getComputedStyle(element).position !== "static";
}

function createExportWatermark(label: string) {
  const watermark = document.createElement("div");
  watermark.className = "dashboard-export-watermark";
  watermark.textContent = label;
  watermark.setAttribute("aria-hidden", "true");
  Object.assign(watermark.style, {
    background: "rgba(127, 29, 29, 0.92)",
    border: "1px solid rgba(255, 255, 255, 0.7)",
    borderRadius: "4px",
    bottom: "16px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.18)",
    color: "#ffffff",
    font: "700 12px/1.2 Arial, sans-serif",
    letterSpacing: "0.08em",
    padding: "8px 10px",
    pointerEvents: "none",
    position: "absolute",
    right: "16px",
    textTransform: "uppercase",
    zIndex: "20",
  });
  return watermark;
}
