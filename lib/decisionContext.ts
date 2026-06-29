import type { Dataset } from "@/types/dataset";
import type {
  DecisionBrief,
  DecisionPlaybook,
  DecisionReadinessResult,
  DecisionReadinessStatus,
  EvidenceReadinessControlTower,
  EvidenceCoverageCandidate,
  EvidenceCoverageItem,
  EvidenceCoverageStatus,
  EvidenceCoverageSummary,
  AiGuardrailExplanation,
  SafeBetaLearningSignal,
  SuggestedCollectionField,
  SuggestedDataCollectionTemplate,
  UseCaseTemplate,
  UseCaseTemplateId,
} from "@/types/decision";
import type { AIRecommendationResponse } from "@/types/recommendations";
import type { QualityCheckResult } from "@/types/quality";
import { FEEDBACK_TAGS } from "./feedback/constants";

const DECISION_TEMPLATE_DEFAULTS: Record<
  UseCaseTemplateId,
  Omit<DecisionBrief, "useCaseId" | "requiredEvidence">
> = {
  response_prioritization: {
    decisionQuestion: "Which affected districts should receive first response?",
    intendedAction: "Prioritize response teams for the next distribution cycle.",
    decisionMaker: "Emergency operations lead",
    geographyScope: "Affected districts",
    timeframe: "Next 72 hours",
  },
  service_gap_monitoring: {
    decisionQuestion: "Where are service gaps largest for affected communities?",
    intendedAction: "Prioritize service-gap follow-up and partner coordination.",
    decisionMaker: "Humanitarian coordination lead",
    geographyScope: "Affected communities",
    timeframe: "Current response period",
  },
  preparedness_risk_screening: {
    decisionQuestion: "Which areas need preparedness attention before the next hazard event?",
    intendedAction: "Prioritize preparedness support and readiness checks.",
    decisionMaker: "Preparedness planning lead",
    geographyScope: "At-risk areas",
    timeframe: "Before the next hazard event",
  },
};

export const DECISION_TEMPLATES: UseCaseTemplate[] = [
  {
    id: "response_prioritization",
    title: "Response prioritization",
    description:
      "Rank areas or groups for near-term response based on need, affected population, severity, response gap, and available capacity.",
    requiredEvidence: [
      "Admin geography",
      "Need severity",
      "Affected population",
      "Response gap",
      "Capacity signal",
    ],
  },
  {
    id: "service_gap_monitoring",
    title: "Service gap monitoring",
    description:
      "Identify where affected communities have the largest unmet service needs relative to available response capacity.",
    requiredEvidence: [
      "Admin geography",
      "Need severity",
      "Service availability",
      "Response gap",
      "Capacity signal",
    ],
  },
  {
    id: "preparedness_risk_screening",
    title: "Preparedness risk screening",
    description:
      "Screen areas for hazard exposure, vulnerability, population scale, and preparedness capacity before the next event.",
    requiredEvidence: [
      "Admin geography",
      "Hazard exposure",
      "Vulnerability",
      "Population denominator",
      "Preparedness capacity",
    ],
  },
];

export const RESPONSE_PRIORITIZATION_TEMPLATE = DECISION_TEMPLATES[0];

const DECISION_PLAYBOOK_COPY: Record<
  UseCaseTemplateId,
  {
    knownCaveats: string[];
    sampleScenario: string;
    sourceFreshnessExpectations: string[];
    handoffLanguage: string;
    nextCollectionAsks: string[];
  }
> = {
  response_prioritization: {
    knownCaveats: [
      "Severity, affected population, response gap, and capacity often come from different reporting cadences.",
      "Rankings are not action-ready when admin geography or affected population evidence is missing.",
      "Capacity signals must be interpreted with access constraints and partner coverage notes.",
    ],
    sampleScenario:
      "A district operations lead needs to decide which affected districts receive response teams in the next distribution cycle.",
    sourceFreshnessExpectations: [
      "Need severity and response gap should be current for the active response period.",
      "Affected population denominators should be dated and reviewed when displacement is changing quickly.",
      "Capacity signals should identify the reporting source or partner update cycle.",
    ],
    handoffLanguage:
      "Use this handoff as a review packet for prioritization. It identifies covered, ambiguous, and missing evidence, but does not authorize operational action without owner review.",
    nextCollectionAsks: [
      "Confirm a stable admin area or P-code / COD admin code field.",
      "Add the current need severity and affected population estimate.",
      "Document response gap and available capacity using consistent units.",
    ],
  },
  service_gap_monitoring: {
    knownCaveats: [
      "Service availability and response gap can reflect reporting coverage rather than true community access.",
      "Partner presence does not prove service quality or continuity.",
      "Comparable geography is required before ranking gaps across locations.",
    ],
    sampleScenario:
      "A coordination lead needs to identify where WASH, health, shelter, or food-service gaps are largest for partner follow-up.",
    sourceFreshnessExpectations: [
      "Service availability should be refreshed for the current coordination cycle.",
      "Response gap estimates should identify the population, service, or target used as the denominator.",
      "Capacity signals should be tied to partner or facility reporting dates where available.",
    ],
    handoffLanguage:
      "Use this handoff to coordinate review of service gaps and partner follow-up. Treat ambiguous coverage or missing capacity as unresolved until reviewed.",
    nextCollectionAsks: [
      "Confirm which service or sector each record describes.",
      "Add a service availability or coverage field.",
      "Add response gap and capacity fields with source notes.",
    ],
  },
  preparedness_risk_screening: {
    knownCaveats: [
      "Hazard exposure, vulnerability, and preparedness capacity usually come from different source systems.",
      "Preparedness screening is a planning aid, not a real-time impact assessment.",
      "Population denominators need review when boundaries or settlement patterns changed after the source date.",
    ],
    sampleScenario:
      "A preparedness planner needs to identify at-risk areas for readiness checks before the next hazard event.",
    sourceFreshnessExpectations: [
      "Hazard exposure should identify the relevant scenario or seasonal window.",
      "Vulnerability and population denominators should be reviewed for recency before comparison.",
      "Preparedness capacity should reflect current stock, plan, shelter, staffing, or drill status.",
    ],
    handoffLanguage:
      "Use this handoff as a preparedness screening packet. It supports planning review and should not be treated as emergency-response authorization.",
    nextCollectionAsks: [
      "Add a hazard exposure or risk field for the planning scenario.",
      "Add vulnerability and population denominator evidence.",
      "Add preparedness capacity evidence with source and date caveats.",
    ],
  },
};

