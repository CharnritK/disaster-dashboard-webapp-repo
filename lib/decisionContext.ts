import type { Dataset } from "@/types/dataset";
import type {
  DecisionBrief,
  DecisionReadinessResult,
  SuggestedCollectionField,
  SuggestedDataCollectionTemplate,
  UseCaseTemplate,
} from "@/types/decision";
import type { QualityCheckResult } from "@/types/quality";

export const RESPONSE_PRIORITIZATION_TEMPLATE: UseCaseTemplate = {
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
};

export function createDefaultDecisionBrief(): DecisionBrief {
  return {
    useCaseId: "response_prioritization",
    decisionQuestion: "Which affected districts should receive first response?",
    intendedAction: "Prioritize response teams for the next distribution cycle.",
    decisionMaker: "Emergency operations lead",
    geographyScope: "Affected districts",
    timeframe: "Next 72 hours",
    requiredEvidence: [...RESPONSE_PRIORITIZATION_TEMPLATE.requiredEvidence],
  };
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
      description: "Stable join key or p-code for the administrative area.",
      example: "D01",
      caveat: "Use the same code system across every uploaded dataset.",
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
    title: "Suggested response-prioritization data collection template",
    decisionQuestion: brief.decisionQuestion,
    intendedAction: brief.intendedAction,
    decisionMaker: brief.decisionMaker,
    geographyScope: brief.geographyScope,
    timeframe: brief.timeframe,
    fields,
  };
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

type EvidenceRule = {
  id: string;
  label: string;
  patterns: RegExp[];
  caveat: string;
};

const RESPONSE_PRIORITIZATION_EVIDENCE: EvidenceRule[] = [
  {
    id: "admin-geography",
    label: "Admin geography",
    patterns: [/district|admin|region|province|county|pcode|code/i],
    caveat:
      "Do not compare response priorities without a usable geographic or administrative field.",
  },
  {
    id: "need-severity",
    label: "Need severity",
    patterns: [/need|severity|score|priority|insecurity|damage|access/i],
    caveat:
      "Do not rank response priorities without a severity or needs signal.",
  },
  {
    id: "affected-population",
    label: "Affected population",
    patterns: [/population|people|household|assessed|affected|cases/i],
    caveat:
      "Do not rank districts by need without an affected population denominator.",
  },
  {
    id: "response-gap",
    label: "Response gap",
    patterns: [/gap|coverage|capacity|access|service|facility|center/i],
    caveat:
      "Do not treat rankings as action-ready without a response gap or capacity signal.",
  },
  {
    id: "capacity-signal",
    label: "Capacity signal",
    patterns: [/capacity|facility|clinic|center|service|market|staff/i],
    caveat:
      "Do not assign scarce resources without checking response capacity evidence.",
  },
];

export function validateDecisionBrief(brief: Partial<DecisionBrief>) {
  const missing: string[] = [];
  if (brief.useCaseId !== "response_prioritization") missing.push("use case");
  if (!brief.decisionQuestion?.trim()) missing.push("decision question");
  if (!brief.intendedAction?.trim()) missing.push("intended action");
  if (!brief.decisionMaker?.trim()) missing.push("decision-maker");
  if (!brief.geographyScope?.trim()) missing.push("geography scope");
  if (!brief.timeframe?.trim()) missing.push("timeframe");
  if (!brief.requiredEvidence?.length) missing.push("required evidence");
  return missing;
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
  const missingFindings = requiredRules
    .filter((rule) => !columns.some((column) => rule.patterns.some((pattern) => pattern.test(column))))
    .map((rule): QualityCheckResult => ({
      id: `decision-missing-${rule.id}`,
      checkType: "Decision evidence missing",
      status: "fail",
      severity: "high",
      description: `${rule.label} evidence is missing for response prioritization.`,
      decisionArea: "Response prioritization",
      evidenceNeed: rule.label,
      caveat: rule.caveat,
      suggestedAction: `Add or join a field that supports ${rule.label.toLowerCase()} before relying on this dashboard for action.`,
    }));
  const invalidValueFindings = invalidDecisionValueFindings(dataset, requiredRules);
  const blockerCount =
    missingFindings.length +
    invalidValueFindings.length +
    baseQualityResults.filter((issue) => issue.status === "fail").length;
  const reviewCount = baseQualityResults.filter((issue) => issue.status === "warning").length;
  const requiredEvidenceMissing = missingFindings
    .map((finding) => finding.evidenceNeed)
    .filter((value): value is string => Boolean(value));
  const requiredEvidenceCovered = requiredRules
    .map((rule) => rule.label)
    .filter((label) => !requiredEvidenceMissing.includes(label));
  const caveats = [
    ...missingFindings.map((finding) => finding.caveat),
    ...invalidValueFindings.map((finding) => finding.caveat),
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
          ? "Ready for response-prioritization review"
          : status === "decision_unsafe"
            ? "Decision-unsafe until reviewed"
            : "Review before acting",
      summary:
        status === "ready"
          ? "Required response-prioritization evidence was detected."
          : `${blockerCount} blocker${blockerCount === 1 ? "" : "s"} and ${reviewCount} review item${reviewCount === 1 ? "" : "s"} affect this decision.`,
      caveats,
      blockerCount,
      reviewCount,
      requiredEvidenceCovered,
      requiredEvidenceMissing,
    },
    qualityResults: [...baseQualityResults, ...missingFindings, ...invalidValueFindings].sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity),
    ),
  };
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
    for (const column of columns.filter((candidate) =>
      affectedPopulationRule.patterns.some((pattern) => pattern.test(candidate)),
    )) {
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
    for (const column of columns.filter((candidate) =>
      /percent|percentage|rate/i.test(candidate) &&
      responseGapRule.patterns.some((pattern) => pattern.test(candidate)),
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

function numericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function evidenceRulesFor(requiredEvidence: string[]) {
  const normalizedRequirements = requiredEvidence.map(normalizeLabel);
  const matched = RESPONSE_PRIORITIZATION_EVIDENCE.filter((rule) => {
    const normalizedLabel = normalizeLabel(rule.label);
    return normalizedRequirements.some(
      (requirement) =>
        requirement === normalizedLabel ||
        requirement.includes(normalizedLabel) ||
        normalizedLabel.includes(requirement),
    );
  });
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
