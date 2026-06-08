import { captureElementAsPngDataUrl } from "./exportCapture";

export async function exportElementAsPng(element: HTMLElement, filename: string) {
  const dataUrl = await captureElementAsPngDataUrl(element);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