export function isUseCaseTemplateId(value: unknown): value is UseCaseTemplateId {
  return (
    typeof value === "string" &&
    DECISION_TEMPLATES.some((template) => template.id === value)
  );
}

export function getUseCaseTemplate(useCaseId: UseCaseTemplateId): UseCaseTemplate {
  return (
    DECISION_TEMPLATES.find((template) => template.id === useCaseId) ??
    RESPONSE_PRIORITIZATION_TEMPLATE
  );
}

export function createDecisionBriefFromTemplate(
  useCaseId: UseCaseTemplateId,
): DecisionBrief {
  const template = getUseCaseTemplate(useCaseId);
  return {
    useCaseId: template.id,
    ...DECISION_TEMPLATE_DEFAULTS[template.id],
    requiredEvidence: [...template.requiredEvidence],
  };
}

export function createDefaultDecisionBrief(): DecisionBrief {
  return createDecisionBriefFromTemplate("response_prioritization");
}

export function buildSuggestedDataCollectionTemplate(
  brief: DecisionBrief,
): SuggestedDataCollectionTemplate {
  const selectedEvidence = new Set(brief.requiredEvidence.map(normalizeLabel));
  const hasEvidence = (label: string) => selectedEvidence.has(normalizeLabel(label));
  const fields: SuggestedCollectionField[] = [
    {
      name: "admin_area",
      label: "Administrative area",
      type: "text",
      required: true,
      evidenceNeed: "Admin geography",
      description: `Name of the ${brief.geographyScope.toLowerCase()} being prioritized.`,
      example: "District 01",
      caveat: "Use stable area names so dashboard rankings can be reviewed.",
    },
    {
      name: "admin_code",
      label: "Administrative code",
      type: "text",
      required: true,
      evidenceNeed: "Admin geography",
      description: "Stable P-code / COD admin code for the administrative area.",
      example: "MDG01",
      caveat: "Use the same COD administrative code system across every uploaded dataset.",
    },
    {
      name: "observation_date",
      label: "Observation date",
      type: "date",
      required: true,
      evidenceNeed: "Timeframe/date",
      description: `Date the observation applies to within ${brief.timeframe.toLowerCase()}.`,
      example: "YYYY-MM-DD",
      caveat: "Stale dates weaken response-prioritization decisions.",
    },
  ];

  if (hasEvidence("Need severity")) {
    fields.push({
      name: "severity_score",
      label: "Need or severity score",
      type: "number",
      required: true,
      evidenceNeed: "Need severity",
      description: "Comparable score representing urgency, need, damage, or severity.",
      example: "78",
      caveat: "Use one scoring scale consistently across all areas.",
    });
  }

  if (hasEvidence("Affected population")) {
    fields.push(
      {
        name: "affected_population",
        label: "Affected population",
        type: "integer",
        required: true,
        evidenceNeed: "Affected population",
        description: "Estimated people or households affected in the area.",
        example: "1250",
        caveat: "Counts must not be negative.",
      },
      {
        name: "population_denominator",
        label: "Population denominator",
        type: "integer",
        required: false,
        evidenceNeed: "Affected population",
        description: "Total population or households used to compare affected share.",
        example: "5000",
        caveat: "Denominators make comparisons across areas safer.",
      },
    );
  }

  if (hasEvidence("Response gap")) {
    fields.push({
      name: "response_gap_percent",
      label: "Response gap percent",
      type: "percent",
      required: true,
      evidenceNeed: "Response gap",
      description: "Estimated percent of affected need not yet covered by response.",
      example: "42",
      caveat: "Percent values should stay within 0-100.",
    });
  }

  if (hasEvidence("Service availability")) {
    fields.push({
      name: "service_availability_score",
      label: "Service availability score",
      type: "number",
      required: true,
      evidenceNeed: "Service availability",
      description: "Comparable score for service presence, coverage, or functionality.",
      example: "68",
      caveat: "Use one service availability scale consistently across areas.",
    });
  }

  if (hasEvidence("Capacity signal")) {
    fields.push({
      name: "current_capacity",
      label: "Current response capacity",
      type: "number",
      required: true,
      evidenceNeed: "Capacity signal",
      description: "Available response capacity, service points, staff, stock, or coverage.",
      example: "12",
      caveat: "Capacity should use a consistent unit across areas.",
    });
  }

  if (hasEvidence("Hazard exposure")) {
    fields.push({
      name: "hazard_exposure_score",
      label: "Hazard exposure score",
      type: "number",
      required: true,
      evidenceNeed: "Hazard exposure",
      description: "Comparable score for expected exposure to the relevant hazard.",
      example: "74",
      caveat: "Exposure scores should use a consistent hazard scenario.",
    });
  }

  if (hasEvidence("Vulnerability")) {
    fields.push({
      name: "vulnerability_score",
      label: "Vulnerability score",
      type: "number",
      required: true,
      evidenceNeed: "Vulnerability",
      description: "Comparable score for vulnerability, sensitivity, or limited coping capacity.",
      example: "81",
      caveat: "Vulnerability indicators should be documented for reviewer interpretation.",
    });
  }

  if (hasEvidence("Population denominator")) {
    fields.push({
      name: "population_denominator",
      label: "Population denominator",
      type: "integer",
      required: true,
      evidenceNeed: "Population denominator",
      description: "Total population or households used to compare risk across areas.",
      example: "5000",
      caveat: "Denominators make cross-area preparedness comparisons safer.",
    });
  }

  if (hasEvidence("Preparedness capacity")) {
    fields.push({
      name: "preparedness_capacity_score",
      label: "Preparedness capacity score",
      type: "number",
      required: true,
      evidenceNeed: "Preparedness capacity",
      description: "Comparable score for readiness resources, stock, plans, or response capacity.",
      example: "42",
      caveat: "Capacity should use a consistent unit or scoring method across areas.",
    });
  }

  fields.push(
    {
      name: "data_source",
      label: "Data source",
      type: "text",
      required: false,
      evidenceNeed: "Source quality",
      description: "Agency, assessment, or system that produced the observation.",
      example: "Rapid needs assessment",
    },
    {
      name: "notes",
      label: "Notes",
      type: "text",
      required: false,
      evidenceNeed: "Review context",
      description: "Short caveat, assumption, or field note for reviewers.",
      example: "Road access limited",
    },
  );

  return {
    title: `Suggested ${slugify(getUseCaseTemplate(brief.useCaseId).title)} data collection template`,
    decisionQuestion: brief.decisionQuestion,
    intendedAction: brief.intendedAction,
    decisionMaker: brief.decisionMaker,
    geographyScope: brief.geographyScope,
    timeframe: brief.timeframe,
    fields,
  };
}

