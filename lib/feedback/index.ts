import { getMetadataDbAdapter } from "@/lib/db/metadataRuntime";
import type { FeedbackThumb } from "@/lib/db/metadataAdapter";
import { FEEDBACK_TAGS, type FeedbackTag } from "@/lib/feedback/constants";

export { FEEDBACK_TAGS, type FeedbackTag } from "@/lib/feedback/constants";

export type FeedbackSubmission = {
  aiEventId?: string | null;
  comment?: string | null;
  dashboardId?: string | null;
  tags: FeedbackTag[];
  templateId?: string | null;
  templateVersionId?: string | null;
  thumb: FeedbackThumb;
};

const MAX_COMMENT_LENGTH = 2_000;
const ALLOWED_BODY_KEYS = new Set([
  "aiEventId",
  "comment",
  "dashboardId",
  "tags",
  "templateId",
  "templateVersionId",
  "thumb",
]);

export function parseFeedbackSubmission(body: unknown): FeedbackSubmission {
  if (!isRecord(body)) {
    throw new FeedbackValidationError("Feedback body must be an object.");
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_BODY_KEYS.has(key) || /row|file|screenshot|report|prompt|response/i.test(key)) {
      throw new FeedbackValidationError("Feedback includes unsupported data.");
    }
  }

  const thumb = body.thumb;
  if (thumb !== "up" && thumb !== "down") {
    throw new FeedbackValidationError("Feedback thumb must be up or down.");
  }

  const tags = parseTags(body.tags);
  const comment = optionalString(body.comment, MAX_COMMENT_LENGTH);

  return {
    aiEventId: optionalId(body.aiEventId),
    comment,
    dashboardId: optionalId(body.dashboardId),
    tags,
    templateId: optionalId(body.templateId),
    templateVersionId: optionalId(body.templateVersionId),
    thumb,
  };
}

export async function saveFeedback(userId: string, submission: FeedbackSubmission) {
  return getMetadataDbAdapter().createFeedback({
    aiEventId: submission.aiEventId,
    comment: submission.comment,
    tags: submission.tags,
    templateId: submission.templateId,
    templateVersionId: submission.templateVersionId,
    thumb: submission.thumb,
    userId,
  });
}

export class FeedbackValidationError extends Error {}

function parseTags(value: unknown): FeedbackTag[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new FeedbackValidationError("Feedback tags must be an array.");
  }

  return value.map((tag) => {
    if (typeof tag !== "string" || !FEEDBACK_TAGS.includes(tag as FeedbackTag)) {
      throw new FeedbackValidationError("Feedback tag is not allowed.");
    }
    return tag as FeedbackTag;
  });
}

function optionalString(value: unknown, maxLength: number) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new FeedbackValidationError("Feedback comment must be text.");
  }
  if (value.length > maxLength) {
    throw new FeedbackValidationError("Feedback comment is too long.");
  }
  if (/(\n|,).*(\n|,)/.test(value) || /<script|=cmd|=hyperlink|\+cmd/i.test(value)) {
    throw new FeedbackValidationError("Feedback comment looks like pasted data or executable content.");
  }
  return value;
}

function optionalId(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > 120 || !/^[A-Za-z0-9._:@-]+$/.test(value)) {
    throw new FeedbackValidationError("Feedback identifier is invalid.");
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
