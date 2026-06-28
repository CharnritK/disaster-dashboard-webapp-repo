import type { WorkflowStep } from "@/lib/config";
import type { DecisionReadinessResult } from "@/types/decision";
import type { RepairAction } from "@/types/repairAction";
import { nextBestCoachActions } from "@/lib/coach/nextBestAction";

export type CoachHint = {
  title: string;
  body: string;
  tone: "neutral" | "warn";
};

export function deterministicCoachHints(
  step: WorkflowStep,
  readiness?: DecisionReadinessResult,
  repairActions: RepairAction[] = [],
): CoachHint[] {
  const nextActions = nextBestCoachActions({
    step,
    readinessStatus: readiness?.status,
    repairActions,
  });
  if (nextActions.length > 0) {
    return nextActions.map((action) => ({
      title: action.title,
      body: `${action.action} Human review: ${action.humanMustReview}`,
      tone: action.severity === "blocker" ? "warn" : "neutral",
    }));
  }

  if (readiness?.status === "decision_unsafe") {
    return [
      {
        body: "Resolve blocking readiness issues before sharing generated guidance outside the team.",
        title: "Readiness blocks action",
        tone: "warn",
      },
    ];
  }

  if (step === "brief") {
    return [
      {
        body: "Narrow the decision question before uploading data. Better inputs beat broader dashboards here.",
        title: "Start with the decision",
        tone: "neutral",
      },
    ];
  }

  if (step === "upload" || step === "profile") {
    return [
      {
        body: "Check join keys, dates, and location fields before trusting downstream review guidance.",
        title: "Inspect the evidence",
        tone: "neutral",
      },
    ];
  }

  if (step === "recommend" || step === "validate") {
    return [
      {
        body: "Use only row-preserving cleaning and keep caveats visible for decision-makers.",
        title: "Keep changes explainable",
        tone: "neutral",
      },
    ];
  }

  return [
    {
      body: "Export the handoff packet with caveats intact. Deterministic readiness remains authoritative.",
      title: "Prepare the handoff",
      tone: "neutral",
    },
  ];
}