export type DecisionMapDataGroup = {
  evidenceNeed: string;
  fields: SuggestedCollectionField[];
};

export function buildDecisionMapDataGroups(
  brief: DecisionBrief,
  template = buildSuggestedDataCollectionTemplate(brief),
): DecisionMapDataGroup[] {
  const selectedEvidence = new Set(brief.requiredEvidence.map(normalizeLabel));
  const sourceConfigEvidence = new Set(["sourcequality", "reviewcontext"]);
  const groups = brief.requiredEvidence.map((evidenceNeed) => ({
    evidenceNeed,
    fields: template.fields.filter(
      (field) => normalizeLabel(field.evidenceNeed) === normalizeLabel(evidenceNeed),
    ),
  }));
  const sharedFields = template.fields.filter((field) => {
    const evidenceKey = normalizeLabel(field.evidenceNeed);
    return !selectedEvidence.has(evidenceKey) && !sourceConfigEvidence.has(evidenceKey);
  });

  return [
    ...groups,
    ...(sharedFields.length > 0
      ? [{ evidenceNeed: "Shared decision context", fields: sharedFields }]
      : []),
  ].filter((group) => group.fields.length > 0);
}

export function buildSuggestedCollectionTemplateRows(
  template: SuggestedDataCollectionTemplate,
): Record<string, string>[] {
  return [
    Object.fromEntries(
      template.fields.map((field) => [field.name, field.example]),
    ) as Record<string, string>,
  ];
}

export function buildDecisionPlaybook(useCaseId: UseCaseTemplateId): DecisionPlaybook {
  const brief = createDecisionBriefFromTemplate(useCaseId);
  const template = getUseCaseTemplate(useCaseId);
  const playbookCopy = DECISION_PLAYBOOK_COPY[useCaseId];

  return {
    id: useCaseId,
    title: `${template.title} playbook`,
    decisionQuestion: brief.decisionQuestion,
    requiredEvidence: [...brief.requiredEvidence],
    knownCaveats: [...playbookCopy.knownCaveats],
    suggestedFields: buildSuggestedDataCollectionTemplate(brief).fields,
    sampleScenario: playbookCopy.sampleScenario,
    sourceFreshnessExpectations: [...playbookCopy.sourceFreshnessExpectations],
    handoffLanguage: playbookCopy.handoffLanguage,
    nextCollectionAsks: [...playbookCopy.nextCollectionAsks],
  };
}

export function buildDecisionPlaybooks(): DecisionPlaybook[] {
  return DECISION_TEMPLATES.map((template) => buildDecisionPlaybook(template.id));
}

export function buildEvidenceReadinessControlTower({
  evidenceCoverage,
  readiness,
}: {
  evidenceCoverage: EvidenceCoverageSummary;
  readiness: DecisionReadinessResult;
}): EvidenceReadinessControlTower {
  const evidenceCovered = evidenceCoverage.items
    .filter((item) => item.status === "covered")
    .map((item) => item.evidenceNeed);
  const ambiguousEvidence = evidenceCoverage.items
    .filter((item) => item.status === "ambiguous")
    .map((item) => item.evidenceNeed);
  const missingEvidence = evidenceCoverage.items
    .filter((item) => item.status === "missing")
    .map((item) => item.evidenceNeed);
  const nextCollectionAsks = evidenceCoverage.items
    .filter((item) => item.status !== "covered")
    .map((item) => item.nextAction);
  const sourceConfidence = sourceConfidenceForCoverage(evidenceCoverage);
  const actionSafetyState =
    readiness.status === "ready"
      ? "ready_for_review"
      : readiness.status === "review_needed"
        ? "needs_review"
        : "blocked_for_action";

  return {
    deterministicAuthority: true,
    status: readiness.status,
    actionSafetyState,
    evidenceCovered,
    ambiguousEvidence,
    missingEvidence,
    blockers: readiness.requiredEvidenceMissing.map(
      (evidence) => `Missing required evidence: ${evidence}`,
    ),
    nextCollectionAsks,
    sourceConfidence,
    sourceConfidenceRationale: sourceConfidenceRationale(evidenceCoverage),
    reviewState:
      actionSafetyState === "ready_for_review"
        ? "Ready for human review; deterministic checks found the required evidence."
        : actionSafetyState === "needs_review"
          ? "Needs reviewer choice before action; one or more evidence signals or quality checks are ambiguous."
          : "Blocked for action; required evidence or high-severity checks remain unresolved.",
  };
}

