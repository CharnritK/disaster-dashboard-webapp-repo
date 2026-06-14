import { afterEach, describe, expect, it } from "vitest";

import { POST as postFeedbackRoute } from "@/app/api/feedback/route";
import { TEST_USER_HEADER } from "@/lib/auth/requestAuth";
import { resetMetadataDbAdapterForTests } from "@/lib/db/metadataRuntime";
import { parseFeedbackSubmission } from "@/lib/feedback";

afterEach(() => {
  resetMetadataDbAdapterForTests();
});

describe("feedback API", () => {
  it("requires authentication", async () => {
    const response = await postFeedbackRoute(
      feedbackRequest({
        tags: ["useful"],
        thumb: "up",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      fallbackReason: "unauthenticated",
    });
  });

  it("accepts valid metadata-only feedback", async () => {
    const response = await postFeedbackRoute(
      feedbackRequest(
        {
          comment: "Useful for briefing.",
          tags: ["useful", "export-ready"],
          thumb: "up",
        },
        "analyst-1",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
    });
  });

  it("rejects invalid tags and row-like fields", () => {
    expect(() =>
      parseFeedbackSubmission({
        rows: [{ district: "D01" }],
        tags: ["useful"],
        thumb: "up",
      }),
    ).toThrow(/unsupported data/i);

    expect(() =>
      parseFeedbackSubmission({
        tags: ["not-approved"],
        thumb: "up",
      }),
    ).toThrow(/not allowed/i);

    expect(() =>
      parseFeedbackSubmission({
        comment: "x".repeat(2001),
        tags: ["useful"],
        thumb: "up",
      }),
    ).toThrow(/too long/i);
  });
});

function feedbackRequest(body: unknown, userId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (userId) headers[TEST_USER_HEADER] = userId;

  return new Request("http://localhost/api/feedback", {
    body: JSON.stringify(body),
    headers,
    method: "POST",
  });
}
