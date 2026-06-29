import { afterEach, describe, expect, it } from "vitest";

import { PATCH as patchTemplateRoute } from "@/app/api/templates/[id]/route";
import { GET as getTemplatesRoute, POST as postTemplatesRoute } from "@/app/api/templates/route";
import { TEST_USER_HEADER } from "@/lib/auth/requestAuth";
import {
  getMetadataDbAdapter,
  resetMetadataDbAdapterForTests,
} from "@/lib/db/metadataRuntime";
import { parseTemplateDraft } from "@/lib/templates";

afterEach(() => {
  resetMetadataDbAdapterForTests();
});

describe("template API", () => {
  it("requires auth", async () => {
    await expect(
      getTemplatesRoute(new Request("http://localhost/api/templates")),
    ).resolves.toMatchObject({ status: 401 });

    await expect(
      postTemplatesRoute(templateRequest(templateBody())),
    ).resolves.toMatchObject({ status: 401 });

    await expect(
      patchTemplateRoute(templateRequest({ title: "Updated template" }), {
        params: Promise.resolve({ id: "template-1" }),
      }),
    ).resolves.toMatchObject({ status: 401 });
  });

  it("creates and updates private draft templates", async () => {
    const created = await postTemplatesRoute(templateRequest(templateBody(), "analyst-1"));
    expect(created.status).toBe(201);
    const createdBody = await created.json();

    expect(createdBody.template).toMatchObject({
      ownerUserId: "analyst-1",
      status: "draft",
      visibility: "private",
    });

    const patched = await patchTemplateRoute(
      templateRequest({ title: "Updated template" }, "analyst-1"),
      { params: Promise.resolve({ id: createdBody.template.id }) },
    );
    expect(patched.status).toBe(200);
    await expect(patched.json()).resolves.toMatchObject({
      template: {
        title: "Updated template",
      },
    });
  });

  it("lists only the caller's private drafts and reviewed templates", async () => {
    const adapter = getMetadataDbAdapter();
    await adapter.createCustomTemplate({
      ownerUserId: "analyst-1",
      title: "Analyst private draft",
      visibility: "private",
    });
    await adapter.createCustomTemplate({
      ownerUserId: "analyst-2",
      title: "Other private draft",
      visibility: "private",
    });
    await adapter.createCustomTemplate({
      ownerUserId: "reviewer-1",
      status: "reviewed",
      title: "Reviewed shared template",
      visibility: "reviewed",
    });

    const response = await getTemplatesRoute(authenticatedRequest("analyst-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.templates.map((template: { title: string }) => template.title)).toEqual(
      expect.arrayContaining(["Analyst private draft", "Reviewed shared template"]),
    );
    expect(body.templates.map((template: { title: string }) => template.title)).not.toContain(
      "Other private draft",
    );
  });

  it("rejects example row-like schema content", () => {
    expect(() =>
      parseTemplateDraft({
        ...templateBody(),
        exampleDataSchema: {
          sampleValue: "D01",
        },
      }),
    ).toThrow(/example rows or values/i);
  });

  it("rejects value-shaped example schema content while allowing type labels", () => {
    expect(() =>
      parseTemplateDraft({
        ...templateBody(),
        exampleDataSchema: {
          admin_code: "string",
          affected_population: "number",
          verified: "boolean",
        },
      }),
    ).not.toThrow();

    expect(() =>
      parseTemplateDraft({
        ...templateBody(),
        exampleDataSchema: {
          admin_code: "D01",
        },
      }),
    ).toThrow(/schema metadata/i);
  });

  it("rejects row-like suggested field metadata", () => {
    expect(() =>
      parseTemplateDraft({
        ...templateBody(),
        suggestedFields: [
          {
            field_name: "district_code",
            role: "join_key",
            sampleValue: "D01",
          },
        ],
      }),
    ).toThrow(/example rows or values/i);

    expect(() =>
      parseTemplateDraft({
        ...templateBody(),
        suggestedFields: [
          {
            field_name: "district_code",
            role: "D01",
          },
        ],
      }),
    ).toThrow(/schema metadata/i);
  });

  it("rejects oversized template bodies before parsing", async () => {
    const response = await postTemplatesRoute(
      templateRequest(
        {
          ...templateBody(),
          description: "x".repeat(21_000),
        },
        "analyst-1",
      ),
    );

    expect(response.status).toBe(413);
  });

  it("rejects unsafe template patch content", async () => {
    const created = await postTemplatesRoute(templateRequest(templateBody(), "analyst-1"));
    const createdBody = await created.json();

    const patched = await patchTemplateRoute(
      templateRequest({ title: "District,Need\nA01,Food" }, "analyst-1"),
      { params: Promise.resolve({ id: createdBody.template.id }) },
    );

    expect(patched.status).toBe(400);
    await expect(patched.json()).resolves.toMatchObject({
      error: expect.stringMatching(/pasted data/i),
    });
  });
});

function templateBody() {
  return {
    decisionMaker: "Operations lead",
    decisionQuestion: "Which districts need support first?",
    geographyTimeframe: "District, next 72 hours",
    intendedAction: "Prioritize response",
    requiredEvidence: ["Needs", "Capacity"],
    suggestedFields: [
      {
        field_name: "district_code",
        role: "join_key",
      },
    ],
    title: "Response prioritization",
  };
}

function templateRequest(body: unknown, userId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (userId) headers[TEST_USER_HEADER] = userId;

  return new Request("http://localhost/api/templates", {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
}

function authenticatedRequest(userId: string) {
  return new Request("http://localhost/api/templates", {
    headers: {
      [TEST_USER_HEADER]: userId,
    },
  });
}