export function buildAiGuardrailExplanation({
  recommendations,
  qualityResults = [],
  unsupportedSuggestions = [],
}: {
  recommendations?: AIRecommendationResponse;
  qualityResults?: QualityCheckResult[];
  unsupportedSuggestions?: string[];
}): AiGuardrailExplanation {
  const hasBlockingQuality = qualityResults.some((issue) => issue.status === "fail");
  const hasReviewQuality = qualityResults.some((issue) => issue.status === "warning");
  const aiRecommendationStatus =
    recommendations?.source === "llm" && !recommendations.fallbackReason
      ? "returned"
      : recommendations?.fallbackReason
        ? "fallback"
        : "not_requested";
  const deterministicValidation =
    hasBlockingQuality
      ? "rejected"
      : hasReviewQuality || unsupportedSuggestions.length > 0
        ? "partially_accepted"
        : "accepted";

  return {
    advisoryOnly: true,
    aiRecommendationStatus,
    deterministicValidation,
    deterministicAuthorityStatement:
      "AI suggestions are advisory. Deterministic profiling, evidence coverage, quality checks, and visualization policy decide what can continue in the workflow.",
    fallbackReason: recommendations?.fallbackReason,
    unsupportedSuggestions,
    validationCaveats: qualityResults
      .filter((issue) => issue.status !== "pass")
      .map((issue) => issue.caveat ?? issue.suggestedAction ?? issue.description)
      .slice(0, 6),
  };
}

export function buildSafeBetaLearningSignal({
  decisionBrief,
  evidenceCoverage,
  readiness,
  fallbackReason,
  exportType,
  feedbackTags = [],
}: {
  decisionBrief: DecisionBrief;
  evidenceCoverage: EvidenceCoverageSummary;
  readiness: DecisionReadinessResult;
  fallbackReason?: string;
  exportType?: SafeBetaLearningSignal["exportType"];
  feedbackTags?: string[];
}): SafeBetaLearningSignal {
  return {
    useCaseId: decisionBrief.useCaseId,
    readinessStatus: readiness.status,
    blockerCount: readiness.blockerCount,
    ambiguousEvidenceCount: evidenceCoverage.ambiguousCount,
    missingEvidenceCount: evidenceCoverage.missingCount,
    fallbackReason,
    exportType,
    feedbackTags: feedbackTags.map(safeLearningTag).filter(Boolean).slice(0, 8),
    templateOrPlaybookSelected: decisionBrief.useCaseId,
    metadataOnly: true,
  };
}

type EvidenceRule = {
  id: string;
  label: string;
  patterns: RegExp[];
  strongTerms: string[];
  usefulTypes: string[];
  caveat: string;
  nextAction: string;
};

