import type {
  FuzzyReviewCandidate,
  FuzzyReviewFieldMetadata,
  FuzzyReviewInput,
  FuzzyReviewOutcome,
  FuzzyReviewStatus,
  FuzzyReviewUnsafeMetadataIssue,
} from "@/types/fuzzyReview";

export type {
  FuzzyReviewCandidate,
  FuzzyReviewFieldMetadata,
  FuzzyReviewInput,
  FuzzyReviewOutcome,
  FuzzyReviewStatus,
  FuzzyReviewUnsafeMetadataIssue,
} from "@/types/fuzzyReview";

export const FUZZY_REVIEW_OUTCOMES: readonly FuzzyReviewOutcome[] = [
  "exact_match",
  "near_match",
  "conflict",
  "no_match",
];

export const FUZZY_REVIEW_STATUSES: readonly FuzzyReviewStatus[] = [
  "review_required",
  "ready",
  "no_match",
];

const ALLOWED_FIELD_METADATA_KEYS = new Set(["fieldName", "label"]);
const NEAR_MATCH_THRESHOLD = 0.75;
const CONFLICT_DELTA = 0.04;
const EXACT_CONFIDENCE = 0.98;
const CANONICAL_CONFIDENCE = 0.9;

const UNSAFE_METADATA_TOKENS = new Set([
  "address",
  "addresses",
  "coordinate",
  "coordinates",
  "file",
  "files",
  "lat",
  "latitude",
  "lng",
  "lon",
  "longitude",
  "prompt",
  "prompts",
  "raw",
  "response",
  "responses",
  "row",
  "rows",
  "sample",
  "samples",
  "secret",
  "secrets",
  "token",
  "tokens",
  "value",
  "values",
]);

const CANONICAL_TOKENS = new Map([
  ["admin", "administrative"],
  ["administration", "administrative"],
  ["beneficiaries", "population"],
  ["beneficiary", "population"],
  ["code", "id"],
  ["codes", "id"],
  ["hh", "household"],
  ["households", "household"],
  ["identifier", "id"],
  ["ids", "id"],
  ["individual", "population"],
  ["individuals", "population"],
  ["people", "population"],
  ["person", "population"],
  ["persons", "population"],
  ["pop", "population"],
]);

type FieldVariant = {
  raw: string;
  normalized: string;
  canonical: string;
  tokens: string[];
};

type SafeField = FuzzyReviewFieldMetadata & {
  variants: FieldVariant[];
};

type PairScore = {
  confidence: number;
  outcome: Exclude<FuzzyReviewOutcome, "conflict" | "no_match">;
  target: SafeField;
};

export class FuzzyReviewUnsafeMetadataError extends Error {
  readonly issues: FuzzyReviewUnsafeMetadataIssue[];

  constructor(issues: FuzzyReviewUnsafeMetadataIssue[]) {
    super(
      `Unsafe fuzzy review metadata: ${issues
        .map((issue) => `${issue.path} ${issue.reason}`)
        .join("; ")}`,
    );
    this.name = "FuzzyReviewUnsafeMetadataError";
    this.issues = issues;
    Object.setPrototypeOf(this, FuzzyReviewUnsafeMetadataError.prototype);
  }
}

export function buildFuzzyReviewCandidates(input: FuzzyReviewInput): FuzzyReviewCandidate[] {
  const sourceFields = validateFieldMetadataList(input.sourceFields, "sourceFields");
  const targetFields = validateFieldMetadataList(input.targetFields, "targetFields");

  return sourceFields.map((source) => buildCandidateForSource(source, targetFields));
}

