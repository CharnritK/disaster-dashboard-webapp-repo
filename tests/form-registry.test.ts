import { afterEach, describe, expect, it } from "vitest";

import { GET as getFormRegistryRoute } from "@/app/api/form-registries/[id]/route";
import {
  GET as listFormRegistriesRoute,
  POST as postFormRegistryRoute,
} from "@/app/api/form-registries/route";
import { TEST_USER_HEADER } from "@/lib/auth/requestAuth";
import { resetMetadataDbAdapterForTests } from "@/lib/db/metadataRuntime";
import {
  createFormRegistryDraft,
  parseFormRegistryDraft,
} from "@/lib/formRegistry";

afterEach(() => {
  resetMetadataDbAdapterForTests();
});

describe("form registry metadata", () => {
  it("parses metadata-only registry drafts", () => {
    expect(parseFormRegistryDraft(registryBody())).toMatchObject({
      evidenceMappings: [
        {
          confidenceBucket: "high",
          evidenceNeed: "Needs",
          fieldName: "need_type",
          reviewStatus: "accepted",
        },
      ],
      fieldCount: 2,
      formFamily: "xlsform",
      requiredFieldCount: 1,
      sourceKind: "xlsform_schema",
    });
  });

  it("rejects row-like, sample, value, file, prompt, and response payloads", () => {
    for (const unsafe of [
      { rows: [{ district: "D01" }] },
      { fieldSummaries: [{ fieldName: "district", sampleValues: ["D01"] }] },
      { fieldSummaries: [{ fieldName: "district", rawValue: "D01" }] },
      { evidenceMappings: [{ ...mappingBody(), responseBody: "model output" }] },
      { promptText: "interpret this schema" },
      { uploadedFile: "form.xlsx" },
    ]) {
      expect(() =>
        parseFormRegistryDraft({
          ...registryBody(),
          ...unsafe,
        }),
      ).toThrow(/unsupported data|rows|values/i);
    }
  });

  it("creates listable registry, version, and reusable mapping metadata", async () => {
    const result = await createFormRegistryDraft(
      "analyst-1",
      parseFormRegistryDraft(registryBody()),
    );

    expect(result.registry).toMatchObject({
      fieldCount: 2,
      mappingCount: 1,
      ownerUserId: "analyst-1",
      visibility: "private",
    });
    expect(result.version.fieldSummaries).toEqual([
      expect.objectContaining({
        fieldName: "district_code",
      }),
      expect.objectContaining({
        fieldName: "need_type",
      }),
    ]);
    expect(result.reusableMappings).toEqual([
      expect.objectContaining({
        evidenceNeed: "Needs",
        fieldName: "need_type",
        ownerUserId: "analyst-1",
      }),
    ]);
    expect(JSON.stringify(result)).not.toMatch(/D01|raw row|prompt body|model response/i);
  });

  it("protects registry API routes and returns no-store metadata responses", async () => {
    const unauthenticated = await listFormRegistriesRoute(
      new Request("http://localhost/api/form-registries"),
    );
    expect(unauthenticated.status).toBe(401);

    const created = await postFormRegistryRoute(
      registryRequest(registryBody(), "analyst-1"),
    );
    expect(created.status).toBe(201);
    expect(created.headers.get("cache-control")).toBe("no-store");
    const createdBody = await created.json();

    const list = await listFormRegistriesRoute(
      new Request("http://localhost/api/form-registries", {
        headers: { [TEST_USER_HEADER]: "analyst-1" },
      }),
    );
    await expect(list.json()).resolves.toMatchObject({
      registries: [
        {
          id: createdBody.registry.id,
          ownerUserId: "analyst-1",
        },
      ],
    });

    const read = await getFormRegistryRoute(
      new Request(`http://localhost/api/form-registries/${createdBody.registry.id}`, {
        headers: { [TEST_USER_HEADER]: "analyst-1" },
      }),
      { params: Promise.resolve({ id: createdBody.registry.id }) },
    );
    await expect(read.json()).resolves.toMatchObject({
      registry: {
        id: createdBody.registry.id,
      },
      reusableMappings: [
        {
          evidenceNeed: "Needs",
        },
      ],
    });
  });

  it("rejects unsafe registry API payloads before persistence", async () => {
    const response = await postFormRegistryRoute(
      registryRequest(
        {
          ...registryBody(),
          evidenceMappings: [{ ...mappingBody(), sampleValue: "D01" }],
        },
        "analyst-1",
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/unsupported data/i),
    });
  });
});

function registryBody() {
  return {
    caveats: ["Mapping requires source-owner review."],
    description: "Metadata-only XLSForm registry.",
    evidenceMappings: [mappingBody()],
    fieldCount: 2,
    fieldSummaries: [
      {
        confidenceBucket: "high",
        evidenceNeed: "Geography",
        fieldName: "district_code",
        fieldType: "text",
        label: "District code",
        required: true,
        status: "ready",
      },
      {
        confidenceBucket: "high",
        evidenceNeed: "Needs",
        fieldName: "need_type",
        fieldType: "select_one",
        label: "Primary need",
        required: false,
        status: "ready",
      },
    ],
    formFamily: "xlsform",
    requiredFieldCount: 1,
    schemaFingerprint: "schema-response-priority-v1",
    sourceKind: "xlsform_schema",
    title: "Response priority form",
  };
}

function mappingBody() {
  return {
    confidenceBucket: "high",
    evidenceNeed: "Needs",
    fieldName: "need_type",
    rationale: "Field name and label match the evidence need.",
    reviewStatus: "accepted",
  };
}

function registryRequest(body: unknown, userId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (userId) headers[TEST_USER_HEADER] = userId;

  return new Request("http://localhost/api/form-registries", {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
}