const RESPONSE_PRIORITIZATION_EVIDENCE: EvidenceRule[] = [
  {
    id: "admin-geography",
    label: "Admin geography",
    patterns: [/district|admin|region|province|county|pcode|adm\d?_?p?code/i],
    strongTerms: ["admin", "pcode", "district", "region", "province", "county"],
    usefulTypes: ["string"],
    caveat:
      "Do not compare response priorities without a usable geographic or administrative field.",
    nextAction:
      "Add or combine a stable area name or P-code / COD admin code field before using rankings for action.",
  },
  {
    id: "need-severity",
    label: "Need severity",
    patterns: [/need|severity|score|priority|insecurity|damage|access/i],
    strongTerms: ["need", "severity", "score", "priority", "insecurity", "damage"],
    usefulTypes: ["number", "string"],
    caveat:
      "Do not rank response priorities without a severity or needs signal.",
    nextAction:
      "Add or combine a need, severity, priority, or damage score field before prioritizing response.",
  },
  {
    id: "affected-population",
    label: "Affected population",
    patterns: [/population|people|household|assessed|affected|cases/i],
    strongTerms: ["affected", "population", "people", "household", "assessed", "cases"],
    usefulTypes: ["number"],
    caveat:
      "Do not rank districts by need without an affected population denominator.",
    nextAction:
      "Add or combine an affected population, assessed people, household, or case count field.",
  },
  {
    id: "response-gap",
    label: "Response gap",
    patterns: [/gap|coverage|unmet|access|service|facility|center/i],
    strongTerms: ["gap", "coverage", "unmet", "access"],
    usefulTypes: ["number"],
    caveat:
      "Do not treat rankings as action-ready without a response gap or capacity signal.",
    nextAction:
      "Add or combine a response gap, unmet need, coverage, or access field before acting.",
  },
  {
    id: "capacity-signal",
    label: "Capacity signal",
    patterns: [/capacity|facility|clinic|center|service|market|staff|stock/i],
    strongTerms: ["capacity", "staff", "stock", "facility", "clinic", "center", "service", "market"],
    usefulTypes: ["number"],
    caveat:
      "Do not assign scarce resources without checking response capacity evidence.",
    nextAction:
      "Add or combine a capacity, facility, staff, stock, service, or market signal.",
  },
  {
    id: "service-availability",
    label: "Service availability",
    patterns: [/service|availability|available|coverage|functioning|operational/i],
    strongTerms: ["service", "availability", "available", "coverage", "functioning", "operational"],
    usefulTypes: ["number", "string", "boolean"],
    caveat:
      "Do not treat service-gap comparisons as action-ready without service availability evidence.",
    nextAction:
      "Add or combine a service availability, coverage, or functionality field.",
  },
  {
    id: "hazard-exposure",
    label: "Hazard exposure",
    patterns: [/hazard|exposure|flood|storm|cyclone|wildfire|risk/i],
    strongTerms: ["hazard", "exposure", "flood", "storm", "cyclone", "wildfire", "risk"],
    usefulTypes: ["number", "string"],
    caveat:
      "Do not screen preparedness priorities without a hazard exposure signal.",
    nextAction:
      "Add or combine a hazard exposure, risk, flood, storm, or other hazard field.",
  },
  {
    id: "vulnerability",
    label: "Vulnerability",
    patterns: [/vulnerability|vulnerable|poverty|elderly|disability|fragility|sensitivity/i],
    strongTerms: ["vulnerability", "vulnerable", "poverty", "elderly", "disability", "fragility", "sensitivity"],
    usefulTypes: ["number", "string"],
    caveat:
      "Do not screen preparedness priorities without vulnerability evidence.",
    nextAction:
      "Add or combine a vulnerability, sensitivity, poverty, disability, or coping-capacity field.",
  },
  {
    id: "population-denominator",
    label: "Population denominator",
    patterns: [/population|denominator|people|household|baseline|total/i],
    strongTerms: ["population", "denominator", "people", "household", "baseline", "total"],
    usefulTypes: ["number"],
    caveat:
      "Do not compare preparedness risk across areas without a population denominator.",
    nextAction:
      "Add or combine a total population, household, people, or baseline denominator field.",
  },
  {
    id: "preparedness-capacity",
    label: "Preparedness capacity",
    patterns: [/preparedness|readiness|capacity|stock|shelter|plan|warehouse|drill/i],
    strongTerms: ["preparedness", "readiness", "capacity", "stock", "shelter", "plan", "warehouse", "drill"],
    usefulTypes: ["number", "string"],
    caveat:
      "Do not treat preparedness rankings as action-ready without capacity evidence.",
    nextAction:
      "Add or combine a preparedness capacity, readiness, stock, shelter, or plan field.",
  },
];

export function validateDecisionBrief(brief: Partial<DecisionBrief>) {
  const missing: string[] = [];
  if (!isUseCaseTemplateId(brief.useCaseId)) missing.push("use case");
  if (!brief.decisionQuestion?.trim()) missing.push("decision question");
  if (!brief.intendedAction?.trim()) missing.push("intended action");
  if (!brief.decisionMaker?.trim()) missing.push("decision-maker");
  if (!brief.geographyScope?.trim()) missing.push("geography scope");
  if (!brief.timeframe?.trim()) missing.push("timeframe");
  if (!brief.requiredEvidence?.length) missing.push("required evidence");
  return missing;
}

export function evidenceCoverageStatusLabel(status: EvidenceCoverageStatus) {
  return {
    covered: "Covered",
    ambiguous: "Needs review",
    missing: "Missing",
  }[status];
}

export function readinessStatusLabel(status: DecisionReadinessStatus) {
  return {
    ready: "Ready for review",
    review_needed: "Review needed",
    decision_unsafe: "Not safe for action yet",
  }[status];
}

export function buildEvidenceCoverageSummary(
  datasets: Dataset[],
  decisionBrief: DecisionBrief,
): EvidenceCoverageSummary {
  const rules = evidenceRulesFor(decisionBrief.requiredEvidence);
  const items = rules.map((rule): EvidenceCoverageItem => {
    const hasAmbiguousFormMapping = datasets.some((dataset) =>
      (dataset.inputHints?.formEvidenceMappings ?? []).some(
        (mapping) =>
          mapping.evidenceNeed === rule.label && mapping.status === "ambiguous",
      ),
    );
    const candidates = datasets
      .flatMap((dataset) => [
        ...formEvidenceCandidatesForDataset(dataset, rule),
        ...evidenceCandidatesForDataset(dataset, rule),
      ])
      .filter(uniqueEvidenceCandidate)
      .sort(
        (a, b) =>
          b.confidence - a.confidence ||
          a.missingPercentage - b.missingPercentage ||
          a.datasetName.localeCompare(b.datasetName) ||
          a.columnName.localeCompare(b.columnName),
      );
    const strongCandidates = candidates.filter((candidate) => candidate.confidence >= 0.62);
    const top = strongCandidates[0];
    const runnerUp = strongCandidates[1];
    const status: EvidenceCoverageStatus = !top
      ? "missing"
      : hasAmbiguousFormMapping || (runnerUp && top.confidence - runnerUp.confidence <= 0.18)
        ? "ambiguous"
        : "covered";

    return {
      evidenceNeed: rule.label,
      status,
      candidates: status === "missing" ? [] : strongCandidates.slice(0, 4),
      caveat:
        status === "covered"
          ? `Best available field for ${rule.label.toLowerCase()} was detected. ${rule.caveat}`
          : status === "ambiguous"
            ? `Multiple fields could support ${rule.label.toLowerCase()}. ${rule.caveat}`
            : rule.caveat,
      nextAction:
        status === "covered"
          ? "Review the suggested field before using it in dashboard recommendations."
          : status === "ambiguous"
            ? `Choose the field that best represents ${rule.label.toLowerCase()} before treating the output as action-ready.`
            : rule.nextAction,
    };
  });

  return {
    coveredCount: items.filter((item) => item.status === "covered").length,
    ambiguousCount: items.filter((item) => item.status === "ambiguous").length,
    missingCount: items.filter((item) => item.status === "missing").length,
    items,
  };
}

