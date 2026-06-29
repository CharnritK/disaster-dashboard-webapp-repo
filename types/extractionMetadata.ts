export type ExtractionReviewState = "blocked" | "ready" | "review_needed";

export type ExtractionRepairPriority = "high" | "low" | "medium";

export type OcrPdfConfidenceBucketCounts = {
  high: number;
  low: number;
  medium: number;
  unknown: number;
};

export type OcrPdfExtractionMetadataInput = {
  caveats?: string[];
  confidenceBuckets?: Partial<OcrPdfConfidenceBucketCounts>;
  fieldCandidateCount: number;
  pageCount: number;
  reviewState?: ExtractionReviewState;
};

export type OcrPdfExtractionMetadata = {
  caveats: string[];
  confidenceBuckets: OcrPdfConfidenceBucketCounts;
  fieldCandidateCount: number;
  kind: "ocr_pdf";
  metadataOnly: true;
  pageCount: number;
  reviewOnly: true;
  reviewState: ExtractionReviewState;
};

export type GeocodingMatchCounts = {
  ambiguous: number;
  attempted: number;
  matched: number;
  reviewNeeded: number;
  unmatched: number;
};

export type GeocodingPrecisionBucketCounts = {
  high: number;
  low: number;
  medium: number;
  unknown: number;
};

export type GeocodingExtractionMetadataInput = {
  caveats?: string[];
  configVersion?: string;
  matchCounts: Partial<GeocodingMatchCounts> & Pick<GeocodingMatchCounts, "attempted">;
  precisionBuckets?: Partial<GeocodingPrecisionBucketCounts>;
  provider: string;
  providerConfigVersion?: string;
  reviewState?: ExtractionReviewState;
};

export type GeocodingExtractionMetadata = {
  caveats: string[];
  kind: "geocoding";
  matchCounts: GeocodingMatchCounts;
  metadataOnly: true;
  precisionBuckets: GeocodingPrecisionBucketCounts;
  provider: string;
  providerConfigVersion: string;
  reviewOnly: true;
  reviewState: ExtractionReviewState;
};

export type ExtractionMetadata =
  | GeocodingExtractionMetadata
  | OcrPdfExtractionMetadata;

export type ExtractionRepairSummary = {
  caveats: string[];
  kind: ExtractionMetadata["kind"];
  metricCounts: Record<string, number>;
  priority: ExtractionRepairPriority;
  reviewState: ExtractionReviewState;
  summary: string;
  title: string;
};
