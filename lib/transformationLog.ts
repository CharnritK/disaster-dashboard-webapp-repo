import type { TransformationStep } from "@/types/transformations";

export function createTransformationStep(
  stepType: TransformationStep["stepType"],
  description: string,
  extras: Partial<Omit<TransformationStep, "id" | "timestamp" | "stepType" | "description">> = {}
): TransformationStep {
  return {
    id: `${stepType}-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    stepType,
    description,
    ...extras
  };
}
