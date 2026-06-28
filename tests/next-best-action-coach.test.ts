import { describe, expect, it } from "vitest";

import { nextBestCoachActions } from "@/lib/coach/nextBestAction";
import type { RepairAction } from "@/types/repairAction";

describe("next best action coach", () => {
  it("prioritizes blockers over generic review issues", () => {
    const actions = nextBestCoachActions({
      step: "validate",
      readinessStatus: "decision_unsafe",
      repairActions: [
        repairAction({
          id: "ambiguous-capacity",
          issueType: "ambiguous_mapping",
          severity: "review",
          title: "Choose capacity field",
        }),
        repairAction({
          id: "missing-geography",
          evidenceNeed: "Admin geography",
          issueType: "missing_evidence",
          severity: "blocker",
          title: "Add geography evidence",
          whyItMatters: "The decision cannot be targeted by area.",
          easiestFix: "Map an existing district field or add a reviewed source.",
        }),
      ],
    });

    expect(actions[0]).toMatchObject({
      mode: "repair",
      sourceRepairActionId: "missing-geography",
      title: "Add geography evidence",
    });
    expect(actions[0].rationale).toMatch(/decision/i);
  });

  it("returns no more than three stable actions", () => {
    const actions = nextBestCoachActions({
      step: "profile",
      repairActions: [
        repairAction({ id: "a", title: "A" }),
        repairAction({ id: "b", title: "B" }),
        repairAction({ id: "c", title: "C" }),
        repairAction({ id: "d", title: "D" }),
      ],
    });

    expect(actions).toHaveLength(3);
    expect(actions.map((action) => action.title)).toEqual(["A", "B", "C"]);
  });

  it("separates app help from human review", () => {
    const actions = nextBestCoachActions({
      step: "validate",
      repairActions: [
        repairAction({
          appCanHelpWith: ["Highlight likely fields."],
          humanMustReview: "Confirm the selected field is correct.",
        }),
      ],
    });

    expect(actions[0].appCanHelpWith).toEqual(["Highlight likely fields."]);
    expect(actions[0].humanMustReview).toBe(
      "Confirm the selected field is correct.",
    );
  });

  it("keeps ranking stable and avoids approval language", () => {
    const mixed = [
      repairAction({
        id: "fallback",
        issueType: "ai_fallback",
        severity: "info",
        title: "Continue without AI",
      }),
      repairAction({
        id: "mapping",
        issueType: "ambiguous_mapping",
        severity: "review",
        title: "Choose affected population field",
      }),
      repairAction({
        id: "missing",
        issueType: "missing_evidence",
        severity: "blocker",
        title: "Add geography evidence",
      }),
    ];

    const ranked = nextBestCoachActions({
      step: "validate",
      readinessStatus: "decision_unsafe",
      repairActions: mixed,
    });
    const reversed = nextBestCoachActions({
      step: "validate",
      readinessStatus: "decision_unsafe",
      repairActions: [...mixed].reverse(),
    });

    expect(ranked).toHaveLength(3);
    expect(ranked.map((action) => action.issueType)).toEqual([
      "missing_evidence",
      "ambiguous_mapping",
      "ai_fallback",
    ]);
    expect(reversed).toEqual(ranked);
    expect(JSON.stringify(ranked)).not.toMatch(
      /approve|approved|authorize|operational approval|safe to act|decision-safe/i,
    );
  });
});

function repairAction(overrides: Partial<RepairAction> = {}): RepairAction {
  return {
    alternatives: ["Keep the caveat in the handoff."],
    appCanHelpWith: ["Show the review caveat."],
    easiestFix: "Choose the safest reviewed field.",
    estimatedEffort: "minutes",
    humanMustReview: "Confirm before preparing the handoff.",
    id: "repair",
    issueType: "ambiguous_mapping",
    safeAutomationLevel: "suggest_only",
    severity: "review",
    title: "Review evidence mapping",
    whyItMatters: "The decision output depends on reviewer-confirmed evidence.",
    ...overrides,
  };
}
