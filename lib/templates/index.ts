import {
  getMetadataDbAdapter,
} from "@/lib/db/metadataRuntime";
import type {
  CustomTemplateInput,
  TemplateVersionInput,
} from "@/lib/db/metadataAdapter";

export type TemplateDraftInput = CustomTemplateInput &
  Omit<TemplateVersionInput, "templateId" | "versionNumber">;

export class TemplateValidationError extends Error {}

const SCHEMA_TYPE_LABELS = new Set([
  "boolean",
  "category",
  "categorical",
  "date",
  "datetime",
  "decimal",
  "enum",
  "float",
  "integer",
  "number",
  "percent",
  "percentage",
  "string",
  "text",
  "unknown",
]);

const SUGGESTED_FIELD_ROLES = new Set([
  "context",
  "date",
  "demographic",
  "dimension",
  "evidence",
  "geography",
  "join_key",
  "metric",
  "quality",
]);

export function parseTemplateDraft(body: unknown): TemplateDraftInput {
  if (!isRecord(body)) throw new TemplateValidationError("Template body must be an object.");

  const title = requiredText(body.title, "title", 120);
  const decisionQuestion = requiredText(body.decisionQuestion, "decisionQuestion", 240);
  const intendedAction = requiredText(body.intendedAction, "intendedAction", 240);
  const decisionMaker = requiredText(body.decisionMaker, "decisionMaker", 160);
  const geographyTimeframe = requiredText(body.geographyTimeframe, "geographyTimeframe", 160);
  const requiredEvidence = textArray(body.requiredEvidence, "requiredEvidence", 12);
  const suggestedFields = suggestedFieldArray(body.suggestedFields);

  return {
    caveats: optionalText(body.caveats, 600) ?? "",
    decisionMaker,
    decisionQuestion,
    description: optionalText(body.description, 600),
    exampleDataSchema: safeObject(body.exampleDataSchema, "exampleDataSchema"),
    geographyTimeframe,
    intendedAction,
    isReviewed: false,
    ownerUserId: "",
    requiredEvidence,
    reviewStatus: "draft",
    status: "draft",
    suggestedFields,
    title,
    visibility: "private",
  };
}

export async function createTemplateDraft(userId: string, input: TemplateDraftInput) {
  const adapter = getMetadataDbAdapter();
  const template = await adapter.createCustomTemplate({
    description: input.description,
    ownerUserId: userId,
    status: "draft",
    title: input.title,
    visibility: "private",
  });
  const version = await adapter.createTemplateVersion({
    caveats: input.caveats,
    decisionMaker: input.decisionMaker,
    decisionQuestion: input.decisionQuestion,
    exampleDataSchema: input.exampleDataSchema,
    geographyTimeframe: input.geographyTimeframe,
    intendedAction: input.intendedAction,
    isReviewed: false,
    requiredEvidence: input.requiredEvidence,
    reviewStatus: "draft",
    suggestedFields: input.suggestedFields,
    templateId: template.id,
    versionNumber: 1,
  });

  return {
    template,
    version,
  };
}

export async function listTemplatesForUser(userId: string) {
  return getMetadataDbAdapter().listCustomTemplates(userId);
}

export async function updateTemplateDraft(
  userId: string,
  templateId: string,
  input: { description?: string | null; title?: string },
) {
  return getMetadataDbAdapter().updateCustomTemplate(templateId, userId, {
    description: input.description,
    title: input.title,
  });
}

export function parseTemplatePatch(body: unknown) {
  if (!isRecord(body)) throw new TemplateValidationError("Template body must be an object.");

  const allowedKeys = new Set(["description", "title"]);
  for (const key of Object.keys(body)) {
    if (!allowedKeys.has(key) || /row|file|screenshot|report|prompt|response/i.test(key)) {
      throw new TemplateValidationError("Template update includes unsupported data.");
    }
  }

  return {
    description: optionalText(body.description, 600),
    title: body.title === undefined ? undefined : requiredText(body.title, "title", 120),
  };
}

function requiredText(value: unknown, name: string, maxLength: number) {
  const text = optionalText(value, maxLength);
  if (!text) throw new TemplateValidationError(`${name} is required.`);
  return text;
}

