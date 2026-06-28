import type {
  ExtractionRepairPriority,
  ExtractionRepairSummary,
  ExtractionReviewState,
  GeocodingExtractionMetadata,
  GeocodingExtractionMetadataInput,
  GeocodingMatchCounts,
  GeocodingPrecisionBucketCounts,
  OcrPdfConfidenceBucketCounts,
  OcrPdfExtractionMetadata,
  OcrPdfExtractionMetadataInput,
} from "@/types/extractionMetadata";

const OCR_CONFIDENCE_BUCKETS = ["high", "medium", "low", "unknown"] as const;
const GEOCODING_MATCH_COUNT_KEYS = [
  "attempted",
  "matched",
  "unmatched",
  "ambiguous",
  "reviewNeeded",
] as const;
const GEOCODING_PRECISION_BUCKETS = ["high", "medium", "low", "unknown"] as const;

const OCR_METADATA_KEYS = new Set([
  "caveats",
  "confidenceBuckets",
  "fieldCandidateCount",
  "kind",
  "metadataOnly",
  "pageCount",
  "reviewOnly",
  "reviewState",
]);
const GEOCODING_METADATA_KEYS = new Set([
  "caveats",
  "configVersion",
  "kind",
  "matchCounts",
  "metadataOnly",
  "precisionBuckets",
  "provider",
  "providerConfigVersion",
  "reviewOnly",
  "reviewState",
]);
const ALLOWED_CAVEATS = new Set([
  "ambiguous",
  "ambiguous_geocode_matches",
  "blocked",
  "bucket_count_mismatch",
  "confidence_bucket_mismatch",
  "field_candidates_unavailable",
  "geocode_attempt_count_unavailable",
  "geocode_provider_config_review",
  "large_document",
  "low_confidence",
  "low_geocode_match_rate",
  "low_geocode_precision",
  "low_ocr_confidence",
  "low_precision",
  "manual_review",
  "manual_review_required",
  "metadata_only",
  "mixed_ocr_confidence",
  "no_field_candidates",
  "no_geocode_matches",
  "page_count_unavailable",
  "provider_config_review",
  "review_needed",
  "unknown_confidence",
  "unmatched",
  "unmatched_geocode_records",
]);

const UNSAFE_KEY_PATTERN =
  /(?:^|[_:.-])(pdf|image|screenshot|file|files|byte|bytes|buffer|blob|base64|ocr|ocrtext|text|content|row|rows|record|records|coordinate|coordinates|lat|latitude|lon|lng|longitude|address|addresses|place|places|placename|placenames|raw|value|values|prompt|prompts|response|responses|modelresponse|modelresponses|token|tokens|secret|secrets|password|apikey|api_key|privatekey|private_key)(?:$|[_:.-])/i;
const UNSAFE_VALUE_PATTERNS = [
  /^%PDF-/i,
  /^data:(?:application\/pdf|image\/)/i,
  /\b-?\d{1,2}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}\b/,
  /\b(?:lat|latitude|lon|lng|longitude)\s*[:=]/i,
  /\b\d{1,6}\s+[A-Za-z0-9 .'#-]+(?:street|st\.?|road|rd\.?|avenue|ave\.?|lane|ln\.?|drive|dr\.?|boulevard|blvd\.?|highway|hwy)\b/i,
  /-----BEGIN [A-Z ]*(?:PRIVATE )?KEY-----/i,
  /\b(?:api[_-]?key|token|secret|password)\s*[:=]/i,
  /\bsk-[A-Za-z0-9_-]{12,}\b/,
  /^[A-Za-z0-9+/]{400,}={0,2}$/,
];

