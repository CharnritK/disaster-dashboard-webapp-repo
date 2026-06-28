import type {
  NextBestCoachAction,
  NextBestCoachInput,
  RepairAction,
  RepairActionEffort,
  RepairActionSeverity,
} from "@/types/repairAction";
import type { WorkflowStep } from "@/lib/config";

export function nextBestCoachActions({
  step,
  readinessStatus,
  repairActions = [],
}: NextBestCoachInput): NextBestCoachAction[] {
  if (repairActions.length === 0) {
    return [];
  }

  return [...repairActions]
    .sort((a, b) => compareCoachActions(a, b, step, readinessStatus))
    .slice(0, 3)
    .map((action) => ({
      id: `next-${action.id}`,
      issueType: action.issueType,
      title: action.title,
      rationale: action.whyItMatters,
      action: action.easiestFix,
      mode: modeForStep(step),
      severity: action.severity,
      estimatedEffort: action.estimatedEffort,
      appCanHelpWith: action.appCanHelpWith,
      humanMustReview: action.humanMustReview,
      sourceRepairActionId: action.id,
    }));
}

function compareCoachActions(
  a: RepairAction,
  b: RepairAction,
  step: WorkflowStep,
  readinessStatus: NextBestCoachInput["readinessStatus"],
) {
  return (
    severityRank(b.severity, readinessStatus) - severityRank(a.severity, readinessStatus) ||
    stepRelevanceRank(b, step) - stepRelevanceRank(a, step) ||
    effortRank(a.estimatedEffort) - effortRank(b.estimatedEffort) ||
    issueRank(a) - issueRank(b) ||
    a.title.localeCompare(b.title)
  );
}

function modeForStep(step: WorkflowStep): NextBestCoachAction["mode"] {
  if (step === "validate") return "repair";
  if (step === "dashboard") return "proceed";
  if (step === "export") return "handoff";
  if (step === "profile" || step === "recommend") return "triage";
  return "explain";
}

function severityRank(
  severity: RepairActionSeverity,
  readinessStatus: NextBestCoachInput["readinessStatus"],
) {
  const base = { info: 0, review: 1, blocker: 2 }[severity];
  return readinessStatus === "decision_unsafe" && severity === "blocker"
    ? base + 1
    : base;
}

function stepRelevanceRank(action: RepairAction, step: WorkflowStep) {
  if (step === "validate" && action.severity === "blocker") return 3;
  if (step === "profile" && action.issueType === "ambiguous_mapping") return 2;
  if (step === "profile" && action.issueType === "weak_form_detection") return 2;
  if (step === "profile" && action.issueType === "fuzzy_match_conflict") return 2;
  if (step === "recommend" && action.issueType === "connector_sync_issue") return 2;
  if (step === "recommend" && action.issueType === "geocoding_uncertainty") return 2;
  if (step === "recommend" && action.issueType === "ocr_pdf_confidence_issue") return 2;
  if (step === "recommend" && action.issueType === "ai_fallback") return 2;
  if (step === "export" && action.issueType === "ai_fallback") return 1;
  return 0;
}

function effortRank(effort: RepairActionEffort) {
  return { seconds: 0, minutes: 1, needs_owner: 2 }[effort];
}

function issueRank(action: RepairAction) {
  return {
    missing_evidence: 0,
    quality_issue: 1,
    ambiguous_mapping: 2,
    weak_form_detection: 3,
    connector_sync_issue: 4,
    ocr_pdf_confidence_issue: 5,
    geocoding_uncertainty: 6,
    fuzzy_match_conflict: 7,
    ai_fallback: 8,
  }[action.issueType];
}