function optionalText(value: unknown, maxLength: number) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new TemplateValidationError("Template text fields must be strings.");
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new TemplateValidationError("Template text field is invalid.");
  }
  if (/(\n|,).*(\n|,)|<script|=cmd|=hyperlink|\+cmd/i.test(trimmed)) {
    throw new TemplateValidationError("Template text looks like pasted data.");
  }
  return trimmed;
}

function textArray(value: unknown, name: string, maxItems: number) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new TemplateValidationError(`${name} must be a short array.`);
  }
  return value.map((item) => requiredText(item, name, 120));
}

function suggestedFieldArray(value: unknown) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 40) {
    throw new TemplateValidationError("suggestedFields must be a short array.");
  }
  return value.map(parseSuggestedField);
}

function parseSuggestedField(value: unknown) {
  if (!isRecord(value)) {
    throw new TemplateValidationError("suggestedFields must contain objects.");
  }

  const allowedKeys = new Set([
    "caveat",
    "description",
    "evidenceNeed",
    "evidence_need",
    "field_name",
    "name",
    "required",
    "role",
    "type",
  ]);
  const entries: Array<[string, string | boolean]> = [];
  for (const [key, item] of Object.entries(value)) {
    if (
      !allowedKeys.has(key) ||
      /row|sample|value|file|prompt|response|example/i.test(key)
    ) {
      throw new TemplateValidationError("suggestedFields cannot include example rows or values.");
    }
    if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(key)) {
      throw new TemplateValidationError("suggestedFields has an unsafe key.");
    }

    if (key === "field_name" || key === "name") {
      entries.push([key, safeFieldName(item, key)]);
    } else if (key === "role") {
      entries.push([key, safeSuggestedFieldRole(item)]);
    } else if (key === "type") {
      entries.push([key, safeSchemaTypeLabel(item, "suggestedFields")]);
    } else if (key === "required") {
      if (typeof item !== "boolean") {
        throw new TemplateValidationError("suggestedFields required must be boolean metadata.");
      }
      entries.push([key, item]);
    } else {
      entries.push([key, requiredText(item, key, 160)]);
    }
  }

  if (!entries.some(([key]) => key === "field_name" || key === "name")) {
    throw new TemplateValidationError("suggestedFields must include a field name.");
  }

  return Object.fromEntries(entries);
}

function safeObject(value: unknown, name: string) {
  if (value == null) return {};
  if (!isRecord(value)) {
    throw new TemplateValidationError(`${name} must be an object.`);
  }
  if (Object.keys(value).some((key) => /row|sample|value|file|prompt|response/i.test(key))) {
    throw new TemplateValidationError(`${name} cannot include example rows or values.`);
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(key)) {
        throw new TemplateValidationError(`${name} has an unsafe key.`);
      }
      if (item == null) {
        return [key, item];
      }
      if (name === "exampleDataSchema") {
        return [key, safeSchemaTypeLabel(item, name)];
      }
      if (
        typeof item === "boolean" ||
        (typeof item === "number" && Number.isFinite(item)) ||
        typeof item === "string"
      ) {
        return [key, typeof item === "string" ? item.slice(0, 120) : item];
      }
      throw new TemplateValidationError(`${name} values must be schema metadata, not example values.`);
    }),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSchemaTypeLabel(value: string) {
  return SCHEMA_TYPE_LABELS.has(value.trim().toLowerCase());
}

function safeFieldName(value: unknown, name: string) {
  if (typeof value !== "string") {
    throw new TemplateValidationError(`${name} must be schema metadata.`);
  }
  const trimmed = value.trim();
  if (!/^[A-Za-z][A-Za-z0-9_.:-]{0,79}$/.test(trimmed)) {
    throw new TemplateValidationError(`${name} has an unsafe field name.`);
  }
  return trimmed;
}

function safeSuggestedFieldRole(value: unknown) {
  if (typeof value !== "string") {
    throw new TemplateValidationError("suggestedFields role must be schema metadata.");
  }
  const normalized = value.trim().toLowerCase();
  if (!SUGGESTED_FIELD_ROLES.has(normalized)) {
    throw new TemplateValidationError("suggestedFields role must be schema metadata.");
  }
  return normalized;
}

function safeSchemaTypeLabel(value: unknown, name: string) {
  if (typeof value === "string" && isSchemaTypeLabel(value)) {
    return value.trim().toLowerCase();
  }
  throw new TemplateValidationError(
    `${name} values must be schema metadata, not example values.`,
  );
}