export function buildOcrPdfExtractionMetadata(
  input: OcrPdfExtractionMetadataInput,
): OcrPdfExtractionMetadata {
  assertSafeObjectShape(input, OCR_METADATA_KEYS, "ocr_pdf metadata");
  assertSystemFlags(input, "ocr_pdf");

  const pageCount = nonNegativeInteger(input.pageCount, "pageCount");
  const fieldCandidateCount = nonNegativeInteger(
    input.fieldCandidateCount,
    "fieldCandidateCount",
  );
  const confidenceBuckets = normalizeCountBuckets(
    input.confidenceBuckets ?? {},
    OCR_CONFIDENCE_BUCKETS,
    "confidenceBuckets",
  );
  const derivedState = classifyOcrPdfReviewState({
    caveats: input.caveats,
    confidenceBuckets,
    fieldCandidateCount,
    pageCount,
  });
  const reviewState = strictestReviewState(
    derivedState,
    input.reviewState ? validateReviewState(input.reviewState) : undefined,
  );
  const caveats = normalizeCaveats([
    ...(input.caveats ?? []),
    ...ocrDerivedCaveats({
      confidenceBuckets,
      fieldCandidateCount,
      pageCount,
      reviewState,
    }),
  ]);

  return {
    caveats,
    confidenceBuckets,
    fieldCandidateCount,
    kind: "ocr_pdf",
    metadataOnly: true,
    pageCount,
    reviewOnly: true,
    reviewState,
  };
}

export function validateOcrPdfExtractionMetadata(
  input: unknown,
): OcrPdfExtractionMetadata {
  if (!isRecord(input)) {
    throw new Error("Unsafe extraction metadata payload. Use an object.");
  }

  return buildOcrPdfExtractionMetadata({
    caveats: readOptionalStringArray(input.caveats, "caveats"),
    confidenceBuckets: readOptionalRecord(input.confidenceBuckets),
    fieldCandidateCount: input.fieldCandidateCount as number,
    pageCount: input.pageCount as number,
    reviewState: input.reviewState as ExtractionReviewState | undefined,
  });
}

export function buildGeocodingExtractionMetadata(
  input: GeocodingExtractionMetadataInput,
): GeocodingExtractionMetadata {
  assertSafeObjectShape(input, GEOCODING_METADATA_KEYS, "geocoding metadata");
  assertSystemFlags(input, "geocoding");

  const provider = safeToken(input.provider, "provider");
  const providerConfigVersion = safeToken(
    input.providerConfigVersion ?? input.configVersion,
    "providerConfigVersion",
  );
  const matchCounts = normalizeMatchCounts(input.matchCounts);
  const precisionBuckets = normalizeCountBuckets(
    input.precisionBuckets ?? {},
    GEOCODING_PRECISION_BUCKETS,
    "precisionBuckets",
  );
  const derivedState = classifyGeocodingReviewState({
    caveats: input.caveats,
    matchCounts,
    precisionBuckets,
  });
  const reviewState = strictestReviewState(
    derivedState,
    input.reviewState ? validateReviewState(input.reviewState) : undefined,
  );
  const caveats = normalizeCaveats([
    ...(input.caveats ?? []),
    ...geocodingDerivedCaveats({ matchCounts, precisionBuckets, reviewState }),
  ]);

  return {
    caveats,
    kind: "geocoding",
    matchCounts,
    metadataOnly: true,
    precisionBuckets,
    provider,
    providerConfigVersion,
    reviewOnly: true,
    reviewState,
  };
}

export function validateGeocodingExtractionMetadata(
  input: unknown,
): GeocodingExtractionMetadata {
  if (!isRecord(input)) {
    throw new Error("Unsafe extraction metadata payload. Use an object.");
  }

  return buildGeocodingExtractionMetadata({
    caveats: readOptionalStringArray(input.caveats, "caveats"),
    configVersion: input.configVersion as string | undefined,
    matchCounts: readOptionalRecord(input.matchCounts) as GeocodingExtractionMetadataInput["matchCounts"],
    precisionBuckets: readOptionalRecord(input.precisionBuckets),
    provider: input.provider as string,
    providerConfigVersion: input.providerConfigVersion as string | undefined,
    reviewState: input.reviewState as ExtractionReviewState | undefined,
  });
}

