import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DecisionReadinessResult } from "@/types/decision";

const captureElementAsPngDataUrl = vi.fn();
const pdfInstances: MockPdf[] = [];
const operationLog: string[] = [];

vi.mock("@/lib/exportCapture", () => ({
  captureElementAsPngDataUrl,
}));

vi.mock("jspdf", () => ({
  jsPDF: MockPdf,
}));

type MockNode = {
  textContent: string;
  className: string;
  style: Record<string, string>;
  attributes: Record<string, string>;
  parentNode: MockElement | null;
  setAttribute(name: string, value: string): void;
  remove(): void;
};

class MockElement implements MockNode {
  textContent = "";
  className = "";
  style: Record<string, string> = {};
  attributes: Record<string, string> = {};
  parentNode: MockElement | null = null;
  children: MockNode[] = [];
  href = "";
  download = "";
  clicked = false;

  appendChild(node: MockNode) {
    node.parentNode = this;
    this.children.push(node);
    return node;
  }

  removeChild(node: MockNode) {
    this.children = this.children.filter((child) => child !== node);
    node.parentNode = null;
    return node;
  }

  remove() {
    this.parentNode?.removeChild(this);
  }

  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
  }

  click() {
    this.clicked = true;
  }

  get classList() {
    return {
      add: (...names: string[]) => {
        const existing = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach((name) => existing.add(name));
        this.className = Array.from(existing).join(" ");
      },
      contains: (name: string) =>
        this.className.split(/\s+/).filter(Boolean).includes(name),
      remove: (...names: string[]) => {
        const namesToRemove = new Set(names);
        this.className = this.className
          .split(/\s+/)
          .filter((name) => name && !namesToRemove.has(name))
          .join(" ");
      },
    };
  }

  querySelector(_selector?: string): MockElement | null {
    return null;
  }

  querySelectorAll(_selector?: string): MockElement[] {
    return [];
  }
}

class MockDashboardElement extends MockElement {
  metricGrid = new MockElement();

  querySelector(selector?: string): MockElement | null {
    if (selector === ".metric-grid") return this.metricGrid;
    return null;
  }
}

class MockDashboardSectionElement extends MockElement {
  heading = new MockElement();
  headingTitle = new MockElement();
  card = new MockElement();

  constructor() {
    super();
    this.headingTitle.textContent = "Detail Review";
    this.card.className = "chart-card chart-card-table";
  }

  querySelector(selector?: string) {
    if (selector === ".metric-grid") return null;
    if (selector === ".dashboard-insights") return null;
    if (selector === ".dashboard-section-heading h2") {
      return this.headingTitle;
    }
    return null;
  }

  querySelectorAll(selector?: string): MockElement[] {
    if (selector === ".dashboard-section") return [this];
    if (selector === ".dashboard-grid > .chart-card") return [this.card];
    return [];
  }
}

type TextCall = {
  page: number;
  text: string | string[];
  x: number;
  y: number;
};

class MockPdf {
  page = 1;
  pageCount = 1;
  textCalls: TextCall[] = [];
  savedFilename: string | null = null;
  internal = {
    pageSize: {
      getWidth: () => 220,
      getHeight: () => 180,
    },
  };

  constructor() {
    pdfInstances.push(this);
  }

  setFont() {
    return this;
  }

  setFontSize() {
    return this;
  }

  setTextColor() {
    return this;
  }

  splitTextToSize(text: string) {
    return [text];
  }

  text(text: string | string[], x: number, y: number) {
    operationLog.push(`text:${Array.isArray(text) ? text.join(" ") : text}`);
    this.textCalls.push({ page: this.page, text, x, y });
    return this;
  }

  addPage() {
    this.pageCount += 1;
    this.page = this.pageCount;
    return this;
  }

  setPage(page: number) {
    this.page = page;
    return this;
  }

  getNumberOfPages() {
    return this.pageCount;
  }

  getTextWidth(text: string) {
    return text.length * 4;
  }

  getImageProperties() {
    return { width: 100, height: 50 };
  }

  addImage() {
    return this;
  }

  save(filename: string) {
    this.savedFilename = filename;
  }
}

const readinessBase: DecisionReadinessResult = {
  status: "ready",
  title: "Ready",
  summary: "Evidence is usable.",
  caveats: [],
  blockerCount: 0,
  reviewCount: 0,
  requiredEvidenceCovered: ["Affected population"],
  requiredEvidenceMissing: [],
};

