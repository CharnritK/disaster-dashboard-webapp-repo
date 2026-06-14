import { describe, expect, it } from "vitest";

import {
  getRequestAuthContext,
  parseCookieHeader,
  TEST_USER_HEADER,
} from "@/lib/auth/requestAuth";

function requestWithTestUser(userId: string) {
  return new Request("http://localhost/api/recommend", {
    headers: {
      [TEST_USER_HEADER]: userId,
    },
  });
}

describe("request auth context", () => {
  it("accepts the test identity header only in test mode", async () => {
    await expect(
      getRequestAuthContext(requestWithTestUser("analyst-1"), {
        NODE_ENV: "test",
      } as NodeJS.ProcessEnv),
    ).resolves.toEqual({
      source: "test",
      userId: "analyst-1",
    });

    await expect(
      getRequestAuthContext(requestWithTestUser("analyst-1"), {
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv),
    ).resolves.toBeNull();
  });

  it("rejects unsafe test identity values", async () => {
    await expect(
      getRequestAuthContext(requestWithTestUser("../not-safe"), {
        NODE_ENV: "test",
      } as NodeJS.ProcessEnv),
    ).resolves.toBeNull();
  });

  it("uses the Supabase resolver outside test identity mode", async () => {
    await expect(
      getRequestAuthContext(
        requestWithTestUser("analyst-1"),
        {
          NODE_ENV: "production",
        } as NodeJS.ProcessEnv,
        async () => ({
          source: "supabase",
          userId: "11111111-1111-1111-1111-111111111111",
          email: "analyst@example.org",
        }),
      ),
    ).resolves.toEqual({
      source: "supabase",
      userId: "11111111-1111-1111-1111-111111111111",
      email: "analyst@example.org",
    });
  });

  it("parses request cookies for the server auth client", () => {
    expect(parseCookieHeader("a=1; sb-token=value%202; empty=")).toEqual([
      { name: "a", value: "1" },
      { name: "sb-token", value: "value 2" },
      { name: "empty", value: "" },
    ]);
  });
});