export function normalizeFuzzyReviewLabel(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function assertSafeFuzzyReviewMetadata(fields: unknown[], label: string): asserts fields is FuzzyReviewFieldMetadata[] {
  const issues = collectMetadataIssues(fields, label);
  if (issues.length > 0) {
    throw new FuzzyReviewUnsafeMetadataError(issues);
  }
}

function buildCandidateForSource(source: SafeField, targetFields: SafeField[]): FuzzyReviewCandidate {
  const scored = targetFields
    .map((target) => scoreFieldPair(source, target))
    .filter((score): score is PairScore => score.confidence >= NEAR_MATCH_THRESHOLD)
    .sort((a, b) => b.confidence - a.confidence);

  if (scored.length === 0) {
    return {
      id: `fuzzy-review-${slug(source.fieldName)}-no-match`,
      confidence: 0,
      outcome: "no_match",
      rationale: "No target field metadata was similar enough for review.",
      sourceFieldName: source.fieldName,
      sourceLabel: source.label,
      targetFieldName: null,
      status: "no_match",
    };
  }

  const [best, second] = scored;
  const conflicts = scored.filter(
    (score) =>
      score.confidence >= NEAR_MATCH_THRESHOLD &&
      best.confidence - score.confidence <= CONFLICT_DELTA,
  );

  if (conflicts.length > 1 || (second && best.confidence - second.confidence <= CONFLICT_DELTA)) {
    const targetNames = conflicts.map((score) => score.target.fieldName);
    return {
      id: `fuzzy-review-${slug(source.fieldName)}-conflict`,
      confidence: roundConfidence(best.confidence),
      outcome: "conflict",
      rationale: "Multiple target fields have similar metadata; human review is required.",
      sourceFieldName: source.fieldName,
      sourceLabel: source.label,
      targetFieldName: best.target.fieldName,
      targetLabel: best.target.label,
      conflictingTargetFieldNames: targetNames,
      status: "review_required",
    };
  }

  return {
    id: `fuzzy-review-${slug(source.fieldName)}-${slug(best.target.fieldName)}`,
    confidence: roundConfidence(best.confidence),
    outcome: best.outcome,
    rationale:
      best.outcome === "exact_match"
        ? "Field metadata names or labels normalize to the same text."
        : "Field metadata names or labels are similar enough for human review.",
    sourceFieldName: source.fieldName,
    sourceLabel: source.label,
    targetFieldName: best.target.fieldName,
    targetLabel: best.target.label,
    status: best.outcome === "exact_match" ? "ready" : "review_required",
  };
}

function validateFieldMetadataList(fields: unknown[], label: string): SafeField[] {
  assertSafeFuzzyReviewMetadata(fields, label);
  return fields.map((field) => {
    const variants = createVariants(field);
    return { ...field, variants };
  });
}

function collectMetadataIssues(fields: unknown, label: string): FuzzyReviewUnsafeMetadataIssue[] {
  const issues: FuzzyReviewUnsafeMetadataIssue[] = [];

  if (!Array.isArray(fields)) {
    return [{ path: label, reason: "must be a list of field metadata." }];
  }

  fields.forEach((field, index) => {
    const path = `${label}[${index}]`;
    if (!isPlainObject(field)) {
      issues.push({ path, reason: "must be a plain metadata object." });
      return;
    }

    for (const [key, value] of Object.entries(field)) {
      const keyPath = `${path}.${key}`;
      if (isUnsafeMetadataKey(key)) {
        issues.push({ path: keyPath, reason: "uses an unsafe metadata key." });
      }
      if (!ALLOWED_FIELD_METADATA_KEYS.has(key)) {
        issues.push({
          path: keyPath,
          reason: "is not allowed. Only fieldName and label metadata is allowed.",
        });
      }
      if (value !== null && typeof value === "object") {
        issues.push({ path: keyPath, reason: "contains a nested raw payload." });
      }
    }

    if (typeof field.fieldName !== "string" || field.fieldName.trim().length === 0) {
      issues.push({ path: `${path}.fieldName`, reason: "must be a non-empty string." });
    }
    if ("label" in field && typeof field.label !== "string") {
      issues.push({ path: `${path}.label`, reason: "must be a string when provided." });
    }
  });

  return issues;
}

function scoreFieldPair(source: SafeField, target: SafeField): PairScore {
  let best: PairScore = {
    confidence: 0,
    outcome: "near_match",
    target,
  };

  for (const sourceVariant of source.variants) {
    for (const targetVariant of target.variants) {
      if (sourceVariant.normalized === targetVariant.normalized) {
        return { confidence: EXACT_CONFIDENCE, outcome: "exact_match", target };
      }

      const confidence = scoreVariants(sourceVariant, targetVariant);
      if (confidence > best.confidence) {
        best = {
          confidence,
          outcome:
            sourceVariant.canonical === targetVariant.canonical
              ? "near_match"
              : "near_match",
          target,
        };
      }
    }
  }

  return best;
}

function scoreVariants(source: FieldVariant, target: FieldVariant): number {
  if (!source.canonical || !target.canonical) return 0;
  if (source.canonical === target.canonical) return CANONICAL_CONFIDENCE;

  const tokenScore = jaccard(source.tokens, target.tokens);
  const characterScore = diceCoefficient(source.canonical, target.canonical);
  const containmentScore =
    source.canonical.includes(target.canonical) || target.canonical.includes(source.canonical)
      ? 0.72
      : 0;

  return Math.max(tokenScore, characterScore * 0.9, containmentScore);
}

function createVariants(field: FuzzyReviewFieldMetadata): FieldVariant[] {
  const values = [field.fieldName, field.label].filter((value): value is string => Boolean(value?.trim()));
  const seen = new Set<string>();
  return values
    .map((value) => {
      const normalized = normalizeFuzzyReviewLabel(value);
      const tokens = normalized
        .split(" ")
        .filter(Boolean)
        .map((token) => CANONICAL_TOKENS.get(token) ?? token);
      const canonical = tokens.join(" ");
      return { raw: value, normalized, canonical, tokens };
    })
    .filter((variant) => {
      const key = `${variant.normalized}|${variant.canonical}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function isUnsafeMetadataKey(key: string): boolean {
  return keyTokens(key).some((token) => UNSAFE_METADATA_TOKENS.has(token));
}

function keyTokens(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function jaccard(sourceTokens: string[], targetTokens: string[]): number {
  const source = new Set(sourceTokens);
  const target = new Set(targetTokens);
  const intersection = [...source].filter((token) => target.has(token)).length;
  const union = new Set([...source, ...target]).size;
  return union === 0 ? 0 : intersection / union;
}

function diceCoefficient(source: string, target: string): number {
  if (source === target) return 1;
  if (source.length < 2 || target.length < 2) return 0;

  const sourcePairs = bigrams(source);
  const targetPairs = bigrams(target);
  let intersection = 0;
  const remainingTargetPairs = [...targetPairs];

  for (const pair of sourcePairs) {
    const targetIndex = remainingTargetPairs.indexOf(pair);
    if (targetIndex >= 0) {
      intersection += 1;
      remainingTargetPairs.splice(targetIndex, 1);
    }
  }

  return (2 * intersection) / (sourcePairs.length + targetPairs.length);
}

function bigrams(value: string): string[] {
  const compact = value.replace(/\s+/g, "");
  return Array.from({ length: Math.max(0, compact.length - 1) }, (_, index) =>
    compact.slice(index, index + 2),
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function roundConfidence(confidence: number): number {
  return Math.round(Math.max(0, Math.min(1, confidence)) * 100) / 100;
}

function slug(value: string): string {
  return normalizeFuzzyReviewLabel(value).replace(/\s+/g, "-") || "field";
}
