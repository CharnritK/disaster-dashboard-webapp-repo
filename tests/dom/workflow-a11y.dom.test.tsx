import { createElement, createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DashboardPreview,
  DecisionBriefStep,
  LoadingStatus,
  RecommendationStep,
  ValidationStep,
} from "@/components/WorkflowComponents";
import { createDecisionBriefFromTemplate } from "@/lib/decisionContext";
import type { Dataset } from "@/types/dataset";
import type {
  AiGuardrailExplanation,
  DecisionReadinessResult,
  EvidenceCoverageSummary,
} from "@/types/decision";
import type {
  AIRecommendationResponse,
  DashboardRecommendation,
  JoinRecommendation,
} from "@/types/recommendations";

const uploadedAt = "2026-06-29T00:00:00.000Z";

const sourceDataset: Dataset = {
  id: "source",
  name: "Needs assessment",
  fileType: "csv",
  sourceType: "sample",
  uploadedAt,
  columns: ["pcode", "district", "need_score"],
  rowCount: 2,
  columnCount: 3,
  data: [
    { pcode: "ADM1", district: "North", need_score: 10 },
    { pcode: "ADM2", district: "South", need_score: 4 },
  ],
};

const targetDataset: Dataset = {
  id: "target",
  name: "Population baseline",
  fileType: "csv",
  sourceType: "sample",
  uploadedAt,
  columns: ["pcode", "population"],
  rowCount: 2,
  columnCount: 2,
  data: [
    { pcode: "ADM1", population: 2000 },
    { pcode: "ADM2", population: 1400 },
  ],
};

const aiGuardrail: AiGuardrailExplanation = {
  advisoryOnly: true,
  aiRecommendationStatus: "fallback",
  deterministicValidation: "accepted",
  deterministicAuthorityStatement: "Deterministic validation remains the authority.",
  unsupportedSuggestions: [],
  validationCaveats: [],
};

const recommendationResponse: AIRecommendationResponse = {
  summary: "Join by P-code before dashboard generation.",
  recommendedPath: {
    title: "Join assessment and population files",
    rationale: "Both files expose a stable administrative code.",
    confidence: 0.82,
    actions: ["Review match summary", "Accept join"],
  },
  assumptions: [],
};

const joinRecommendation: JoinRecommendation = {
  id: "join-1",
  sourceDatasetId: "source",
  targetDatasetId: "target",
  sourceColumns: ["pcode"],
  targetColumns: ["pcode"],
  joinType: "left",
  confidenceScore: 0.9,
  rationale: "P-code fields align.",
  risks: [],
};

const dashboardRecommendation: DashboardRecommendation = {
  summaryMetrics: ["Total records", "need_score"],
  groupByFields: ["district"],
  demographicFields: [],
  metricFields: ["need_score"],
  charts: [
    {
      id: "need-score",
      chartType: "bar",
      title: "Need score by district",
      xField: "district",
      yField: "need_score",
      metricField: "need_score",
      rationale: "Compares need across administrative areas.",
      sourceNote: "Synthetic demo data.",
      screenReaderSummary: "North has a higher need score than South.",
      section: "comparisons",
    },
  ],
  insights: [
    {
      id: "insight-1",
      title: "North is highest",
      description: "North has the highest synthetic need score.",
      severity: "medium",
      insightType: "comparison",
      evidence: ["North need_score is 10"],
      linkedChartId: "need-score",
    },
  ],
};

const unsafeReadiness: DecisionReadinessResult = {
  blockerCount: 2,
  caveats: [
    "Do not assign scarce resources without checking response capacity evidence.",
    "Do not use response-gap charts for action until invalid percentages are corrected.",
  ],
  requiredEvidenceCovered: ["Affected population"],
  requiredEvidenceMissing: ["Response capacity", "Valid response gap"],
  reviewCount: 0,
  status: "decision_unsafe",
  summary: "Evidence gaps remain.",
  title: "Unsafe for operational action",
};

