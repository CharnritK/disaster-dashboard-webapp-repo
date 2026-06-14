import type { WorkflowStep } from "@/lib/config";
import type { DecisionReadinessResult } from "@/types/decision";

export type CoachHint = {
  title: string;
  body: string;
  tone: "neutral" | "warn";
};

export function deterministicCoachHints(
  step: WorkflowStep,
  readiness?: DecisionReadinessResult,
): CoachHint[] {
  if (readiness?.status === "decision_unsafe") {
    return [
      {
        body: "Resolve blocking readiness issues before sharing recommendations outside the team.",
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
        body: "Check join keys, dates, and location fields before trusting downstream recommendations.",
        title: "Inspect the evidence",
        tone: "neutral",
      },
    ];
  }

  if (step === "recommend" || step === "validate") {
    return [
      {
        body: "Accept only row-preserving cleaning and keep caveats visible for decision-makers.",
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
