import { describe, expect, it } from "vitest";

import { deterministicCoachHints } from "@/lib/coach";

describe("deterministic coach", () => {
  it("anchors hints to workflow steps without provider calls", () => {
    expect(deterministicCoachHints("brief")[0]).toMatchObject({
      title: "Start with the decision",
      tone: "neutral",
    });
    expect(deterministicCoachHints("export")[0].body).toContain(
      "Deterministic readiness remains authoritative",
    );
  });

  it("surfaces readiness blocks as warnings", () => {
    expect(
      deterministicCoachHints("dashboard", {
        blockerCount: 1,
        caveats: [],
        requiredEvidenceCovered: [],
        requiredEvidenceMissing: ["Capacity"],
        reviewCount: 0,
        status: "decision_unsafe",
        summary: "Blocking evidence is missing.",
        title: "Decision unsafe",
      })[0],
    ).toMatchObject({
      title: "Readiness blocks action",
      tone: "warn",
    });
  });
});
