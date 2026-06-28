import type { WorkflowStep } from "@/lib/config";
import type {
  DecisionReadinessResult,
  EvidenceCoverageItem,
  EvidenceCoverageSummary,
} from "@/types/decision";
import type { QualityCheckResult } from "@/types/quality";
import type { AIRecommendationResponse } from "@/types/recommendations";
import type {
  RepairAction,
  RepairActionEffort,
  RepairActionIssueType,
  RepairActionSeverity,
  SafeAutomationLevel,
} from "@/types/repairAction";

export type BuildRepairActionsInput = {
  workflowStep?: WorkflowStep;
  readiness?: DecisionReadinessResult;
  evidenceCoverage?: EvidenceCoverageSummary;
  qualityResults?: QualityCheckResult[];
  aiFallbackReason?: AIRecommendationResponse["fallbackReason"];
};

type RepairActionDraft = Omit<RepairAction, "id"> & {
  id?: string;
};

const AI_FALLBACK_LABELS: Record<
  NonNullable<AIRecommendationResponse["fallbackReason"]>,
  string
> = {
  ai_disabled: "AI is disabled",
  unauthenticated: "Sign in for AI assistance",
  not_entitled: "AI access is not enabled",
  quota_exceeded: "Daily AI quota is exhausted",
  missing_api_key: "AI provider key is missing",
  unsupported_provider: "AI provider is unsupported",
  app_rate_limit: "App rate limit reached",
  invalid_request: "AI request was not accepted",
  request_too_large: "AI request is too large",
  provider_rate_limit: "Provider rate limit reached",
  provider_unavailable: "Provider is unavailable",
  request_timeout: "AI request timed out",
  network_error: "AI network request failed",
  model_response_truncated: "AI response was truncated",
  model_response_invalid: "AI response was invalid",
};

export function buildRepairActions({
  readiness,
  evidenceCoverage,
  qualityResults = [],
  aiFallbackReason,
}: BuildRepairActionsInput): RepairAction[] {
  const actions: RepairAction[] = [];

  for (const item of evidenceCoverage?.items ?? []) {
    if (item.status === "missing") {
      actions.push(withId(missingEvidenceAction(item.evidenceNeed, item.nextAction)));
    }
    if (item.status === "ambiguous") {
      actions.push(withId(ambiguousMappingAction(item)));
    }
  }

  for (const evidenceNeed of readiness?.requiredEvidenceMissing ?? []) {
    actions.push(withId(missingEvidenceAction(evidenceNeed)));
  }

  for (const issue of qualityResults) {
    const action = qualityRepairAction(issue);
    if (action) actions.push(withId(action));
  }

  if (aiFallbackReason) {
    actions.push(withId(aiFallbackAction(aiFallbackReason)));
  }

  return dedupeActions(actions).sort(compareRepairActions);
}

function missingEvidenceAction(
  evidenceNeed: string,
  nextAction?: string,
): RepairActionDraft {
  const normalized = evidenceNeed.toLowerCase();
  const geography = /geo|admin|location|area|where/i.test(evidenceNeed);
  return {
    issueType: "missing_evidence",
    severity: "blocker",
    title: `Add ${evidenceNeed} evidence`,
    whyItMatters: geography
      ? "The decision cannot be targeted by location until geography evidence is reviewed."
      : `The decision is not review-ready without ${normalized} evidence.`,
    easiestFix:
      nextAction ??
      `Map an existing field to ${normalized}, or add a reviewed source that contains it.`,
    alternatives: [
      `Collect ${normalized} from the responsible source owner.`,
      "Keep the caveat in the handoff if the evidence cannot be supplied yet.",
    ],
    appCanHelpWith: [
      "Highlight likely fields from the current dataset metadata.",
      "Keep this blocker visible in the readiness handoff.",
    ],
    humanMustReview: `Confirm the selected field genuinely represents ${normalized} for this decision.`,
    estimatedEffort: "minutes",
    safeAutomationLevel: "apply_after_review",
    evidenceNeed,
  };
}

function ambiguousMappingAction(item: EvidenceCoverageItem): RepairActionDraft {
  const fieldNames = item.candidates.map((candidate) => candidate.columnName).slice(0, 4);
  const fieldList = fieldNames.length > 0 ? fieldNames.join(", ") : "the candidate fields";
  return {
    issueType: "ambiguous_mapping",
    severity: "review",
    title: `Choose ${item.evidenceNeed} field`,
    whyItMatters:
      "The dashboard can point to the wrong signal if a reviewer does not choose the intended evidence field.",
    easiestFix: `Choose which field best represents ${item.evidenceNeed.toLowerCase()} from ${fieldList}.`,
    alternatives: [
      "Leave the evidence marked for review and keep the caveat in the handoff.",
      "Ask the source owner which field is authoritative.",
    ],
    appCanHelpWith: [
      "Compare candidate field names and confidence scores.",
      "Preserve the review caveat until a field is confirmed.",
    ],
    humanMustReview: "Confirm the chosen field matches the intended decision evidence.",
    estimatedEffort: "minutes",
    safeAutomationLevel: "suggest_only",
    evidenceNeed: item.evidenceNeed,
    fieldNames,
  };
}

