import { describe, expect, it } from "vitest";
import {
  DEMO_SAFETY_STRIP,
  DEMO_SESSION_CHIP,
  DEMO_UPLOAD_TITLE,
  STEP_LABELS,
} from "@/lib/demoMessaging";
import { WORKFLOW_STEPS } from "@/lib/config";

describe("demo framing copy", () => {
  it("keeps the public demo safety posture visible", () => {
    expect(DEMO_SAFETY_STRIP.toLowerCase()).toContain("controlled beta");
    expect(DEMO_SAFETY_STRIP.toLowerCase()).toContain("synthetic sample data");
    expect(DEMO_SAFETY_STRIP.toLowerCase()).toContain("not for operational action");
    expect(DEMO_SESSION_CHIP.toLowerCase()).toContain("session-only");
    expect(DEMO_SESSION_CHIP.toLowerCase()).toContain("nothing is stored");
  });

  it("uses clear user-facing labels", () => {
    expect(DEMO_UPLOAD_TITLE).toBe("Choose sample data");
    expect(Object.keys(STEP_LABELS).sort()).toEqual([...WORKFLOW_STEPS].sort());
    expect(STEP_LABELS.validate).toBe("Validate");
    expect(Object.values(STEP_LABELS).join(" ").toLowerCase()).not.toContain(
      "deterministic",
    );
  });
});