export function classifyOcrPdfReviewState(input: {
  caveats?: string[];
  confidenceBuckets: OcrPdfConfidenceBucketCounts;
  fieldCandidateCount: number;
  pageCount: number;
}): ExtractionReviewState {
  const confidenceTotal = bucketTotal(input.confidenceBuckets);
  if (input.pageCount < 1 || input.fieldCandidateCount < 1) {
    return "blocked";
  }

  if (
    input.confidenceBuckets.low > 0 ||
    input.confidenceBuckets.unknown > 0 ||
    confidenceTotal !== input.fieldCandidateCount ||
    input.caveats?.some((caveat) =>
      ["blocked", "low_confidence", "low_ocr_confidence", "manual_review", "manual_review_required", "review_needed"].includes(caveat),
    )
  ) {
    return "review_needed";
  }

  return "ready";
}

export function classifyGeocodingReviewState(input: {
  caveats?: string[];
  matchCounts: GeocodingMatchCounts;
  precisionBuckets: GeocodingPrecisionBucketCounts;
}): ExtractionReviewState {
  if (input.matchCounts.attempted < 1 || input.matchCounts.matched < 1) {
    return "blocked";
  }

  if (
    input.matchCounts.unmatched > 0 ||
    input.matchCounts.ambiguous > 0 ||
    input.matchCounts.reviewNeeded > 0 ||
    input.precisionBuckets.low > 0 ||
    input.precisionBuckets.unknown > 0 ||
    input.caveats?.some((caveat) =>
      ["ambiguous", "blocked", "low_precision", "manual_review", "manual_review_required", "review_needed", "unmatched"].includes(caveat),
    )
  ) {
    return "review_needed";
  }

  return "ready";
}

export function summarizeOcrPdfExtractionForRepair(
  metadata: OcrPdfExtractionMetadata,
): ExtractionRepairSummary {
  const lowOrUnknown =
    metadata.confidenceBuckets.low + metadata.confidenceBuckets.unknown;

  return {
    caveats: metadata.caveats,
    kind: "ocr_pdf",
    metricCounts: {
      fieldCandidateCount: metadata.fieldCandidateCount,
      lowOrUnknownConfidenceCount: lowOrUnknown,
      pageCount: metadata.pageCount,
    },
    priority: priorityForReviewState(metadata.reviewState),
    reviewState: metadata.reviewState,
    summary: `${metadata.fieldCandidateCount} field candidates across ${metadata.pageCount} pages; ${lowOrUnknown} low or unknown confidence candidates.`,
    title:
      metadata.reviewState === "ready"
        ? "OCR/PDF metadata ready"
        : "Review OCR/PDF extraction metadata",
  };
}

export function summarizeGeocodingExtractionForRepair(
  metadata: GeocodingExtractionMetadata,
): ExtractionRepairSummary {
  const lowOrUnknown = metadata.precisionBuckets.low + metadata.precisionBuckets.unknown;

  return {
    caveats: metadata.caveats,
    kind: "geocoding",
    metricCounts: {
      ambiguous: metadata.matchCounts.ambiguous,
      attempted: metadata.matchCounts.attempted,
      lowOrUnknownPrecisionCount: lowOrUnknown,
      matched: metadata.matchCounts.matched,
      unmatched: metadata.matchCounts.unmatched,
    },
    priority: priorityForReviewState(metadata.reviewState),
    reviewState: metadata.reviewState,
    summary: `${metadata.matchCounts.matched} of ${metadata.matchCounts.attempted} geocoding attempts matched; ${lowOrUnknown} low or unknown precision matches.`,
    title:
      metadata.reviewState === "ready"
        ? "Geocoding metadata ready"
        : "Review geocoding metadata",
  };
}

export const buildOcrPdfMetadata = buildOcrPdfExtractionMetadata;
export const validateOcrPdfMetadata = validateOcrPdfExtractionMetadata;
export const summarizeOcrPdfMetadataForRepair = summarizeOcrPdfExtractionForRepair;

