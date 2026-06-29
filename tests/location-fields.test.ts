import { describe, expect, it } from "vitest";
import {
  buildEvidenceCoverageSummary,
  buildSuggestedDataCollectionTemplate,
  createDefaultDecisionBrief,
} from "@/lib/decisionContext";
import { generateDeterministicJoinRecommendations } from "@/lib/deterministicJoinRecommendations";
import { findLocationFields, isAdminCodeField } from "@/lib/locationFields";
import { profileDataset } from "@/lib/profiling";
import type { Dataset } from "@/types/dataset";

function dataset(name: string, rows: Record<string, unknown>[]): Dataset {
  return {
    id: name,
    name,
    fileType: "csv",
    sourceType: "sample",
    uploadedAt: "2026-06-29T00:00:00.000Z",
    columns: Object.keys(rows[0] ?? {}),
    data: rows,
  };
}

function withProfile(input: Dataset): Dataset {
  return { ...input, profile: profileDataset(input) };
}

describe("location field vocabulary", () => {
  it("recognizes P-code and COD-style admin code fields", () => {
    expect(isAdminCodeField("pcode")).toBe(true);
    expect(isAdminCodeField("ADM1_PCODE")).toBe(true);
    expect(isAdminCodeField("admin_code")).toBe(true);
    expect(isAdminCodeField("admin1_pcode")).toBe(true);
    expect(isAdminCodeField("cod_admin1_pcode")).toBe(true);
    expect(isAdminCodeField("district_name")).toBe(false);
  });

  it("does not use admin codes as area or display label fields", () => {
    const location = findLocationFields(
      withProfile(
        dataset("admin-codes", [
          { ADM1_PCODE: "MDG01", admin_area_code: "A01" },
          { ADM1_PCODE: "MDG02", admin_area_code: "A02" },
        ]),
      ),
    );

    expect(location.areaField).toBeUndefined();
    expect(location.labelField).toBeUndefined();
  });

  it("profiles admin codes as geographic join fields", () => {
    const profiled = withProfile(
      dataset("needs", [
        { ADM1_PCODE: "MDG01", severity_score: 9 },
        { ADM1_PCODE: "MDG02", severity_score: 5 },
      ]),
    );

    expect(profiled.profile?.potentialJoinFields).toContain("ADM1_PCODE");
    expect(profiled.profile?.potentialGeographicFields).toContain("ADM1_PCODE");
  });

  it("does not treat generic code fields as admin geography", () => {
    const profiled = withProfile(
      dataset("medical", [
        { status_code: "OPEN", procedure_code: "MED-1" },
        { status_code: "CLOSED", procedure_code: "MED-2" },
      ]),
    );
    const coverage = buildEvidenceCoverageSummary(
      [profiled],
      createDefaultDecisionBrief(),
    );

    expect(profiled.profile?.potentialJoinFields).toEqual(
      expect.arrayContaining(["status_code", "procedure_code"]),
    );
    expect(profiled.profile?.potentialGeographicFields).not.toContain("status_code");
    expect(profiled.profile?.potentialGeographicFields).not.toContain("procedure_code");
    expect(
      coverage.items.find((item) => item.evidenceNeed === "Admin geography")?.status,
    ).toBe("missing");
  });

  it("boosts deterministic joins for matching admin-code vocabularies", () => {
    const needs = withProfile(
      dataset("needs", [
        { ADM1_PCODE: "MDG01", severity_score: 9 },
        { ADM1_PCODE: "MDG02", severity_score: 5 },
      ]),
    );
    const population = withProfile(
      dataset("population", [
        { admin_code: "MDG01", affected_population: 100 },
        { admin_code: "MDG02", affected_population: 80 },
      ]),
    );

    const [join] = generateDeterministicJoinRecommendations([needs, population]);

    expect(join).toEqual(
      expect.objectContaining({
        sourceColumns: ["ADM1_PCODE"],
        targetColumns: ["admin_code"],
      }),
    );
    expect(join?.confidenceScore).toBeGreaterThan(0.9);
  });

  it("uses explicit P-code and COD language in suggested collection templates", () => {
    const template = buildSuggestedDataCollectionTemplate(createDefaultDecisionBrief());
    const adminCode = template.fields.find((field) => field.name === "admin_code");

    expect(adminCode).toEqual(
      expect.objectContaining({
        description: expect.stringContaining("P-code / COD admin code"),
        example: "MDG01",
        caveat: expect.stringContaining("COD administrative code system"),
      }),
    );
  });

  it("uses P-code and COD language in collection prompts and next actions", () => {
    const brief = createDefaultDecisionBrief();
    const coverage = buildEvidenceCoverageSummary([], brief);

    expect(
      coverage.items.find((item) => item.evidenceNeed === "Admin geography")?.nextAction,
    ).toContain("P-code / COD admin code");
  });
});
