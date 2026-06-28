import { afterEach, describe, expect, it, vi } from "vitest";

import { POST as postSchemaInterpretRoute } from "@/app/api/form-schema/interpret/route";
import { TEST_USER_HEADER } from "@/lib/auth/requestAuth";
import {
  getEntitlementService,
  resetEntitlementServiceForTests,
} from "@/lib/entitlement";
import { parseSchemaInterpretationRequest } from "@/lib/formSchemaInterpretation";

afterEach(() => {
  resetEntitlementServiceForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("form schema interpretation API", () => {
  it("returns deterministic schema-only interpretation without AI", async () => {
    const response = await postSchemaInterpretRoute(schemaRequest(schemaBody()));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      mappings: [
        expect.objectContaining({
          evidenceNeed: "Geography",
          fieldName: "district_code",
        }),
        expect.objectContaining({
          evidenceNeed: "Needs",
          fieldName: "need_type",
        }),
      ],
      source: "deterministic",
    });
  });

  it("rejects row-like, sample, file, prompt, response, and geocoding payloads", () => {
    for (const unsafe of [
      { fields: [{ fieldName: "district", sampleValue: "D01" }] },
      { rows: [{ district: "D01" }] },
      { fileName: "form.xlsx" },
      { promptText: "map this" },
      { modelResponse: "official mapping" },
      { fields: [{ fieldName: "latitude", coordinate: 13.7 }] },
    ]) {
      expect(() =>
        parseSchemaInterpretationRequest({
          ...schemaBody(),
          ...unsafe,
        }),
      ).toThrow(/unsupported data/i);
    }
  });

  it("falls back unauthenticated without provider attempt", async () => {
    const response = await postSchemaInterpretRoute(
      schemaRequest({ ...schemaBody(), useLlm: true }),
    );

    await expect(response.json()).resolves.toMatchObject({
      fallbackReason: "unauthenticated",
      source: "deterministic",
    });
    expect(getEntitlementService().eventRecordsForTests()).toMatchObject([
      {
        attemptedProviderCall: false,
        fallbackReason: "unauthenticated",
        route: "/api/form-schema/interpret",
        taskType: "form_schema_interpretation",
      },
    ]);
  });

  it("does not reserve quota when AI is disabled or missing provider config", async () => {
    vi.stubEnv("LLM_ENABLED", "false");
    const response = await postSchemaInterpretRoute(
      schemaRequest({ ...schemaBody(), useLlm: true }, "analyst-1"),
    );

    await expect(response.json()).resolves.toMatchObject({
      fallbackReason: "ai_disabled",
      source: "deterministic",
    });
    await expect(getEntitlementService().getDailyUsage("analyst-1")).resolves.toMatchObject({
      used: 0,
    });
    expect(getEntitlementService().eventRecordsForTests()).toMatchObject([
      {
        attemptedProviderCall: false,
        fallbackReason: "ai_disabled",
        route: "/api/form-schema/interpret",
      },
    ]);
  });

  it("reserves quota immediately before provider attempt and returns sanitized mappings", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            mappings: [
              {
                confidenceBucket: "high",
                evidenceNeed: "Needs",
                fieldName: "need_type",
                rationale: "Label points to reported needs.",
              },
            ],
            summary: "Schema-only mapping draft.",
          }),
          status: "completed",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await postSchemaInterpretRoute(
      schemaRequest({ ...schemaBody(), useLlm: true }, "analyst-1"),
    );

    await expect(response.json()).resolves.toMatchObject({
      mappings: [
        {
          confidenceBucket: "high",
          evidenceNeed: "Needs",
          fieldName: "need_type",
        },
      ],
      source: "llm",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    await expect(getEntitlementService().getDailyUsage("analyst-1")).resolves.toMatchObject({
      used: 1,
    });
    expect(getEntitlementService().eventRecordsForTests()).toMatchObject([
      {
        attemptedProviderCall: true,
        route: "/api/form-schema/interpret",
        succeeded: true,
        taskType: "form_schema_interpretation",
      },
    ]);
  });

  it("falls back when provider output includes unsupported fields or claims", async () => {
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              mappings: [
                {
                  confidenceBucket: "high",
                  evidenceNeed: "Needs",
                  fieldName: "need_type",
                  rationale: "Use for operational approval.",
                  sampleValue: "D01",
                },
              ],
              summary: "Unsafe",
            }),
            status: "completed",
          }),
          { status: 200 },
        ),
      ),
    );

    const response = await postSchemaInterpretRoute(
      schemaRequest({ ...schemaBody(), useLlm: true }, "analyst-1"),
    );

    await expect(response.json()).resolves.toMatchObject({
      fallbackReason: "model_response_invalid",
      source: "deterministic",
    });
    expect(getEntitlementService().eventRecordsForTests()).toMatchObject([
      {
        attemptedProviderCall: true,
        fallbackReason: "model_response_invalid",
        succeeded: false,
      },
    ]);
  });
});

function schemaBody() {
  return {
    fields: [
      {
        fieldName: "district_code",
        fieldType: "text",
        label: "District code",
        required: true,
      },
      {
        fieldName: "need_type",
        fieldType: "select_one",
        label: "Primary need",
      },
    ],
    formFamily: "xlsform",
    sourceKind: "xlsform_schema",
  };
}

function schemaRequest(body: unknown, userId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (userId) headers[TEST_USER_HEADER] = userId;

  return new Request("http://localhost/api/form-schema/interpret", {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
}
