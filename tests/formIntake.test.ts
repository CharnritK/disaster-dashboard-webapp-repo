import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildSuggestedDataCollectionTemplate, createDefaultDecisionBrief } from "@/lib/decisionContext";
import {
  createFormDatasetFromRows,
  createFormDatasetFromTemplate,
  detectFormIntakeMetadata,
  detectXlsFormSchema,
} from "@/lib/formIntake";
import { profileDataset } from "@/lib/profiling";

const ROOT = process.cwd();

describe("form intake contract", () => {
  it("creates a metadata-only form dataset from a suggested collection template", () => {
    const template = buildSuggestedDataCollectionTemplate(createDefaultDecisionBrief());

    const dataset = createFormDatasetFromTemplate(template, {
      filename: "response-prioritization-form.csv",
    });

    expect(dataset.sourceType).toBe("form");
    expect(dataset.fileType).toBe("csv");
    expect(dataset.name).toBe("response-prioritization-form");
    expect(dataset.columns).toEqual(template.fields.map((field) => field.name));
    expect(dataset.rowCount).toBe(0);
    expect(dataset.data).toEqual([]);
    expect(dataset.sampleRows).toEqual([]);
    expect(dataset.inputHints?.formFamily).toBe("suggested_template");
    expect(dataset.inputHints?.formMetadata?.privacyAudit).toMatchObject({
      metadataOnly: true,
      rawRowValuesIncluded: false,
      uploadedFileIncluded: false,
      preparedRowsIncluded: false,
      promptTextIncluded: false,
    });
    expect(dataset.inputHints?.formMetadata?.schemaSummary.fields[0]).toMatchObject({
      name: "admin_area",
      label: "Administrative area",
      evidenceNeed: "Admin geography",
      required: true,
    });
    expect(dataset.inputHints?.formMetadata?.evidenceMappings).toContainEqual(
      expect.objectContaining({
        evidenceNeed: "Admin geography",
        fieldNames: ["admin_area", "admin_code"],
        status: "mapped",
      }),
    );
  });

  it("does not include table row values in form metadata", () => {
    const rows = [
      {
        adm1_name: "#adm1+name",
        org_name: "#org+name",
        private_notes: "#meta+comment",
      },
      {
        adm1_name: "North Confidential District",
        org_name: "Sensitive Relief Partner",
        private_notes: "private water site note",
      },
    ];

    const dataset = createFormDatasetFromRows("hxl-sensitive.csv", "csv", rows);

    expect(JSON.stringify(dataset.data)).toContain("North Confidential District");
    const metadataJson = JSON.stringify(dataset.inputHints?.formMetadata);
    expect(metadataJson).toContain("#adm1+name");
    expect(metadataJson).not.toContain("North Confidential District");
    expect(metadataJson).not.toContain("Sensitive Relief Partner");
    expect(metadataJson).not.toContain("private water site note");
  });

  it("detects and strips an HXL tag row from tabular form data", () => {
    const rows = [
      {
        adm1_name: "#adm1+name",
        org_name: "#org+name",
        affected_people: "#affected+ind",
      },
      {
        adm1_name: "North",
        org_name: "Relief Team",
        affected_people: 120,
      },
      {
        adm1_name: "South",
        org_name: "Health Team",
        affected_people: 80,
      },
    ];

    const dataset = createFormDatasetFromRows("hxl-response.csv", "csv", rows);
    const metadata = dataset.inputHints?.formMetadata;

    expect(dataset.rowCount).toBe(2);
    expect(dataset.data?.[0]).toMatchObject({ adm1_name: "North" });
    expect(metadata?.detection).toMatchObject({
      family: "hxl",
      status: "detected",
      hxlTagRowIndex: 0,
      strippedHxlTagRow: true,
    });
    expect(metadata?.schemaSummary.fields).toContainEqual(
      expect.objectContaining({
        name: "affected_people",
        hxlTag: "#affected+ind",
      }),
    );
  });

  it("detects OCHA 3W/5W-style table headers", () => {
    const metadata = detectFormIntakeMetadata([
      {
        Who: "Water Cluster Partner",
        What: "Water trucking",
        Where: "North District",
        When: "2026-06-01",
        "For Whom": "Affected households",
      },
    ]);

    expect(metadata.detection).toMatchObject({
      family: "ocha_5w",
      status: "detected",
    });
    expect(metadata.schemaSummary.fields.map((field) => field.name)).toEqual([
      "Who",
      "What",
      "Where",
      "When",
      "For Whom",
    ]);
    expect(metadata.evidenceMappings).toContainEqual(
      expect.objectContaining({
        evidenceNeed: "Admin geography",
        fieldNames: ["Where"],
        status: "mapped",
      }),
    );
  });

  it("summarizes XLSForm-like survey, choices, and settings schema rows", () => {
    const metadata = detectXlsFormSchema({
      survey: [
        {
          type: "text",
          name: "admin_area",
          label: "Administrative area",
          required: "yes",
        },
        {
          type: "select_one yes_no",
          name: "needs_water",
          label: "Needs water support",
          required: "no",
        },
      ],
      choices: [
        { list_name: "yes_no", name: "yes", label: "Yes - private option label" },
        { list_name: "yes_no", name: "no", label: "No - private option label" },
      ],
      settings: [{ form_title: "Sensitive rapid needs survey", form_id: "sensitive_form_id" }],
    });

    expect(metadata.detection).toMatchObject({
      family: "xlsform",
      status: "detected",
    });
    expect(metadata.schemaSummary).toMatchObject({
      fieldCount: 2,
      requiredFieldCount: 1,
      choiceListCount: 1,
      settingCount: 1,
    });
    expect(metadata.schemaSummary.fields).toContainEqual(
      expect.objectContaining({
        name: "needs_water",
        label: "Needs water support",
        type: "select_one yes_no",
        choiceListName: "yes_no",
      }),
    );
    const metadataJson = JSON.stringify(metadata);
    expect(metadataJson).not.toContain("Yes - private option label");
    expect(metadataJson).not.toContain("Sensitive rapid needs survey");
    expect(metadataJson).not.toContain("sensitive_form_id");
  });

  it("marks weak tables as review_needed instead of overclaiming detection", () => {
    const metadata = detectFormIntakeMetadata([{ notes: "needs follow-up", value: "maybe" }]);

    expect(metadata.detection.status).toBe("review_needed");
    expect(metadata.detection.family).toBe("generic_table");
    expect(metadata.detection.confidence).toBeLessThan(0.5);
    expect(metadata.caveats.length).toBeGreaterThan(0);
  });

  it("keeps generated form datasets compatible with profiling", () => {
    const template = buildSuggestedDataCollectionTemplate(createDefaultDecisionBrief());
    const dataset = createFormDatasetFromTemplate(template, {
      filename: "profile-compatible-form.csv",
    });

    const profile = profileDataset(dataset);

    expect(profile.datasetId).toBe(dataset.id);
    expect(profile.rowCount).toBe(0);
    expect(profile.columnCount).toBe(template.fields.length);
    expect(profile.columns.map((column) => column.columnName)).toEqual(dataset.columns);
    expect(profile.inputHints?.formMetadata?.schemaSummary.fieldCount).toBe(template.fields.length);
  });

  it("keeps form-aware intake hidden from public sample-only demo upload", () => {
    const workflowSource = readFileSync(
      join(ROOT, "components", "WorkflowComponents.tsx"),
      "utf8",
    );

    expect(workflowSource).toMatch(
      /!\s*sampleOnly\s*\?\s*\([\s\S]*<FormIntakeReviewPanel/,
    );
    expect(workflowSource).toMatch(
      /!\s*sampleOnly\s*&&\s*\([\s\S]*<label className="primary-action compact">/,
    );
    expect(workflowSource).toContain("DEMO_SAMPLE_ONLY_COPY");
  });
});
