import { describe, expect, it } from "vitest";
import { summarizeJoinMatch } from "@/lib/joinSummary";

describe("summarizeJoinMatch", () => {
  it("returns matched and unmatched counts with bounded key samples", () => {
    const left = [{ code: "A" }, { code: "B" }, { code: "C" }];
    const right = [{ code: "A" }, { code: "C" }, { code: "D" }];

    expect(summarizeJoinMatch(left, right, "code", "code", 2)).toEqual({
      leftCount: 3,
      rightCount: 3,
      matchedCount: 2,
      unmatchedLeftCount: 1,
      unmatchedRightCount: 1,
      unmatchedLeftKeys: ["B"],
      unmatchedRightKeys: ["D"],
      blankLeftKeyCount: 0,
      blankRightKeyCount: 0,
      duplicateLeftKeyCount: 0,
      duplicateRightKeyCount: 0,
      duplicateLeftKeys: [],
      duplicateRightKeys: [],
    });
  });

  it("counts duplicate rows while sampling each unmatched key once", () => {
    const left = [{ code: "A" }, { code: "B" }, { code: "B" }];
    const right = [{ code: "A" }, { code: "C" }, { code: "C" }];

    expect(summarizeJoinMatch(left, right, "code", "code")).toEqual({
      leftCount: 3,
      rightCount: 3,
      matchedCount: 1,
      unmatchedLeftCount: 2,
      unmatchedRightCount: 2,
      unmatchedLeftKeys: ["B"],
      unmatchedRightKeys: ["C"],
      blankLeftKeyCount: 0,
      blankRightKeyCount: 0,
      duplicateLeftKeyCount: 1,
      duplicateRightKeyCount: 1,
      duplicateLeftKeys: ["B"],
      duplicateRightKeys: ["C"],
    });
  });

  it("normalizes case and whitespace before matching", () => {
    const left = [{ code: " MDG01 " }, { code: "mdg02" }];
    const right = [{ admin_code: "mdg01" }, { admin_code: " MDG03 " }];

    expect(summarizeJoinMatch(left, right, "code", "admin_code")).toEqual({
      leftCount: 2,
      rightCount: 2,
      matchedCount: 1,
      unmatchedLeftCount: 1,
      unmatchedRightCount: 1,
      unmatchedLeftKeys: ["mdg02"],
      unmatchedRightKeys: ["MDG03"],
      blankLeftKeyCount: 0,
      blankRightKeyCount: 0,
      duplicateLeftKeyCount: 0,
      duplicateRightKeyCount: 0,
      duplicateLeftKeys: [],
      duplicateRightKeys: [],
    });
  });

  it("matches blank keys consistently with harmonization while flagging them", () => {
    const summary = summarizeJoinMatch(
      [{ code: "" }, { code: null }, { code: "A" }],
      [{ code: "A" }, { code: undefined }],
      "code",
      "code",
    );

    expect(summary).toEqual({
      leftCount: 3,
      rightCount: 2,
      matchedCount: 3,
      unmatchedLeftCount: 0,
      unmatchedRightCount: 0,
      unmatchedLeftKeys: [],
      unmatchedRightKeys: [],
      blankLeftKeyCount: 2,
      blankRightKeyCount: 1,
      duplicateLeftKeyCount: 1,
      duplicateRightKeyCount: 0,
      duplicateLeftKeys: ["(blank)"],
      duplicateRightKeys: [],
    });
    expect(JSON.stringify(summary)).not.toContain("code");
  });

  it("bounds unmatched key samples deterministically", () => {
    const left = [{ code: "A" }, { code: "B" }, { code: "C" }];
    const right = [{ code: "Z" }];

    expect(summarizeJoinMatch(left, right, "code", "code", 2).unmatchedLeftKeys).toEqual([
      "A",
      "B",
    ]);
  });

  it("bounds long key sample strings", () => {
    const longKey = "X".repeat(100);

    expect(
      summarizeJoinMatch([{ code: longKey }], [], "code", "code").unmatchedLeftKeys[0],
    ).toBe(`${"X".repeat(45)}...`);
  });
});