export const buildGeocodingMetadata = buildGeocodingExtractionMetadata;
export const validateGeocodingMetadata = validateGeocodingExtractionMetadata;
export const summarizeGeocodingMetadataForRepair =
  summarizeGeocodingExtractionForRepair;

function normalizeMatchCounts(
  input: GeocodingExtractionMetadataInput["matchCounts"],
): GeocodingMatchCounts {
  assertSafeObjectShape(input, new Set(GEOCODING_MATCH_COUNT_KEYS), "matchCounts");
  const matchCounts = normalizeCountBuckets(
    input,
    GEOCODING_MATCH_COUNT_KEYS,
    "matchCounts",
  );

  if (
    matchCounts.matched + matchCounts.unmatched > matchCounts.attempted ||
    matchCounts.ambiguous > matchCounts.attempted ||
    matchCounts.reviewNeeded > matchCounts.attempted
  ) {
    throw new Error("Unsafe extraction metadata value for matchCounts. Counts exceed attempted total.");
  }

  return matchCounts;
}

function normalizeCountBuckets<const T extends readonly string[]>(
  input: Partial<Record<T[number], unknown>>,
  keys: T,
  path: string,
): Record<T[number], number> {
  if (!isRecord(input)) {
    throw new Error(`Unsafe extraction metadata value for ${path}. Use count buckets only.`);
  }
  assertSafeObjectShape(input, new Set(keys), path);

  return Object.fromEntries(
    keys.map((key) => {
      const bucketKey = key as T[number];
      return [
        bucketKey,
        nonNegativeInteger(input[bucketKey], `${path}.${bucketKey}`, 0),
      ];
    }),
  ) as Record<T[number], number>;
}

function ocrDerivedCaveats(input: {
  confidenceBuckets: OcrPdfConfidenceBucketCounts;
  fieldCandidateCount: number;
  pageCount: number;
  reviewState: ExtractionReviewState;
}) {
  const caveats: string[] = [];
  const total = bucketTotal(input.confidenceBuckets);
  if (input.pageCount < 1) caveats.push("page_count_unavailable");
  if (input.fieldCandidateCount < 1) caveats.push("no_field_candidates");
  if (input.confidenceBuckets.low > 0) caveats.push("low_ocr_confidence");
  if (input.confidenceBuckets.unknown > 0) caveats.push("unknown_confidence");
  if (total !== input.fieldCandidateCount) {
    caveats.push("confidence_bucket_mismatch");
  }
  if (input.reviewState !== "ready") caveats.push("manual_review_required");
  return caveats;
}

function geocodingDerivedCaveats(input: {
  matchCounts: GeocodingMatchCounts;
  precisionBuckets: GeocodingPrecisionBucketCounts;
  reviewState: ExtractionReviewState;
}) {
  const caveats: string[] = [];
  if (input.matchCounts.attempted < 1) {
    caveats.push("geocode_attempt_count_unavailable");
  }
  if (input.matchCounts.attempted > 0 && input.matchCounts.matched < 1) {
    caveats.push("no_geocode_matches");
  }
  if (input.matchCounts.unmatched > 0) {
    caveats.push("unmatched_geocode_records");
  }
  if (input.matchCounts.ambiguous > 0) {
    caveats.push("ambiguous_geocode_matches");
  }
  if (input.precisionBuckets.low > 0 || input.precisionBuckets.unknown > 0) {
    caveats.push("low_geocode_precision");
  }
  if (input.reviewState !== "ready") caveats.push("manual_review_required");
  return caveats;
}

function normalizeCaveats(caveats: string[]) {
  const normalized = caveats.map((caveat, index) => {
    const value = safeToken(caveat, `caveats.${index}`);
    if (!ALLOWED_CAVEATS.has(value)) {
      throw new Error(`Unsafe extraction metadata caveat: ${value}`);
    }
    return value;
  });
  return [...new Set(normalized)].slice(0, 12);
}

