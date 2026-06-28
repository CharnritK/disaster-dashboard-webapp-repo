import { describe, expect, it } from "vitest";

import {
  buildGeocodingExtractionMetadata,
  buildOcrPdfExtractionMetadata,
  summarizeGeocodingExtractionForRepair,
  summarizeOcrPdfExtractionForRepair,
} from "@/lib/extractionMetadata";

describe("extraction metadata privacy boundary", () => {
  it("accepts safe OCR/PDF review-only metadata", () => {
    const metadata = buildOcrPdfExtractionMetadata({
      confidenceBuckets: {
        high: 7,
        medium: 2,
      },
      fieldCandidateCount: 9,
      pageCount: 3,
    });

    expect(metadata).toMatchObject({
      fieldCandidateCount: 9,
      kind: "ocr_pdf",
      metadataOnly: true,
      pageCount: 3,
      reviewOnly: true,
      reviewState: "ready",
    });
    expect(JSON.stringify(metadata)).not.toMatch(/household|latitude|longitude|123 Main|sk-/i);

    const summary = summarizeOcrPdfExtractionForRepair(metadata);
    expect(summary).toMatchObject({
      priority: "low",
      reviewState: "ready",
    });
    expect(summary.metricCounts).toMatchObject({
      fieldCandidateCount: 9,
      pageCount: 3,
    });
  });

  it("rejects unsafe OCR text and file bytes", () => {
    expect(() =>
      buildOcrPdfExtractionMetadata({
        confidenceBuckets: { high: 1 },
        fieldCandidateCount: 1,
        ocrText: "Full OCR text from the uploaded PDF",
        pageCount: 1,
      } as never),
    ).toThrow(/Unsafe extraction metadata key/);

    expect(() =>
      buildOcrPdfExtractionMetadata({
        confidenceBuckets: { high: 1 },
        fieldCandidateCount: 1,
        fileBytes: new Uint8Array([37, 80, 68, 70]),
        pageCount: 1,
      } as never),
    ).toThrow(/Unsafe extraction metadata key/);
  });

  it("accepts safe geocoding count and precision buckets", () => {
    const metadata = buildGeocodingExtractionMetadata({
      matchCounts: {
        attempted: 10,
        matched: 10,
      },
      precisionBuckets: {
        high: 8,
        medium: 2,
      },
      provider: "mapbox",
      providerConfigVersion: "geocode-config:v1",
    });

    expect(metadata).toMatchObject({
      kind: "geocoding",
      metadataOnly: true,
      provider: "mapbox",
      providerConfigVersion: "geocode-config:v1",
      reviewOnly: true,
      reviewState: "ready",
    });
    expect(metadata.matchCounts).toEqual({
      ambiguous: 0,
      attempted: 10,
      matched: 10,
      reviewNeeded: 0,
      unmatched: 0,
    });
    expect(metadata.precisionBuckets).toEqual({
      high: 8,
      low: 0,
      medium: 2,
      unknown: 0,
    });
  });

  it("rejects coordinates, addresses, and place names", () => {
    expect(() =>
      buildGeocodingExtractionMetadata({
        coordinates: [{ lat: 13.7563, lon: 100.5018 }],
        matchCounts: { attempted: 1, matched: 1 },
        precisionBuckets: { high: 1 },
        provider: "mapbox",
        providerConfigVersion: "geocode-config:v1",
      } as never),
    ).toThrow(/Unsafe extraction metadata key/);

    expect(() =>
      buildGeocodingExtractionMetadata({
        addresses: ["123 Main Street"],
        matchCounts: { attempted: 1, matched: 1 },
        precisionBuckets: { high: 1 },
        provider: "mapbox",
        providerConfigVersion: "geocode-config:v1",
      } as never),
    ).toThrow(/Unsafe extraction metadata key/);

    expect(() =>
      buildGeocodingExtractionMetadata({
        matchCounts: { attempted: 1, matched: 1 },
        placeNames: ["North District"],
        precisionBuckets: { high: 1 },
        provider: "mapbox",
        providerConfigVersion: "geocode-config:v1",
      } as never),
    ).toThrow(/Unsafe extraction metadata key/);
  });

  it("classifies low confidence and review states", () => {
    const ocrMetadata = buildOcrPdfExtractionMetadata({
      confidenceBuckets: {
        high: 2,
        low: 1,
      },
      fieldCandidateCount: 3,
      pageCount: 2,
    });

    expect(ocrMetadata.reviewState).toBe("review_needed");
    expect(ocrMetadata.caveats).toContain("low_ocr_confidence");

    const geocodingMetadata = buildGeocodingExtractionMetadata({
      matchCounts: {
        ambiguous: 1,
        attempted: 4,
        matched: 3,
        unmatched: 1,
      },
      precisionBuckets: {
        high: 2,
        low: 1,
      },
      provider: "nominatim",
      providerConfigVersion: "geocode-config:v2",
    });

    expect(geocodingMetadata.reviewState).toBe("review_needed");
    expect(geocodingMetadata.caveats).toEqual(
      expect.arrayContaining([
        "ambiguous_geocode_matches",
        "low_geocode_precision",
        "manual_review_required",
        "unmatched_geocode_records",
      ]),
    );

    const summary = summarizeGeocodingExtractionForRepair(geocodingMetadata);
    expect(summary).toMatchObject({
      priority: "medium",
      reviewState: "review_needed",
    });
  });
});
