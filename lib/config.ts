export const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 1);

export const SUPPORTED_FILE_TYPES = ["csv", "xlsx"] as const;

export type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number];

export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const WORKFLOW_STEPS = [
  "upload",
  "profile",
  "recommend",
  "validate",
  "dashboard",
  "export"
] as const;

export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];