function qualityRepairAction(issue: QualityCheckResult): RepairActionDraft | null {
  if (issue.status === "pass") return null;
  if (/ambiguous|mapping|review/i.test(issue.id) && issue.evidenceNeed) {
    return {
      issueType: "ambiguous_mapping",
      severity: "review",
      title: `Confirm ${issue.evidenceNeed} mapping`,
      whyItMatters:
        issue.caveat ??
        "A reviewer needs to confirm this field before the output is used for decision review.",
      easiestFix:
        issue.suggestedAction ??
        `Choose the field that best represents ${issue.evidenceNeed.toLowerCase()}.`,
      alternatives: ["Keep this item in the handoff as unresolved."],
      appCanHelpWith: ["Show the affected fields and readiness caveat."],
      humanMustReview: "Confirm the mapping before treating the evidence as covered.",
      estimatedEffort: "minutes",
      safeAutomationLevel: "suggest_only",
      evidenceNeed: issue.evidenceNeed,
      fieldNames: issue.affectedColumns ?? [],
    };
  }

  if (issue.status === "fail" && issue.evidenceNeed) {
    return {
      issueType: "quality_issue",
      severity: "blocker",
      title: `Review ${issue.evidenceNeed} quality`,
      whyItMatters:
        issue.caveat ??
        "A high-severity quality issue can make the decision output misleading.",
      easiestFix:
        issue.suggestedAction ??
        "Review the affected field and correct the source before using the dashboard for decision review.",
      alternatives: ["Exclude the affected signal from decision review and document the caveat."],
      appCanHelpWith: ["Show the affected field and keep the blocker visible."],
      humanMustReview: "Confirm the correction or exclusion before preparing the handoff.",
      estimatedEffort: "needs_owner",
      safeAutomationLevel: "not_automatable",
      evidenceNeed: issue.evidenceNeed,
      fieldNames: issue.affectedColumns ?? [],
    };
  }

  return null;
}

function aiFallbackAction(
  fallbackReason: NonNullable<AIRecommendationResponse["fallbackReason"]>,
): RepairActionDraft {
  const title = AI_FALLBACK_LABELS[fallbackReason];
  const authOrQuota =
    fallbackReason === "unauthenticated" ||
    fallbackReason === "not_entitled" ||
    fallbackReason === "quota_exceeded";
  return {
    issueType: "ai_fallback",
    severity: authOrQuota ? "review" : "info",
    title,
    whyItMatters:
      "AI wording or synthesis is unavailable, but deterministic checks still support the workflow.",
    easiestFix: authOrQuota
      ? "Continue with deterministic guidance now, or resolve account access before requesting AI assistance."
      : "Continue with deterministic guidance and preserve the fallback note in the handoff.",
    alternatives: ["Retry AI later if access and provider configuration are restored."],
    appCanHelpWith: [
      "Use deterministic readiness, evidence coverage, and dashboard recommendations.",
      "Record the fallback reason as safe metadata.",
    ],
    humanMustReview: "Review deterministic caveats before sharing the handoff.",
    estimatedEffort: authOrQuota ? "minutes" : "seconds",
    safeAutomationLevel: "suggest_only",
  };
}

function withId(action: RepairActionDraft): RepairAction {
  return {
    ...action,
    alternatives: action.alternatives.slice(0, 3),
    appCanHelpWith: action.appCanHelpWith.slice(0, 3),
    id:
      action.id ??
      [
        "repair",
        action.issueType,
        action.evidenceNeed ? slugify(action.evidenceNeed) : slugify(action.title),
      ].join("-"),
  };
}

function dedupeActions(actions: RepairAction[]) {
  const seen = new Map<string, RepairAction>();
  for (const action of actions) {
    const key = [
      action.issueType,
      action.evidenceNeed ? slugify(action.evidenceNeed) : "",
      action.title,
    ].join(":");
    const existing = seen.get(key);
    if (!existing || severityRank(action.severity) > severityRank(existing.severity)) {
      seen.set(key, action);
    }
  }
  return Array.from(seen.values());
}

function compareRepairActions(a: RepairAction, b: RepairAction) {
  return (
    severityRank(b.severity) - severityRank(a.severity) ||
    effortRank(a.estimatedEffort) - effortRank(b.estimatedEffort) ||
    issueRank(a.issueType) - issueRank(b.issueType) ||
    a.title.localeCompare(b.title)
  );
}

function severityRank(severity: RepairActionSeverity) {
  return { info: 0, review: 1, blocker: 2 }[severity];
}

function effortRank(effort: RepairActionEffort) {
  return { seconds: 0, minutes: 1, needs_owner: 2 }[effort];
}

function issueRank(issueType: RepairActionIssueType) {
  return {
    missing_evidence: 0,
    quality_issue: 1,
    ambiguous_mapping: 2,
    ai_fallback: 3,
  }[issueType];
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item"
  );
}

export function repairActionAutomationLabel(level: SafeAutomationLevel) {
  return {
    apply_after_review: "App can assist after review",
    not_automatable: "Human review required",
    suggest_only: "Suggestion only",
  }[level];
}
