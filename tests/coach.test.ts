import { describe, expect, it } from "vitest";

import { deterministicCoachHints } from "@/lib/coach";

describe("deterministic coach", () => {
  it("anchors hints to workflow steps without provider calls", () => {
    expect(deterministicCoachHints("brief")[0]).toMatchObject({
      title: "Start with the decision",
      tone: "neutral",
    });
    expect(deterministicCoachHints("export")[0].body).toContain(
      "Deterministic readiness remains authoritative",
    );
  });

  it("surfaces readiness blocks as warnings", () => {
    expect(
      deterministicCoachHints("dashboard", {
        blockerCount: 1,
        caveats: [],
        requiredEvidenceCovered: [],
        requiredEvidenceMissing: ["Capacity"],
        reviewCount: 0,
        status: "decision_unsafe",
        summary: "Blocking evidence is missing.",
        title: "Decision unsafe",
      })[0],
    ).toMatchObject({
      title: "Readiness blocks action",
      tone: "warn",
    });
  });

  it("uses repair actions before generic hints", () => {
    expect(
      deterministicCoachHints(
        "validate",
        {
          blockerCount: 1,
          caveats: [],
          requiredEvidenceCovered: [],
          requiredEvidenceMissing: ["Admin geography"],
          reviewCount: 0,
          status: "decision_unsafe",
          summary: "Blocking evidence is missing.",
          title: "Decision unsafe",
        },
        [
          {
            alternatives: ["Document as unresolved."],
            appCanHelpWith: ["Highlight likely geography fields."],
            easiestFix: "Map an existing district field.",
            estimatedEffort: "minutes",
            evidenceNeed: "Admin geography",
            humanMustReview:
              "Confirm the field identifies the intended decision area.",
            id: "repair-missing-admin-geography",
            issueType: "missing_evidence",
            safeAutomationLevel: "apply_after_review",
            severity: "blocker",
            title: "Add geography evidence",
            whyItMatters: "The decision cannot be targeted by area.",
          },
        ],
      )[0],
    ).toMatchObject({
      body: expect.stringContaining("Human review"),
      title: "Add geography evidence",
      tone: "warn",
    });
  });
});
