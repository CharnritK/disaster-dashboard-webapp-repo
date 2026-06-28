import { describe, expect, it } from "vitest";

import { buildConnectorSourceMetadata, summarizeConnectorStatusForRepair } from "@/lib/connectorMetadata";
import {
  buildGeocodingExtractionMetadata,
  buildOcrPdfExtractionMetadata,
  summarizeGeocodingExtractionForRepair,
  summarizeOcrPdfExtractionForRepair,
} from "@/lib/extractionMetadata";
import { buildFuzzyReviewCandidates } from "@/lib/fuzzyReview";
import { buildRepairActions } from "@/lib/repairActions";
import type { FormIntakeMetadata } from "@/types/formIntake";

describe("extended repair action sources", () => {
  it("creates repair action for weak form detection metadata", () => {
    const actions = buildRepairActions({
      formMetadata: formMetadata({
        confidence: 0.52,
        status: "review_needed",
      }),
    });

    expect(actions).toEqual([
      expect.objectContaining({
        issueType: "weak_form_detection",
        safeAutomationLevel: "suggest_only",
        severity: "review",
      }),
    ]);
  });

  it("creates connector sync repair action from metadata-only summary", () => {
    const metadata = buildConnectorSourceMetadata({
      connectorHash: "sha256:kobo-review",
      connectorRef: "conn_kobo_review",
      provider: "kobo",
      schema: { fieldCount: 8 },
      status: "error",
    });
    const actions = buildRepairActions({
      connectorSummaries: [summarizeConnectorStatusForRepair(metadata)],
    });

    expect(actions[0]).toMatchObject({
      issueType: "connector_sync_issue",
      severity: "blocker",
      safeAutomationLevel: "suggest_only",
    });
    expect(JSON.stringify(actions)).not.toMatch(/token|secret|row|submission/i);
  });

  it("creates OCR/PDF and geocoding repair actions from confidence metadata", () => {
    const ocr = summarizeOcrPdfExtractionForRepair(
      buildOcrPdfExtractionMetadata({
        confidenceBuckets: { high: 1, low: 1 },
        fieldCandidateCount: 2,
        pageCount: 1,
      }),
    );
    const geocoding = summarizeGeocodingExtractionForRepair(
      buildGeocodingExtractionMetadata({
        matchCounts: { attempted: 4, matched: 2, unmatched: 2 },
        precisionBuckets: { high: 1, low: 1 },
        provider: "mapbox",
        providerConfigVersion: "config-v1",
      }),
    );

    const actions = buildRepairActions({
      extractionSummaries: [ocr, geocoding],
    });

    expect(actions.map((action) => action.issueType)).toEqual(
      expect.arrayContaining([
        "geocoding_uncertainty",
        "ocr_pdf_confidence_issue",
      ]),
    );
    expect(JSON.stringify(actions)).not.toMatch(/address|coordinate|ocr text|pdf bytes/i);
  });

  it("creates fuzzy conflict and no-match repair actions without mutation language", () => {
    const candidates = buildFuzzyReviewCandidates({
      sourceFields: [
        { fieldName: "district", label: "District" },
        { fieldName: "missing_need" },
      ],
      targetFields: [
        { fieldName: "district_code", label: "District" },
        { fieldName: "district_name", label: "District" },
      ],
    });
    const actions = buildRepairActions({
      fuzzyReviewCandidates: candidates,
    });

    expect(actions.map((action) => action.issueType)).toEqual([
      "fuzzy_match_conflict",
      "fuzzy_match_conflict",
    ]);
    expect(actions.some((action) => action.severity === "blocker")).toBe(true);
    expect(JSON.stringify(actions)).not.toMatch(/\b(dedupe|delete|merge|recode)\b/i);
  });
});

function formMetadata(
  detection: Pick<FormIntakeMetadata["detection"], "confidence" | "status">,
): FormIntakeMetadata {
  return {
    caveats: ["Detection needs review."],
    detection: {
      caveats: ["Detection needs review."],
      confidence: detection.confidence,
      detectedSignals: ["weak_schema_signal"],
      family: "generic_table",
      fieldCount: 1,
      rowCount: 0,
      sourceKind: "tabular_rows",
      sourceType: "form",
      status: detection.status,
    },
    evidenceMappings: [],
    family: "generic_table",
    privacyAudit: {
      caveats: [],
      metadataOnly: true,
      preparedRowsIncluded: false,
      promptTextIncluded: false,
      rawRowValuesIncluded: false,
      retainedMetadata: [],
      uploadedFileIncluded: false,
    },
    schemaSummary: {
      caveats: [],
      family: "generic_table",
      fieldCount: 1,
      fields: [
        {
          caveats: [],
          name: "need_type",
          source: "column",
          status: "review_needed",
        },
      ],
      requiredFieldCount: 0,
    },
    sourceType: "form",
  };
}
