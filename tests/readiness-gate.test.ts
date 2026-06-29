import { describe, expect, it } from "vitest";
import {
  canGenerateDashboard,
  getReadinessBlockers,
  readinessAcknowledgementScopeKey,
  readinessBlockerKey,
  readinessBlockerSignature,
  readinessResultSignature,
  watermarkLabelForStatus,
} from "@/lib/readinessGate";
import { createDefaultDecisionBrief } from "@/lib/decisionContext";
import type { Dataset } from "@/types/dataset";
import type { DecisionReadinessResult } from "@/types/decision";

const unsafeReadiness: DecisionReadinessResult = {
  status: "decision_unsafe",
  title: "Not safe for action yet",
  summary: "Missing required evidence.",
  caveats: ["Missing affected population.", "Join match rate is low."],
  blockerCount: 2,
  reviewCount: 0,
  requiredEvidenceCovered: ["Admin geography"],
  requiredEvidenceMissing: ["Affected population", "Response gap"],
};

const preparedDataset: Dataset = {
  id: "prepared-1",
  name: "prepared",
  fileType: "csv",
  sourceType: "sample",
  uploadedAt: "2026-06-29T00:00:00.000Z",
  rowCount: 2,
  columnCount: 2,
  columns: ["district", "need"],
};

describe("readiness gate", () => {
  it("derives stable blocker ids for unsafe readiness", () => {
    const blockers = getReadinessBlockers(unsafeReadiness);

    expect(blockers).toEqual([
      { id: "blocker-1", label: "Missing affected population." },
      { id: "blocker-2", label: "Join match rate is low." },
    ]);
    expect(readinessBlockerKey(blockers[0]!)).not.toBe(
      readinessBlockerKey({ ...blockers[0]!, label: "Changed caveat." }),
    );
  });

  it("lets stale positional acknowledgements reset when caveat text changes", () => {
    const changedReadiness: DecisionReadinessResult = {
      ...unsafeReadiness,
      caveats: ["Missing shelter capacity.", "Join match rate is low."],
    };
    const acknowledgedBeforeChange = new Set(["blocker-1", "blocker-2"]);
    const nextAcknowledged =
      readinessBlockerSignature(unsafeReadiness) ===
      readinessBlockerSignature(changedReadiness)
        ? acknowledgedBeforeChange
        : new Set<string>();

    expect(getReadinessBlockers(changedReadiness).map((blocker) => blocker.id)).toEqual([
      "blocker-1",
      "blocker-2",
    ]);
    expect(readinessBlockerSignature(changedReadiness)).not.toBe(
      readinessBlockerSignature(unsafeReadiness),
    );
    expect(canGenerateDashboard(changedReadiness, acknowledgedBeforeChange)).toBe(true);
    expect(canGenerateDashboard(changedReadiness, nextAcknowledged)).toBe(false);
  });

  it("blocks dashboard generation until every blocker is acknowledged", () => {
    expect(canGenerateDashboard(unsafeReadiness, new Set())).toBe(false);
    expect(canGenerateDashboard(unsafeReadiness, new Set(["blocker-1"]))).toBe(false);
    expect(
      canGenerateDashboard(unsafeReadiness, new Set(["blocker-1", "blocker-2"])),
    ).toBe(true);
  });

  it("requires acknowledgement for unlabeled blockers when blocker count exceeds caveats", () => {
    const readinessWithUnlabeledBlocker = {
      ...unsafeReadiness,
      caveats: ["Missing affected population."],
      blockerCount: 2,
    };

    expect(getReadinessBlockers(readinessWithUnlabeledBlocker)).toEqual([
      { id: "blocker-1", label: "Missing affected population." },
      { id: "blocker-2", label: "Unlabeled evidence blocker 2" },
    ]);
    expect(
      canGenerateDashboard(
        readinessWithUnlabeledBlocker,
        new Set(["blocker-1"]),
      ),
    ).toBe(false);
    expect(
      canGenerateDashboard(
        readinessWithUnlabeledBlocker,
        new Set(["blocker-1", "blocker-2"]),
      ),
    ).toBe(true);
  });

  it("fails closed when unsafe readiness has no blocker labels", () => {
    expect(
      canGenerateDashboard(
        { ...unsafeReadiness, caveats: [], blockerCount: 1 },
        new Set(),
      ),
    ).toBe(false);
  });

  it("changes acknowledgement scope when readiness metadata changes", () => {
    const changedReadiness = {
      ...unsafeReadiness,
      reviewCount: unsafeReadiness.reviewCount + 1,
    };
    const baseKey = readinessAcknowledgementScopeKey({
      decisionBrief: createDefaultDecisionBrief(),
      preparedDataset,
      decisionReadiness: unsafeReadiness,
    });
    const changedKey = readinessAcknowledgementScopeKey({
      decisionBrief: createDefaultDecisionBrief(),
      preparedDataset,
      decisionReadiness: changedReadiness,
    });

    expect(readinessBlockerSignature(unsafeReadiness)).toBe(
      readinessBlockerSignature(changedReadiness),
    );
    expect(readinessResultSignature(unsafeReadiness)).not.toBe(
      readinessResultSignature(changedReadiness),
    );
    expect(baseKey).not.toBe(changedKey);
  });

  it("does not hard-block ready or review-needed readiness", () => {
    expect(
      canGenerateDashboard(
        { ...unsafeReadiness, status: "ready", caveats: [] },
        new Set(),
      ),
    ).toBe(true);
    expect(
      canGenerateDashboard({ ...unsafeReadiness, status: "review_needed" }, new Set()),
    ).toBe(true);
    expect(canGenerateDashboard(undefined, new Set())).toBe(true);
  });

  it("returns watermark labels by status", () => {
    expect(watermarkLabelForStatus("decision_unsafe")).toBe(
      "REVIEW ONLY - UNSAFE EVIDENCE",
    );
    expect(watermarkLabelForStatus("review_needed")).toBe("REVIEW ONLY");
    expect(watermarkLabelForStatus("ready")).toBeNull();
    expect(watermarkLabelForStatus()).toBeNull();
  });
});
