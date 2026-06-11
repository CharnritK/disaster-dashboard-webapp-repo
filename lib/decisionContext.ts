import type { Dataset } from "@/types/dataset";
import type {
  DecisionBrief,
  DecisionReadinessResult,
  DecisionReadinessStatus,
  EvidenceCoverageCandidate,
  EvidenceCoverageItem,
  EvidenceCoverageStatus,
  EvidenceCoverageSummary,
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
  strongTerms: string[];
  usefulTypes: string[];
  caveat: string;
  nextAction: string;
};

const RESPONSE_PRIORITIZATION_EVIDENCE: EvidenceRule[] = [
  {
    id: "admin-geography",
    label: "Admin geography",
    patterns: [/district|admin|region|province|county|pcode|code/i],
    strongTerms: ["admin", "pcode", "district", "region", "province", "county", "code"],
    usefulTypes: ["string"],
    caveat:
      "Do not compare response priorities without a usable geographic or administrative field.",
    nextAction:
      "Add or combine a stable area name or p-code field before using rankings for action.",
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
    const candidates = datasets
      .flatMap((dataset) => evidenceCandidatesForDataset(dataset, rule))
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
      : runnerUp && top.confidence - runnerUp.confidence <= 0.18
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
          ? readinessStatusLabel(status)
          : status === "decision_unsafe"
            ? readinessStatusLabel(status)
            : readinessStatusLabel(status),
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

function roundConfidence(value: number) {
  return Math.round(value * 100) / 100;
}