const evidenceCoverage: EvidenceCoverageSummary = {
  ambiguousCount: 0,
  coveredCount: 1,
  items: [
    {
      candidates: [],
      caveat: "Capacity evidence is missing.",
      evidenceNeed: "Response capacity",
      nextAction: "Collect capacity evidence.",
      status: "missing",
    },
  ],
  missingCount: 1,
};

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  window.requestAnimationFrame = (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  };
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderDecisionBriefStep() {
  return render(
    createElement(DecisionBriefStep, {
      aiAssistedAvailable: false,
      aiAssistedEnabled: false,
      brief: createDecisionBriefFromTemplate("response_prioritization"),
      missingFields: [],
      onAiAssistedEnabledChange: vi.fn(),
      onChange: vi.fn(),
      onContinue: vi.fn(),
      sampleOnly: true,
    }),
  );
}

function renderDashboardPreview(options: { exportMode?: boolean } = {}) {
  return render(
    createElement(DashboardPreview, {
      refNode: createRef<HTMLDivElement>(),
      dataset: sourceDataset,
      exportMode: options.exportMode,
      recommendation: dashboardRecommendation,
    }),
  );
}

describe("workflow accessibility behavior", () => {
  it("traps focus inside the decision map dialog and restores focus on close", async () => {
    const user = userEvent.setup();
    renderDecisionBriefStep();

    const trigger = screen.getByRole("button", { name: /view decision map/i });
    await user.click(trigger);

    const closeButton = screen.getByRole("button", {
      name: /close decision map/i,
    });
    expect(document.activeElement).toBe(closeButton);

    await user.keyboard("{Tab}");
    expect(document.activeElement).toBe(closeButton);

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(closeButton);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("uses roving tabindex and arrow keys for dashboard mobile tabs", async () => {
    const user = userEvent.setup();
    renderDashboardPreview();

    const tabs = screen.getAllByRole("tab") as HTMLButtonElement[];
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);

    tabs[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1]);

    await user.keyboard("{End}");
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[2]);

    await user.keyboard("{Home}");
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[0]);

    await user.keyboard("{ArrowLeft}");
    expect(tabs[2].getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(tabs[2]);
  });

  it("renders export dashboards as static all-section artifacts", () => {
    const { container } = renderDashboardPreview({ exportMode: true });

    expect(screen.queryByRole("tablist")).toBeNull();
    expect(container.querySelector(".dashboard-export-layout")).not.toBeNull();
    expect(container.querySelectorAll(".dashboard-mobile-panel")).toHaveLength(3);
    expect(container.querySelectorAll(".dashboard-mobile-panel.active")).toHaveLength(
      3,
    );
  });

  it("announces asynchronous work with a polite status region", () => {
    render(createElement(LoadingStatus));

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain("Working");
  });

  it("has no axe violations on the public demo first step", async () => {
    const { container } = renderDecisionBriefStep();

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("has no axe violations on the dashboard preview", async () => {
    const { container } = renderDashboardPreview();

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("keeps dashboard generation disabled until unsafe-readiness blockers are acknowledged", async () => {
    const user = userEvent.setup();
    const onProceed = vi.fn();
    const onBlockerAcknowledgementChange = vi.fn();
    const readinessBlockers = unsafeReadiness.caveats.map((label, index) => ({
      id: `blocker-${index + 1}`,
      label,
    }));

    const { rerender } = render(
      createElement(ValidationStep, {
        acknowledgedBlockerIds: [],
        aiGuardrail,
        canGenerateDashboard: false,
        dataset: sourceDataset,
        decisionReadiness: unsafeReadiness,
        evidenceCoverage,
        joins: [],
        onBlockerAcknowledgementChange,
        onProceed,
        quality: [],
        readinessBlockers,
        transformationLog: [],
      }),
    );

    const generateButton = screen.getByRole("button", {
      name: /generate dashboard/i,
    }) as HTMLButtonElement;
    expect(
      screen.getByRole("heading", {
        name: /dashboard is review-only: unresolved evidence gaps remain/i,
      }),
    ).toBeTruthy();
    expect(generateButton.disabled).toBe(true);

    await user.click(screen.getByLabelText(readinessBlockers[0]!.label));
    expect(onBlockerAcknowledgementChange).toHaveBeenCalledWith("blocker-1", true);

    rerender(
      createElement(ValidationStep, {
        acknowledgedBlockerIds: ["blocker-1", "blocker-2"],
        aiGuardrail,
        canGenerateDashboard: true,
        dataset: sourceDataset,
        decisionReadiness: unsafeReadiness,
        evidenceCoverage,
        joins: [],
        onBlockerAcknowledgementChange,
        onProceed,
        quality: [],
        readinessBlockers,
        transformationLog: [],
      }),
    );

    expect(
      (screen.getByRole("button", { name: /generate dashboard/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    await user.click(screen.getByRole("button", { name: /generate dashboard/i }));
    expect(onProceed).toHaveBeenCalledTimes(1);
  });
});

describe("join recommendation review behavior", () => {
  it("disables accept when a join plan cannot be summarized for every pair", async () => {
    const onAccept = vi.fn();
    const targetWithoutRows = { ...targetDataset, data: undefined };

    render(
      createElement(RecommendationStep, {
        aiGuardrail,
        cleaningRecommendations: [],
        datasets: [sourceDataset, targetWithoutRows],
        joins: [joinRecommendation],
        recommendations: recommendationResponse,
        onAccept,
      }),
    );

    const accept = screen.getByRole("button", {
      name: /accept recommendation/i,
    }) as HTMLButtonElement;
    expect(accept.disabled).toBe(true);
    expect(
      screen.getByText(/join match summary is unavailable/i),
    ).toBeTruthy();

    await userEvent.click(accept);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("resets adjusted join controls when the dataset pair changes", async () => {
    const user = userEvent.setup();
    const sourceA = {
      ...sourceDataset,
      id: "source-a",
      columns: ["pcode", "old_code"],
      data: [{ pcode: "ADM1", old_code: "OLD1" }],
    };
    const sourceB = {
      ...sourceDataset,
      id: "source-b",
      columns: ["pcode", "new_code"],
      data: [{ pcode: "ADM1", new_code: "NEW1" }],
    };
    const initialJoin = {
      ...joinRecommendation,
      sourceDatasetId: "source-a",
    };
    const nextJoin = {
      ...joinRecommendation,
      sourceDatasetId: "source-b",
    };
    const props = {
      aiGuardrail,
      cleaningRecommendations: [],
      recommendations: recommendationResponse,
      onAccept: vi.fn(),
    };

    const { rerender } = render(
      createElement(RecommendationStep, {
        ...props,
        datasets: [sourceA, targetDataset],
        joins: [initialJoin],
      }),
    );

    await user.click(screen.getByRole("button", { name: /adjust join/i }));
    const sourceSelect = screen.getByLabelText(
      /source field/i,
    ) as HTMLSelectElement;
    await user.selectOptions(sourceSelect, "old_code");
    expect(sourceSelect.value).toBe("old_code");

    rerender(
      createElement(RecommendationStep, {
        ...props,
        datasets: [sourceB, targetDataset],
        joins: [nextJoin],
      }),
    );

    expect(screen.queryByLabelText(/source field/i)).toBeNull();

    await user.click(screen.getByRole("button", { name: /adjust join/i }));
    const resetSourceSelect = screen.getByLabelText(
      /source field/i,
    ) as HTMLSelectElement;
    const optionValues = Array.from(resetSourceSelect.options).map(
      (option) => option.value,
    );
    expect(resetSourceSelect.value).toBe("pcode");
    expect(optionValues).toContain("new_code");
    expect(optionValues).not.toContain("old_code");
  });
});