function assertSafeObjectShape(
  value: unknown,
  allowedKeys: Set<string>,
  path: string,
) {
  if (!isRecord(value)) {
    throw new Error(`Unsafe extraction metadata value for ${path}. Use an object.`);
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedPath = `${path}.${key}`;
    if (!allowedKeys.has(key) || UNSAFE_KEY_PATTERN.test(key)) {
      throw new Error(`Unsafe extraction metadata key: ${nestedPath}`);
    }
    assertSafeMetadataValue(nestedValue, nestedPath);
  }
}

function assertSafeMetadataValue(value: unknown, path: string) {
  if (
    value instanceof ArrayBuffer ||
    value instanceof DataView ||
    ArrayBuffer.isView(value)
  ) {
    throw new Error(`Unsafe extraction metadata value for ${path}. File bytes are not allowed.`);
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    throw new Error(`Unsafe extraction metadata value for ${path}. File bytes are not allowed.`);
  }

  if (typeof File !== "undefined" && value instanceof File) {
    throw new Error(`Unsafe extraction metadata value for ${path}. Files are not allowed.`);
  }

  if (typeof value === "string") {
    if (UNSAFE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      throw new Error(`Unsafe extraction metadata value for ${path}. Raw or sensitive values are not allowed.`);
    }
    return;
  }

  if (
    value == null ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertSafeMetadataValue(item, `${path}.${index}`);
    });
    return;
  }

  if (isRecord(value)) return;

  throw new Error(`Unsafe extraction metadata value for ${path}.`);
}

function safeToken(value: unknown, path: string) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_.:-]{1,80}$/.test(value)) {
    throw new Error(`Unsafe extraction metadata value for ${path}. Use a safe token.`);
  }

  assertSafeMetadataValue(value, path);
  return value;
}

function nonNegativeInteger(value: unknown, path: string, defaultValue?: number) {
  if (value == null && defaultValue !== undefined) return defaultValue;
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`Unsafe extraction metadata value for ${path}. Use a non-negative integer.`);
  }
  return value as number;
}

function validateReviewState(value: unknown): ExtractionReviewState {
  if (value === "blocked" || value === "ready" || value === "review_needed") {
    return value;
  }
  throw new Error("Unsafe extraction metadata value for reviewState.");
}

function assertSystemFlags(value: unknown, kind: "geocoding" | "ocr_pdf") {
  if (!isRecord(value)) return;
  if (value.kind !== undefined && value.kind !== kind) {
    throw new Error("Unsafe extraction metadata value for kind.");
  }
  if (value.metadataOnly !== undefined && value.metadataOnly !== true) {
    throw new Error("Unsafe extraction metadata value for metadataOnly.");
  }
  if (value.reviewOnly !== undefined && value.reviewOnly !== true) {
    throw new Error("Unsafe extraction metadata value for reviewOnly.");
  }
}

function strictestReviewState(
  derivedState: ExtractionReviewState,
  suppliedState?: ExtractionReviewState,
): ExtractionReviewState {
  if (!suppliedState) return derivedState;
  return reviewSeverity(suppliedState) > reviewSeverity(derivedState)
    ? suppliedState
    : derivedState;
}

function reviewSeverity(reviewState: ExtractionReviewState) {
  if (reviewState === "blocked") return 2;
  if (reviewState === "review_needed") return 1;
  return 0;
}

function bucketTotal(buckets: Record<string, number>) {
  return Object.values(buckets).reduce((sum, value) => sum + value, 0);
}

function priorityForReviewState(
  reviewState: ExtractionReviewState,
): ExtractionRepairPriority {
  if (reviewState === "blocked") return "high";
  if (reviewState === "review_needed") return "medium";
  return "low";
}

function readOptionalRecord(value: unknown) {
  if (value === undefined) return undefined;
  if (isRecord(value)) return value;
  throw new Error("Unsafe extraction metadata value. Use an object.");
}

function readOptionalStringArray(value: unknown, path: string) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Unsafe extraction metadata value for ${path}. Use safe caveat tokens.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
