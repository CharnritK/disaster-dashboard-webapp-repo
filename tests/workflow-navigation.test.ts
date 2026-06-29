import { describe, expect, it } from "vitest";
import { canActivateWorkflowStep, isPriorWorkflowStep, type WorkflowStep } from "@/lib/config";

describe("workflow navigation", () => {
  it("allows completed workflow steps to be treated as back navigation", () => {
    expect(isPriorWorkflowStep("validate", "profile")).toBe(true);
    expect(isPriorWorkflowStep("validate", "brief")).toBe(true);
  });

  it("does not treat current or future steps as back navigation", () => {
    expect(isPriorWorkflowStep("validate", "validate")).toBe(false);
    expect(isPriorWorkflowStep("validate", "dashboard")).toBe(false);
  });

  it("activates previous steps even when forward navigation gates reject them", () => {
    const rejectAll = () => false;

    expect(
      canActivateWorkflowStep({
        currentStep: "validate",
        targetStep: "profile",
        canNavigateTo: rejectAll,
      }),
    ).toBe(true);
  });

  it("keeps current and future steps behind the normal gate", () => {
    const allowed = new Set<WorkflowStep>(["dashboard"]);
    const canNavigateTo = (step: WorkflowStep) => allowed.has(step);

    expect(
      canActivateWorkflowStep({
        currentStep: "validate",
        targetStep: "validate",
        canNavigateTo,
      }),
    ).toBe(false);
    expect(
      canActivateWorkflowStep({
        currentStep: "validate",
        targetStep: "dashboard",
        canNavigateTo,
      }),
    ).toBe(true);
    expect(
      canActivateWorkflowStep({
        currentStep: "validate",
        targetStep: "export",
        canNavigateTo,
      }),
    ).toBe(false);
  });
});
