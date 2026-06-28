import { describe, expect, it } from "vitest";

import {
  FUZZY_REVIEW_OUTCOMES,
  FUZZY_REVIEW_STATUSES,
  FuzzyReviewUnsafeMetadataError,
  buildFuzzyReviewCandidates,
} from "@/lib/fuzzyReview";

describe("fuzzy review candidates", () => {
  it("marks normalized field-name matches as exact and ready", () => {
    const candidates = buildFuzzyReviewCandidates({
      sourceFields: [{ fieldName: "district_code", label: "District Code" }],
      targetFields: [{ fieldName: "DISTRICT CODE" }],
    });

    expect(candidates).toEqual([
      expect.objectContaining({
        confidence: expect.any(Number),
        outcome: "exact_match",
        sourceFieldName: "district_code",
        status: "ready",
        targetFieldName: "DISTRICT CODE",
      }),
    ]);
    expect(candidates[0].confidence).toBeGreaterThanOrEqual(0.95);
    expect(candidates[0].rationale).toMatch(/metadata/i);
  });

  it("marks semantically close labels as near matches requiring review", () => {
    const candidates = buildFuzzyReviewCandidates({
      sourceFields: [{ fieldName: "affected_people", label: "Affected people" }],
      targetFields: [{ fieldName: "affected_population", label: "Affected population" }],
    });

    expect(candidates[0]).toMatchObject({
      outcome: "near_match",
      sourceFieldName: "affected_people",
      status: "review_required",
      targetFieldName: "affected_population",
    });
    expect(candidates[0].confidence).toBeGreaterThanOrEqual(0.75);
    expect(candidates[0].confidence).toBeLessThan(0.95);
  });

  it("marks competing high-confidence targets as conflicts", () => {
    const candidates = buildFuzzyReviewCandidates({
      sourceFields: [{ fieldName: "district", label: "District" }],
      targetFields: [
        { fieldName: "district_code", label: "District" },
        { fieldName: "district_name", label: "District" },
      ],
    });

    expect(candidates[0]).toMatchObject({
      outcome: "conflict",
      sourceFieldName: "district",
      status: "review_required",
      targetFieldName: "district_code",
    });
    expect(candidates[0].conflictingTargetFieldNames).toEqual(["district_code", "district_name"]);
    expect(candidates[0].rationale).toMatch(/multiple target fields/i);
  });

  it("marks unrelated metadata as no-match without inventing a target", () => {
    const candidates = buildFuzzyReviewCandidates({
      sourceFields: [{ fieldName: "shelter_capacity", label: "Shelter capacity" }],
      targetFields: [{ fieldName: "water_points", label: "Water points" }],
    });

    expect(candidates[0]).toMatchObject({
      confidence: 0,
      outcome: "no_match",
      sourceFieldName: "shelter_capacity",
      status: "no_match",
      targetFieldName: null,
    });
  });

  it("rejects row-like, sample, secret, and nested payload metadata", () => {
    expect(() =>
      buildFuzzyReviewCandidates({
        sourceFields: [
          {
            fieldName: "district_code",
            sampleValues: ["D01"],
          },
        ],
        targetFields: [{ fieldName: "district_code" }],
      }),
    ).toThrow(FuzzyReviewUnsafeMetadataError);

    expect(() =>
      buildFuzzyReviewCandidates({
        sourceFields: [{ fieldName: "district_code" }],
        targetFields: [
          {
            fieldName: "district_code",
            metadata: { prompt: "map this column" },
          },
        ],
      }),
    ).toThrow(/fieldName and label/i);
  });

  it("does not expose mutation action language in review outputs or exported labels", () => {
    const candidates = buildFuzzyReviewCandidates({
      sourceFields: [
        { fieldName: "district_code" },
        { fieldName: "affected_people", label: "Affected people" },
      ],
      targetFields: [
        { fieldName: "district_code" },
        { fieldName: "affected_population", label: "Affected population" },
      ],
    });
    const exportedLabels = [...FUZZY_REVIEW_OUTCOMES, ...FUZZY_REVIEW_STATUSES];
    const text = JSON.stringify({ candidates, exportedLabels });

    expect(text).not.toMatch(/\b(dedupe|delete|merge|recode)\b/i);
  });
});