export function assessDecisionReadiness(
  dataset: Dataset,
  decisionBrief?: DecisionBrief,
  baseQualityResults: QualityCheckResult[] = [],
): {
  readiness: DecisionReadinessResult;
  qualityResults: QualityCheckResult[];
} {
  if (!decisionBrief) {
    return {
      readiness: {
        status: "review_needed",
        title: "Decision context needed",
        summary:
          "Complete a decision brief before treating quality checks as decision readiness.",
        caveats: ["Quality checks are generic until decision context is provided."],
        blockerCount: 0,
        reviewCount: 1,
        requiredEvidenceCovered: [],
        requiredEvidenceMissing: [],
      },
      qualityResults: baseQualityResults,
    };
  }

  const columns =
    dataset.columns ??
    dataset.profile?.columns.map((column) => column.columnName) ??
    Object.keys(dataset.data?.[0] ?? {});
  const requiredRules = evidenceRulesFor(decisionBrief.requiredEvidence);
  const decisionArea = getUseCaseTemplate(decisionBrief.useCaseId).title;
  const formMappedEvidence = new Set(
    (dataset.inputHints?.formEvidenceMappings ?? [])
      .filter((mapping) => mapping.status !== "missing")
      .map((mapping) => mapping.evidenceNeed),
  );
  const missingFindings = requiredRules
    .filter(
      (rule) =>
        !formMappedEvidence.has(rule.label) &&
        !columns.some((column) => rule.patterns.some((pattern) => pattern.test(column))),
    )
    .map((rule): QualityCheckResult => ({
      id: `decision-missing-${rule.id}`,
      checkType: "Decision evidence missing",
      status: "fail",
      severity: "high",
      description: `${rule.label} evidence is missing for ${decisionArea.toLowerCase()}.`,
      decisionArea,
      evidenceNeed: rule.label,
      caveat: rule.caveat,
      suggestedAction: `Add or join a field that supports ${rule.label.toLowerCase()} before relying on this dashboard for action.`,
    }));
  const invalidValueFindings = invalidDecisionValueFindings(dataset, requiredRules);
  const formMappingFindings = formMappingReviewFindings(dataset, requiredRules, decisionArea);
  const blockerCount =
    missingFindings.length +
    invalidValueFindings.length +
    baseQualityResults.filter((issue) => issue.status === "fail").length;
  const reviewCount =
    formMappingFindings.length +
    baseQualityResults.filter((issue) => issue.status === "warning").length;
  const requiredEvidenceMissing = missingFindings
    .map((finding) => finding.evidenceNeed)
    .filter((value): value is string => Boolean(value));
  const requiredEvidenceCovered = requiredRules
    .map((rule) => rule.label)
    .filter((label) => !requiredEvidenceMissing.includes(label));
  const caveats = [
    ...missingFindings.map((finding) => finding.caveat),
    ...invalidValueFindings.map((finding) => finding.caveat),
    ...formMappingFindings.map((finding) => finding.caveat),
    ...baseQualityResults
      .filter((issue) => issue.status !== "pass")
      .map((issue) => issue.caveat)
  ].filter((value): value is string => Boolean(value));
  const status =
    blockerCount > 0
      ? "decision_unsafe"
      : reviewCount > 0
        ? "review_needed"
        : "ready";

  return {
    readiness: {
      status,
      title:
        status === "ready"
          ? readinessStatusLabel(status)
          : status === "decision_unsafe"
            ? readinessStatusLabel(status)
            : readinessStatusLabel(status),
      summary:
        status === "ready"
          ? `Required ${decisionArea.toLowerCase()} evidence was detected.`
          : `${blockerCount} blocker${blockerCount === 1 ? "" : "s"} and ${reviewCount} review item${reviewCount === 1 ? "" : "s"} affect this decision.`,
      caveats,
      blockerCount,
      reviewCount,
      requiredEvidenceCovered,
      requiredEvidenceMissing,
    },
    qualityResults: [
      ...baseQualityResults,
      ...missingFindings,
      ...invalidValueFindings,
      ...formMappingFindings,
    ].sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity),
    ),
  };
}

function formMappingReviewFindings(
  dataset: Dataset,
  requiredRules: EvidenceRule[],
  decisionArea: string,
): QualityCheckResult[] {
  const requiredEvidence = new Set(requiredRules.map((rule) => rule.label));
  return (dataset.inputHints?.formEvidenceMappings ?? [])
    .filter(
      (mapping) =>
        mapping.status === "ambiguous" &&
        requiredEvidence.has(mapping.evidenceNeed),
    )
    .map((mapping): QualityCheckResult => ({
      id: `decision-ambiguous-form-mapping-${slugify(mapping.evidenceNeed)}`,
      checkType: "Decision evidence needs review",
      status: "warning",
      severity: "medium",
      description: `${mapping.evidenceNeed} form mapping needs reviewer confirmation.`,
      affectedColumns: mapping.fieldNames,
      decisionArea,
      evidenceNeed: mapping.evidenceNeed,
      caveat:
        mapping.caveats[0] ??
        `Review the form mapping for ${mapping.evidenceNeed.toLowerCase()} before relying on it for action.`,
      suggestedAction: `Confirm which form field supports ${mapping.evidenceNeed.toLowerCase()} before treating the dashboard as action-ready.`,
    }));
}

