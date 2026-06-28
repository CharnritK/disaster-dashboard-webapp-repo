import type { WorkflowStep } from "@/lib/config";
import type {
  DecisionReadinessResult,
  EvidenceCoverageItem,
  EvidenceCoverageSummary,
} from "@/types/decision";
import type { QualityCheckResult } from "@/types/quality";
import type { AIRecommendationResponse } from "@/types/recommendations";
import type { ConnectorStatusRepairSummary } from "@/types/connectorMetadata";
import type {
  RepairAction,
  RepairActionEffort,
  RepairActionIssueType,
  RepairActionSeverity,
  SafeAutomationLevel,
} from "@/types/repairAction";
import type { ExtractionRepairSummary } from "@/types/extractionMetadata";
import type { FormIntakeMetadata } from "@/types/formIntake";
import type { FuzzyReviewCandidate } from "@/types/fuzzyReview";

export type BuildRepairActionsInput = {
  workflowStep?: WorkflowStep;
  readiness?: DecisionReadinessResult;
  evidenceCoverage?: EvidenceCoverageSummary;
  qualityResults?: QualityCheckResult[];
  aiFallbackReason?: AIRecommendationResponse["fallbackReason"];
  connectorSummaries?: ConnectorStatusRepairSummary[];
  extractionSummaries?: ExtractionRepairSummary[];
  formMetadata?: FormIntakeMetadata;
  fuzzyReviewCandidates?: FuzzyReviewCandidate[];
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
  connectorSummaries = [],
  extractionSummaries = [],
  formMetadata,
  fuzzyReviewCandidates = [],
}: BuildRepairActionsInput): RepairAction[] {
  const actions: RepairAction[] = [];

  const formAction = formDetectionRepairAction(formMetadata);
  if (formAction) actions.push(withId(formAction));

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

  for (const summary of connectorSummaries) {
    if (summary.severity !== "info") {
      actions.push(withId(connectorRepairAction(summary)));
    }
  }

  for (const summary of extractionSummaries) {
    if (summary.reviewState !== "ready") {
      actions.push(withId(extractionRepairAction(summary)));
    }
  }

  for (const candidate of fuzzyReviewCandidates) {
    if (candidate.status !== "ready") {
      actions.push(withId(fuzzyReviewRepairAction(candidate)));
    }
  }

  return dedupeActions(actions).sort(compareRepairActions);
}

function formDetectionRepairAction(
  metadata?: FormIntakeMetadata,
): RepairActionDraft | null {
  if (!metadata) return null;
  const detection = metadata.detection;
  if (detection.status !== "review_needed" && detection.confidence >= 0.75) {
    return null;
  }

  return {
    issueType: "weak_form_detection",
    severity: detection.status === "not_detected" ? "blocker" : "review",
    title: "Review form detection",
    whyItMatters:
      "The app may map evidence to the wrong form structure if the detected form family is weak or uncertain.",
    easiestFix:
      "Review the detected form family, field count, and caveats before using form mappings in the decision handoff.",
    alternatives: [
      "Continue with dataset profiling only and keep the form caveat unresolved.",
      "Ask the form owner to confirm the source format and field definitions.",
    ],
    appCanHelpWith: [
      "Show detected form signals, confidence, and metadata-only caveats.",
      "Keep weak detection visible in the review handoff.",
    ],
    humanMustReview: "Confirm the form family and evidence mapping before relying on form-aware guidance.",
    estimatedEffort: "minutes",
    safeAutomationLevel: "suggest_only",
    fieldNames: metadata.schemaSummary.fields.map((field) => field.name).slice(0, 4),
  };
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

function connectorRepairAction(summary: ConnectorStatusRepairSummary): RepairActionDraft {
  return {
    id: `repair-connector-${summary.provider}-${slugify(summary.connectorRef)}`,
    issueType: "connector_sync_issue",
    severity: summary.severity,
    title: summary.title,
    whyItMatters: summary.rationale,
    easiestFix: summary.action,
    alternatives: [
      "Use deterministic checks without connector-backed evidence for now.",
      "Keep connector caveats unresolved in the handoff until the source owner confirms status.",
    ],
    appCanHelpWith: summary.appCanHelpWith,
    humanMustReview: summary.humanMustReview,
    estimatedEffort: summary.severity === "blocker" ? "needs_owner" : "minutes",
    safeAutomationLevel: "suggest_only",
  };
}

function extractionRepairAction(summary: ExtractionRepairSummary): RepairActionDraft {
  const isGeocoding = summary.kind === "geocoding";
  return {
    id: `repair-${summary.kind}-${summary.reviewState}`,
    issueType: isGeocoding ? "geocoding_uncertainty" : "ocr_pdf_confidence_issue",
    severity: summary.reviewState === "blocked" ? "blocker" : "review",
    title: summary.title,
    whyItMatters: isGeocoding
      ? "Location assistance is uncertain until match counts and precision buckets are reviewed."
      : "OCR/PDF assistance is uncertain until confidence buckets and field candidates are reviewed.",
    easiestFix: isGeocoding
      ? "Review geocoding match counts, precision buckets, and caveats before using location-derived guidance."
      : "Review OCR/PDF confidence buckets, page count, field candidate count, and caveats before using extraction-derived guidance.",
    alternatives: [
      "Continue without this assistance and keep the caveat in the handoff.",
      "Ask the source owner to provide a cleaner schema or reviewed source export.",
    ],
    appCanHelpWith: [
      "Show only aggregate counts, confidence buckets, and caveats.",
      "Keep source content and location details out of persisted metadata.",
    ],
    humanMustReview: isGeocoding
      ? "Confirm location evidence before treating geocoding assistance as review-ready."
      : "Confirm extracted fields before treating OCR/PDF assistance as review-ready.",
    estimatedEffort: summary.priority === "high" ? "needs_owner" : "minutes",
    safeAutomationLevel: "suggest_only",
  };
}

function fuzzyReviewRepairAction(candidate: FuzzyReviewCandidate): RepairActionDraft {
  const source = candidate.sourceFieldName;
  const target = candidate.targetFieldName ?? "a target field";
  return {
    id: candidate.id.replace(/^fuzzy-review-/, "repair-fuzzy-"),
    issueType: "fuzzy_match_conflict",
    severity: candidate.outcome === "no_match" ? "blocker" : "review",
    title:
      candidate.outcome === "no_match"
        ? `Find mapping for ${source}`
        : `Review fuzzy mapping for ${source}`,
    whyItMatters:
      "A fuzzy field suggestion can point to the wrong evidence if a reviewer does not confirm it.",
    easiestFix:
      candidate.outcome === "no_match"
        ? `Choose a reviewed target field for ${source}, or keep the mapping unresolved in the handoff.`
        : `Confirm whether ${source} should map to ${target} before reusing this mapping.`,
    alternatives: [
      "Keep this mapping unresolved and preserve the caveat.",
      "Ask the source owner to clarify the intended field definition.",
    ],
    appCanHelpWith: [
      "Compare field names, labels, confidence, and conflict status.",
      "Store only reviewed mapping metadata if the reviewer accepts it.",
    ],
    humanMustReview:
      "Confirm the mapping choice; the app only records reviewed mapping metadata and never changes dataset contents automatically.",
    estimatedEffort: "minutes",
    safeAutomationLevel: "suggest_only",
    fieldNames: [source, ...(candidate.targetFieldName ? [candidate.targetFieldName] : [])],
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
    weak_form_detection: 4,
    connector_sync_issue: 5,
    ocr_pdf_confidence_issue: 6,
    geocoding_uncertainty: 7,
    fuzzy_match_conflict: 8,
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
