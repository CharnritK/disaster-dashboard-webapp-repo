import { toPng } from "html-to-image";

const EXPORT_BACKGROUND = "#fbfbf8";
const EXPORT_TEXT = "#171717";
const MAX_PIXEL_RATIO = 2;

export async function captureElementAsPngDataUrl(
  element: HTMLElement,
  options: { backgroundColor?: string; pixelRatio?: number } = {},
) {
  await waitForExportReady();
  element.classList.add("dashboard-exporting");
  try {
    await nextFrame();
    const rect = element.getBoundingClientRect();
    const width = Math.ceil(Math.max(element.scrollWidth, rect.width, 1));
    const height = Math.ceil(Math.max(element.scrollHeight, rect.height, 1));
    const pixelRatio =
      options.pixelRatio ??
      Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1);

    return await toPng(element, {
      backgroundColor: options.backgroundColor ?? EXPORT_BACKGROUND,
      cacheBust: true,
      height,
      pixelRatio,
      preferredFontFormat: "woff2",
      skipAutoScale: true,
      style: {
        background: options.backgroundColor ?? EXPORT_BACKGROUND,
        color: EXPORT_TEXT,
        height: `${height}px`,
        maxHeight: "none",
        opacity: "1",
        transform: "none",
        width: `${width}px`,
      },
      width,
      filter: (domNode) =>
        !(
          domNode instanceof HTMLElement &&
          domNode.classList.contains("chart-tooltip")
        ),
    });
  } finally {
    element.classList.remove("dashboard-exporting");
  }
}

async function waitForExportReady() {
  if ("fonts" in document) {
    await document.fonts.ready;
  }
  await nextFrame();
  await nextFrame();
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
