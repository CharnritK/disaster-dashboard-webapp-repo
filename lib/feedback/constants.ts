export const FEEDBACK_TAGS = [
  "useful",
  "unclear",
  "missing-caveat",
  "wrong-priority",
  "export-ready",
] as const;

export type FeedbackTag = (typeof FEEDBACK_TAGS)[number];