function invalidDecisionValueFindings(
  dataset: Dataset,
  requiredRules: EvidenceRule[],
): QualityCheckResult[] {
  const rows = dataset.data ?? [];
  if (rows.length === 0) return [];
  const columns =
    dataset.columns ??
    dataset.profile?.columns.map((column) => column.columnName) ??
    Object.keys(rows[0] ?? {});
  const findings: QualityCheckResult[] = [];
  const affectedPopulationRule = requiredRules.find(
    (rule) => rule.id === "affected-population",
  );
  const responseGapRule = requiredRules.find((rule) => rule.id === "response-gap");

  if (affectedPopulationRule) {
    for (const column of evidenceRuleColumns(dataset, affectedPopulationRule, columns)) {
      const invalidCount = rows.filter((row) => {
        const value = numericValue(row[column]);
        return value !== undefined && value < 0;
      }).length;
      if (invalidCount > 0) {
        findings.push({
          id: `decision-invalid-negative-count-${slugify(column)}`,
          checkType: "Invalid decision values",
          status: "fail",
          severity: "high",
          description: `${invalidCount} negative value${invalidCount === 1 ? "" : "s"} were found in ${column}.`,
          affectedColumns: [column],
          affectedRowCount: invalidCount,
          decisionArea: "Response prioritization",
          evidenceNeed: affectedPopulationRule.label,
          caveat:
            "Do not use affected-population rankings until negative count values are corrected.",
          suggestedAction: `Review ${column} before using it as an affected population or denominator field.`,
        });
      }
    }
  }

  if (responseGapRule) {
    for (const column of evidenceRuleColumns(dataset, responseGapRule, columns).filter(
      (candidate) =>
        /percent|percentage|rate|gap/i.test(candidate) ||
        formMappingFields(dataset, responseGapRule.label).includes(candidate),
    )) {
      const invalidCount = rows.filter((row) => {
        const value = numericValue(row[column]);
        return value !== undefined && (value < 0 || value > 100);
      }).length;
      if (invalidCount > 0) {
        findings.push({
          id: `decision-invalid-percent-${slugify(column)}`,
          checkType: "Invalid decision values",
          status: "fail",
          severity: "high",
          description: `${invalidCount} value${invalidCount === 1 ? "" : "s"} in ${column} are outside 0-100.`,
          affectedColumns: [column],
          affectedRowCount: invalidCount,
          decisionArea: "Response prioritization",
          evidenceNeed: responseGapRule.label,
          caveat:
            "Do not use response-gap charts for action until invalid percentages are corrected.",
          suggestedAction: `Correct ${column} values outside the 0-100 range before using response-gap comparisons.`,
        });
      }
    }
  }

  return findings;
}

function evidenceRuleColumns(
  dataset: Dataset,
  rule: EvidenceRule,
  columns: string[],
) {
  return Array.from(new Set([
    ...columns.filter((candidate) =>
      rule.patterns.some((pattern) => pattern.test(candidate)),
    ),
    ...formMappingFields(dataset, rule.label),
  ]));
}

function formMappingFields(dataset: Dataset, evidenceNeed: string) {
  return (dataset.inputHints?.formEvidenceMappings ?? [])
    .filter((mapping) => mapping.evidenceNeed === evidenceNeed && mapping.status !== "missing")
    .flatMap((mapping) => mapping.fieldNames);
}

function formEvidenceCandidatesForDataset(
  dataset: Dataset,
  rule: EvidenceRule,
): EvidenceCoverageCandidate[] {
  const rows = dataset.data ?? [];
  const mappings = dataset.inputHints?.formEvidenceMappings ?? [];
  return mappings
    .filter((mapping) => mapping.evidenceNeed === rule.label && mapping.status !== "missing")
    .flatMap((mapping) =>
      mapping.fieldNames.map((fieldName, index): EvidenceCoverageCandidate => {
        const profileColumn = dataset.profile?.columns.find(
          (column) => column.columnName === fieldName,
        );
        const confidence =
          mapping.status === "ambiguous"
            ? Math.min(0.68, mapping.confidence)
            : Math.max(0, Math.min(1, mapping.confidence - index * 0.24));
        return {
          datasetId: dataset.id,
          datasetName: dataset.name,
          columnName: fieldName,
          inferredType: profileColumn?.inferredType ?? inferBasicType(rows, fieldName),
          missingPercentage:
            profileColumn?.missingPercentage ?? calculateMissingPercentage(rows, fieldName),
          confidence: roundConfidence(confidence),
          rationale:
            mapping.status === "ambiguous"
              ? `Form mapping needs review before using this field for ${rule.label.toLowerCase()}.`
              : `Form mapping links this field to ${rule.label.toLowerCase()}.`,
        };
      }),
    );
}

