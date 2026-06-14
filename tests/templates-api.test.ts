import { afterEach, describe, expect, it } from "vitest";

import { PATCH as patchTemplateRoute } from "@/app/api/templates/[id]/route";
import { GET as getTemplatesRoute, POST as postTemplatesRoute } from "@/app/api/templates/route";
import { TEST_USER_HEADER } from "@/lib/auth/requestAuth";
import { resetMetadataDbAdapterForTests } from "@/lib/db/metadataRuntime";
import { parseTemplateDraft } from "@/lib/templates";

afterEach(() => {
  resetMetadataDbAdapterForTests();
});

describe("template API", () => {
  it("requires auth", async () => {
    const response = await getTemplatesRoute(new Request("http://localhost/api/templates"));
    expect(response.status).toBe(401);
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
