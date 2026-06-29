import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toPng = vi.fn();

vi.mock("html-to-image", () => ({
  toPng,
}));

describe("export capture", () => {
  beforeEach(() => {
    toPng.mockReset();
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { ready: Promise.resolve() },
    });
    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 3,
    });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("captures with export mode active and uses full scroll dimensions", async () => {
    const { captureElementAsPngDataUrl } = await import("@/lib/exportCapture");
    const element = document.createElement("div");
    Object.defineProperty(element, "scrollWidth", {
      configurable: true,
      value: 620,
    });
    Object.defineProperty(element, "scrollHeight", {
      configurable: true,
      value: 480,
    });
    element.getBoundingClientRect = () =>
      ({
        bottom: 200,
        height: 200,
        left: 0,
        right: 300,
        top: 0,
        width: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    toPng.mockImplementation(async (captured, options) => {
      expect(captured).toBe(element);
      expect(element.classList.contains("dashboard-exporting")).toBe(true);
      expect(options).toEqual(
        expect.objectContaining({
          height: 480,
          pixelRatio: 2,
          skipAutoScale: true,
          width: 620,
        }),
      );
      expect(options.style).toEqual(
        expect.objectContaining({
          height: "480px",
          maxHeight: "none",
          width: "620px",
        }),
      );
      return "data:image/png;base64,ok";
    });

    await expect(captureElementAsPngDataUrl(element)).resolves.toBe(
      "data:image/png;base64,ok",
    );

    expect(element.classList.contains("dashboard-exporting")).toBe(false);
  });
});