function evidenceCandidatesForDataset(
  dataset: Dataset,
  rule: EvidenceRule,
): EvidenceCoverageCandidate[] {
  const rows = dataset.data ?? [];
  const columns =
    dataset.profile?.columns.map((column) => column.columnName) ??
    dataset.columns ??
    Object.keys(rows[0] ?? {});

  return columns.flatMap((columnName) => {
    const profileColumn = dataset.profile?.columns.find(
      (column) => column.columnName === columnName,
    );
    const confidence = evidenceConfidence(columnName, profileColumn?.inferredType, profileColumn?.missingPercentage, rule);
    if (confidence < 0.42) return [];
    const missingPercentage =
      profileColumn?.missingPercentage ?? calculateMissingPercentage(rows, columnName);
    const inferredType = profileColumn?.inferredType ?? inferBasicType(rows, columnName);
    const matchedTerms = rule.strongTerms.filter((term) =>
      normalizeLabel(columnName).includes(normalizeLabel(term)),
    );

    return [
      {
        datasetId: dataset.id,
        datasetName: dataset.name,
        columnName,
        inferredType,
        missingPercentage,
        confidence,
        rationale:
          matchedTerms.length > 0
            ? `Column name matches ${matchedTerms.slice(0, 3).join(", ")} and has ${missingPercentage}% missing values.`
            : `Column name pattern suggests ${rule.label.toLowerCase()} and has ${missingPercentage}% missing values.`,
      },
    ];
  });
}

function uniqueEvidenceCandidate(
  candidate: EvidenceCoverageCandidate,
  index: number,
  candidates: EvidenceCoverageCandidate[],
) {
  return (
    candidates.findIndex(
      (item) =>
        item.datasetId === candidate.datasetId &&
        item.columnName === candidate.columnName,
    ) === index
  );
}

function evidenceConfidence(
  columnName: string,
  inferredType: string | undefined,
  missingPercentage: number | undefined,
  rule: EvidenceRule,
) {
  const normalizedColumn = normalizeLabel(columnName);
  const matchedTermCount = rule.strongTerms.filter((term) =>
    normalizedColumn.includes(normalizeLabel(term)),
  ).length;
  const patternMatch = rule.patterns.some((pattern) => pattern.test(columnName));
  if (!patternMatch && matchedTermCount === 0) return 0;

  const missing = Math.max(0, Math.min(100, missingPercentage ?? 0));
  const completenessScore = (100 - missing) / 100;
  const typeScore =
    inferredType && rule.usefulTypes.includes(inferredType)
      ? 0.14
      : inferredType === "unknown"
        ? 0.02
        : 0;
  const exactLabelBoost = normalizedColumn.includes(normalizeLabel(rule.label))
    ? 0.18
    : 0;
  const importantTermBoost = matchedTermCount > 0
    ? Math.min(0.34, 0.16 + matchedTermCount * 0.06)
    : 0;
  const patternBoost = patternMatch ? 0.3 : 0;

  return roundConfidence(
    Math.min(
      0.99,
      patternBoost + importantTermBoost + exactLabelBoost + typeScore + completenessScore * 0.18,
    ),
  );
}

function sourceConfidenceForCoverage(evidenceCoverage: EvidenceCoverageSummary) {
  if (evidenceCoverage.missingCount > 0) return "low";
  if (evidenceCoverage.ambiguousCount > 0) return "medium";
  const confidences = evidenceCoverage.items.flatMap((item) =>
    item.candidates.slice(0, 1).map((candidate) => candidate.confidence),
  );
  if (confidences.length === 0) return "unknown";
  const average =
    confidences.reduce((sum, confidence) => sum + confidence, 0) /
    confidences.length;
  if (average >= 0.78) return "high";
  if (average >= 0.62) return "medium";
  return "low";
}

function sourceConfidenceRationale(evidenceCoverage: EvidenceCoverageSummary) {
  if (evidenceCoverage.missingCount > 0) {
    return `${evidenceCoverage.missingCount} required evidence signal${evidenceCoverage.missingCount === 1 ? "" : "s"} are missing.`;
  }
  if (evidenceCoverage.ambiguousCount > 0) {
    return `${evidenceCoverage.ambiguousCount} evidence signal${evidenceCoverage.ambiguousCount === 1 ? "" : "s"} need reviewer selection.`;
  }
  return "Required evidence signals have deterministic candidates with reviewable confidence scores.";
}

function safeLearningTag(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return (FEEDBACK_TAGS as readonly string[]).includes(normalized)
    ? normalized
    : "";
}

function calculateMissingPercentage(rows: Record<string, unknown>[], columnName: string) {
  if (rows.length === 0) return 0;
  const missing = rows.filter((row) => {
    const value = row[columnName];
    return value === null || value === undefined || String(value).trim() === "";
  }).length;
  return Math.round((missing / rows.length) * 1000) / 10;
}

function inferBasicType(rows: Record<string, unknown>[], columnName: string) {
  const value = rows
    .map((row) => row[columnName])
    .find((candidate) => candidate !== null && candidate !== undefined && String(candidate).trim() !== "");
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (value instanceof Date) return "date";
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return "date";
  if (typeof value === "string") return "string";
  return "unknown";
}

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function evidenceRulesFor(requiredEvidence: string[]) {
  const normalizedRequirements = requiredEvidence.map(normalizeLabel);
  const matched = normalizedRequirements
    .map((requirement) =>
      RESPONSE_PRIORITIZATION_EVIDENCE.find((rule) => {
        const normalizedLabel = normalizeLabel(rule.label);
        return (
          requirement === normalizedLabel ||
          requirement.includes(normalizedLabel) ||
          normalizedLabel.includes(requirement)
        );
      }),
    )
    .filter((rule): rule is EvidenceRule => Boolean(rule));
  return matched.length > 0 ? matched : RESPONSE_PRIORITIZATION_EVIDENCE;
}

function normalizeLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function severityRank(severity: QualityCheckResult["severity"]) {
  return { info: 0, low: 1, medium: 2, high: 3 }[severity];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, "-").replace(/(^-|-$)/g, "") || "field";
}

function roundConfidence(value: number) {
  return Math.round(value * 100) / 100;
}