beforeEach(() => {
  captureElementAsPngDataUrl.mockReset();
  captureElementAsPngDataUrl.mockImplementation(async () => {
    operationLog.push("capture");
    return "data:image/png;base64,ok";
  });
  pdfInstances.length = 0;
  operationLog.length = 0;
  vi.stubGlobal("document", {
    createElement: () => new MockElement(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("export watermarks", () => {
  it("formats PDF timestamps without browser locale drift", async () => {
    const { formatPdfTimestamp } = await import("@/lib/exportPdf");

    expect(formatPdfTimestamp(new Date("2026-06-29T13:54:33.000Z"))).toBe(
      "2026-06-29 13:54:33 UTC",
    );
  });

  it("adds a temporary PNG watermark during capture and removes it after success", async () => {
    const { exportElementAsPng } = await import("@/lib/exportPng");
    const element = new MockElement();

    captureElementAsPngDataUrl.mockImplementation(async (captured: MockElement) => {
      expect(captured.style.position).toBe("relative");
      expect(captured.children.some((child) => child.textContent === "REVIEW ONLY")).toBe(
        true,
      );
      return "data:image/png;base64,ok";
    });

    await exportElementAsPng(element as unknown as HTMLElement, "dashboard.png", {
      watermarkLabel: "REVIEW ONLY",
    });

    expect(captureElementAsPngDataUrl).toHaveBeenCalledWith(element);
    expect(element.style.position).toBe("");
    expect(element.children.some((child) => child.textContent === "REVIEW ONLY")).toBe(
      false,
    );
  });

  it("removes a temporary PNG watermark when capture fails", async () => {
    const { exportElementAsPng } = await import("@/lib/exportPng");
    const element = new MockElement();
    const failure = new Error("capture failed");

    captureElementAsPngDataUrl.mockImplementation(async (captured: MockElement) => {
      expect(
        captured.children.some(
          (child) => child.textContent === "REVIEW ONLY - UNSAFE EVIDENCE",
        ),
      ).toBe(true);
      throw failure;
    });

    await expect(
      exportElementAsPng(element as unknown as HTMLElement, "dashboard.png", {
        watermarkLabel: "REVIEW ONLY - UNSAFE EVIDENCE",
      }),
    ).rejects.toThrow(failure);

    expect(
      element.children.some(
        (child) => child.textContent === "REVIEW ONLY - UNSAFE EVIDENCE",
      ),
    ).toBe(false);
  });

  it.each([
    ["decision_unsafe", "REVIEW ONLY - UNSAFE EVIDENCE"],
    ["review_needed", "REVIEW ONLY"],
  ] as const)(
    "writes the %s PDF readiness watermark on each page",
    async (status, label) => {
      const { exportElementAsPdf } = await import("@/lib/exportPdf");

      await exportElementAsPdf(new MockElement() as unknown as HTMLElement, {
        filename: "dashboard.pdf",
        title: "Dashboard",
        metadata: Array.from({ length: 12 }, (_, index) => `Metadata ${index}`),
        decisionReadiness: {
          ...readinessBase,
          status,
          title: "Needs review",
          summary: "Evidence requires review.",
        },
        qualityResults: [],
        transformationLog: [],
      });

      const pdf = pdfInstances[0]!;
      const watermarkCalls = pdf.textCalls.filter((call) => call.text === label);

      expect(pdf.pageCount).toBeGreaterThan(1);
      expect(watermarkCalls.map((call) => call.page)).toEqual(
        Array.from({ length: pdf.pageCount }, (_, index) => index + 1),
      );
    },
  );

  it("omits the PDF readiness watermark when the dashboard is ready", async () => {
    const { exportElementAsPdf } = await import("@/lib/exportPdf");

    await exportElementAsPdf(new MockElement() as unknown as HTMLElement, {
      filename: "dashboard.pdf",
      title: "Dashboard",
      metadata: ["Metadata"],
      decisionReadiness: readinessBase,
      qualityResults: [],
      transformationLog: [],
    });

    const pdf = pdfInstances[0]!;
    expect(pdf.textCalls.some((call) => call.text === "REVIEW ONLY")).toBe(false);
    expect(
      pdf.textCalls.some((call) => call.text === "REVIEW ONLY - UNSAFE EVIDENCE"),
    ).toBe(false);
  });

  it("writes PDF decision readiness before captured dashboard visuals", async () => {
    const { exportElementAsPdf } = await import("@/lib/exportPdf");

    await exportElementAsPdf(new MockDashboardElement() as unknown as HTMLElement, {
      filename: "dashboard.pdf",
      title: "Dashboard",
      metadata: ["Metadata"],
      decisionReadiness: {
        ...readinessBase,
        status: "decision_unsafe",
        title: "Not safe for action yet",
        summary: "Evidence requires review.",
        caveats: ["Do not assign scarce resources without capacity evidence."],
      },
      qualityResults: [],
      transformationLog: [],
    });

    const readinessIndex = operationLog.indexOf("text:Decision Readiness");
    const captureIndex = operationLog.indexOf("capture");

    expect(readinessIndex).toBeGreaterThanOrEqual(0);
    expect(captureIndex).toBeGreaterThanOrEqual(0);
    expect(readinessIndex).toBeLessThan(captureIndex);
  });

  it("writes PDF decision readiness before captured chart-card sections", async () => {
    const { exportElementAsPdf } = await import("@/lib/exportPdf");

    await exportElementAsPdf(
      new MockDashboardSectionElement() as unknown as HTMLElement,
      {
        filename: "dashboard.pdf",
        title: "Dashboard",
        metadata: ["Metadata"],
        decisionReadiness: {
          ...readinessBase,
          status: "decision_unsafe",
          title: "Not safe for action yet",
          summary: "Evidence requires review.",
          caveats: ["Do not assign scarce resources without capacity evidence."],
        },
        qualityResults: [],
        transformationLog: [],
      },
    );

    const readinessIndex = operationLog.indexOf("text:Decision Readiness");
    const sectionIndex = operationLog.indexOf("text:Detail Review");
    const captureIndex = operationLog.indexOf("capture");

    expect(readinessIndex).toBeGreaterThanOrEqual(0);
    expect(sectionIndex).toBeGreaterThanOrEqual(0);
    expect(captureIndex).toBeGreaterThanOrEqual(0);
    expect(readinessIndex).toBeLessThan(sectionIndex);
    expect(sectionIndex).toBeLessThan(captureIndex);
  });
});
