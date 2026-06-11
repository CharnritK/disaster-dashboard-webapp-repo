export function positiveNumberFromConfig(
  value: string | undefined,
  fallback: number,
  min = 0,
) {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(min, parsed) : fallback;
}

export const MAX_UPLOAD_SIZE_MB = positiveNumberFromConfig(
  process.env.MAX_UPLOAD_SIZE_MB,
  1,
  0.1,
);

export const SUPPORTED_FILE_TYPES = ["csv", "xlsx"] as const;

export type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number];

export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const WORKFLOW_STEPS = [
  "brief",
  "upload",
  "profile",
  "recommend",
  "validate",
  "dashboard",
  "export"
] as const;

export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];
