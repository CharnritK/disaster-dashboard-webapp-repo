import { describe, expect, it } from "vitest";

import { buildRepairActions } from "@/lib/repairActions";
import type { RepairAction } from "@/types/repairAction";

describe("decision repair actions", () => {
  it("turns missing evidence into a practical lowest-effort action", () => {
    const actions = buildRepairActions({
      readiness: {
        blockerCount: 1,
        caveats: ["Admin geography is required for prioritization."],
        requiredEvidenceCovered: [],
        requiredEvidenceMissing: ["Admin geography"],
        reviewCount: 0,
        status: "decision_unsafe",
        summary: "Blocking evidence is missing.",
        title: "Not safe for action yet",
      },
    });

    expect(actions[0]).toMatchObject({
      evidenceNeed: "Admin geography",
      estimatedEffort: "minutes",
      issueType: "missing_evidence",
      safeAutomationLevel: "apply_after_review",
      severity: "blocker",
    });
    expect(actions[0].whyItMatters).toMatch(/location|geography|area/i);
    expect(actions[0].easiestFix).toMatch(/map|add|source/i);
    expect(actions[0].humanMustReview).toMatch(/confirm/i);
  });

  it("turns ambiguous mappings into bounded review actions", () => {
    const actions = buildRepairActions({
      evidenceCoverage: {
        ambiguousCount: 1,
        coveredCount: 0,
        missingCount: 0,
        items: [
          {
            caveat: "Multiple candidate fields.",
            candidates: [
              {
                columnName: "affected_people",
                confidence: 0.64,
                datasetId: "needs",
                datasetName: "Needs",
                inferredType: "number",
                missingPercentage: 0,
                rationale: "Column looks relevant.",
              },
              {
                columnName: "target_households",
                confidence: 0.62,
                datasetId: "needs",
                datasetName: "Needs",
                inferredType: "number",
                missingPercentage: 3,
                rationale: "Column also looks relevant.",
              },
            ],
            evidenceNeed: "Affected population",
            nextAction:
              "Choose the field that best represents affected population.",
            status: "ambiguous",
          },
        ],
      },
    });

    expect(actions[0]).toMatchObject({
      evidenceNeed: "Affected population",
      fieldNames: ["affected_people", "target_households"],
      issueType: "ambiguous_mapping",
      safeAutomationLevel: "suggest_only",
      severity: "review",
    });
    expect(actions[0].easiestFix).toMatch(/choose/i);
    expect(actions[0].appCanHelpWith.length).toBeGreaterThan(0);
  });

  it("turns AI fallback into a non-AI path without provider details", () => {
    const actions = buildRepairActions({
      aiFallbackReason: "quota_exceeded",
    });

    expect(actions[0]).toMatchObject({
      issueType: "ai_fallback",
      severity: "review",
      safeAutomationLevel: "suggest_only",
    });
    expect(actions[0].easiestFix).toMatch(/deterministic/i);
    expect(JSON.stringify(actions[0])).not.toMatch(/api key|prompt|model output/i);
  });

  it("keeps repair action keys session-safe", () => {
    const actions = buildRepairActions({
      aiFallbackReason: "missing_api_key",
      readiness: {
        blockerCount: 1,
        caveats: [],
        requiredEvidenceCovered: [],
        requiredEvidenceMissing: ["Capacity signal"],
        reviewCount: 0,
        status: "decision_unsafe",
        summary: "Missing capacity evidence.",
        title: "Not safe for action yet",
      },
    });

    expect(expectUnsafeKeys(actions)).toEqual([]);
  });

  it("does not mutate repair inputs", () => {
    const input = {
      evidenceCoverage: {
        ambiguousCount: 0,
        coveredCount: 0,
        missingCount: 1,
        items: [
          {
            caveat: "Location evidence is required.",
            candidates: [],
            evidenceNeed: "Admin geography",
            nextAction: "Add a reviewed location field.",
            status: "missing" as const,
          },
        ],
      },
      qualityResults: [
        {
          checkType: "Decision evidence missing",
          description: "Admin geography evidence is missing.",
          evidenceNeed: "Admin geography",
          id: "decision-missing-admin-geography",
          severity: "high" as const,
          status: "fail" as const,
          suggestedAction: "Add a reviewed location field.",
        },
      ],
    };
    const before = structuredClone(input);

    buildRepairActions(input);

    expect(input).toEqual(before);
  });
});

function expectUnsafeKeys(value: unknown, path = "action"): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => expectUnsafeKeys(item, `${path}.${index}`));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const currentPath = `${path}.${key}`;
    const unsafe = /row|sample|prompt|response|file|token|secret/i.test(key)
      ? [currentPath]
      : [];
    return [...unsafe, ...expectUnsafeKeys(child, currentPath)];
  });
}

const _typeCheck: RepairAction["safeAutomationLevel"] = "suggest_only";
