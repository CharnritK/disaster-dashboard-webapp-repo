import { getMetadataDbAdapter } from "@/lib/db/metadataRuntime";
import type {
  FormRegistryRecord,
  FormRegistryVersionRecord,
  ReusableMappingRecord,
  SafeMetadata,
} from "@/lib/db/metadataAdapter";
import type {
  FormRegistryDraft,
  FormRegistryEvidenceMapping,
  FormRegistryFieldSummary,
  MappingConfidenceBucket,
  MappingReviewStatus,
} from "@/types/formRegistry";
import type {
  FormFamily,
  FormIntakeSourceKind,
} from "@/types/formIntake";

export type FormRegistryCreateResult = {
  registry: FormRegistryRecord;
  version: FormRegistryVersionRecord;
  reusableMappings: ReusableMappingRecord[];
};

export class FormRegistryValidationError extends Error {}

const FORM_FAMILIES: FormFamily[] = [
  "generic_table",
  "hxl",
  "ocha_3w",
  "ocha_5w",
  "suggested_template",
  "xlsform",
];
const SOURCE_KINDS: FormIntakeSourceKind[] = [
  "suggested_template",
  "tabular_rows",
  "xlsform_schema",
];
const CONFIDENCE_BUCKETS: MappingConfidenceBucket[] = ["high", "medium", "low"];
const MAPPING_STATUSES: MappingReviewStatus[] = [
  "accepted",
  "needs_review",
  "rejected",
];
const UNSAFE_KEY_PATTERN =
  /row|rows|record|records|sample|value|values|file|files|upload|prompt|response|secret|token|credential|password|address|coordinate|latitude|longitude|lat|lon|lng|ocr|text/i;

export function parseFormRegistryDraft(body: unknown): FormRegistryDraft {
  if (!isRecord(body)) {
    throw new FormRegistryValidationError("Form registry body must be an object.");
  }
  rejectUnsafeKeys(body, "form registry");
  rejectUnsupportedKeys(
    body,
    new Set([
      "caveats",
      "description",
      "evidenceMappings",
      "fieldCount",
      "fieldSummaries",
      "formFamily",
      "requiredFieldCount",
      "schemaFingerprint",
      "sourceKind",
      "title",
    ]),
    "form registry",
  );

  const fieldSummaries = parseFieldSummaries(body.fieldSummaries);
  const evidenceMappings = parseEvidenceMappings(body.evidenceMappings);
  const fieldCount = optionalInteger(body.fieldCount, fieldSummaries.length, 1, 500);
  const requiredFieldCount = optionalInteger(
    body.requiredFieldCount,
    fieldSummaries.filter((field) => field.required).length,
    0,
    fieldCount,
  );

  if (requiredFieldCount > fieldCount) {
    throw new FormRegistryValidationError("Required field count cannot exceed field count.");
  }

  return {
    caveats: textArray(body.caveats, "caveats", 12, 200),
    description: optionalText(body.description, 600),
    evidenceMappings,
    fieldCount,
    fieldSummaries,
    formFamily: enumValue(body.formFamily, FORM_FAMILIES, "formFamily"),
    requiredFieldCount,
    schemaFingerprint: requiredFingerprint(body.schemaFingerprint),
    sourceKind: enumValue(body.sourceKind, SOURCE_KINDS, "sourceKind"),
    title: requiredText(body.title, "title", 120),
  };
}

export async function createFormRegistryDraft(
  userId: string,
  draft: FormRegistryDraft,
): Promise<FormRegistryCreateResult> {
  const adapter = getMetadataDbAdapter();
  const registry = await adapter.createFormRegistry({
    caveats: draft.caveats,
    description: draft.description,
    fieldCount: draft.fieldCount,
    formFamily: draft.formFamily,
    mappingCount: draft.evidenceMappings.length,
    ownerUserId: userId,
    requiredFieldCount: draft.requiredFieldCount,
    reviewStatus: draft.evidenceMappings.some(
      (mapping) => mapping.reviewStatus !== "accepted",
    )
      ? "review_needed"
      : "draft",
    schemaFingerprint: draft.schemaFingerprint,
    sourceKind: draft.sourceKind,
    title: draft.title,
    visibility: "private",
  });
  const version = await adapter.createFormRegistryVersion({
    caveats: draft.caveats,
    evidenceMappings: draft.evidenceMappings.map(mappingToSafeMetadata),
    fieldCount: draft.fieldCount,
    fieldSummaries: draft.fieldSummaries.map(fieldToSafeMetadata),
    registryId: registry.id,
    requiredFieldCount: draft.requiredFieldCount,
    schemaFingerprint: draft.schemaFingerprint,
    sourceKind: draft.sourceKind,
    versionNumber: 1,
  });
  const reusableMappings = [];
  for (const mapping of draft.evidenceMappings) {
    reusableMappings.push(
      await adapter.createReusableMapping({
        caveats: [],
        confidenceBucket: mapping.confidenceBucket,
        evidenceNeed: mapping.evidenceNeed,
        fieldName: mapping.fieldName,
        ownerUserId: userId,
        rationale: mapping.rationale,
        registryId: registry.id,
        registryVersionId: version.id,
        reviewStatus: mapping.reviewStatus,
      }),
    );
  }

  return {
    registry,
    reusableMappings,
    version,
  };
}

export function listFormRegistriesForUser(userId: string) {
  return getMetadataDbAdapter().listFormRegistries(userId);
}

export async function getFormRegistryForUser(userId: string, registryId: string) {
  const registry = await getMetadataDbAdapter().getFormRegistry(registryId, userId);
  if (!registry) return null;
  const reusableMappings = await getMetadataDbAdapter().listReusableMappings(
    userId,
    registry.id,
  );
  return {
    registry,
    reusableMappings,
  };
}

function parseFieldSummaries(value: unknown): FormRegistryFieldSummary[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 80) {
    throw new FormRegistryValidationError("fieldSummaries must be a short array.");
  }
  return value.map((item) => {
    if (!isRecord(item)) {
      throw new FormRegistryValidationError("Field summary must be an object.");
    }
    rejectUnsafeKeys(item, "field summary");
    const allowed = new Set([
      "confidenceBucket",
      "evidenceNeed",
      "fieldName",
      "fieldType",
      "label",
      "required",
      "status",
    ]);
    rejectUnsupportedKeys(item, allowed, "field summary");
    const confidenceBucket = optionalEnum(
      item.confidenceBucket,
      CONFIDENCE_BUCKETS,
      "confidenceBucket",
    );
    const status = optionalEnum(item.status, ["ready", "review_needed"], "status");
    return {
      confidenceBucket,
      evidenceNeed: optionalText(item.evidenceNeed, 120) ?? undefined,
      fieldName: requiredText(item.fieldName, "fieldName", 120),
      fieldType: optionalText(item.fieldType, 80) ?? undefined,
      label: optionalText(item.label, 160) ?? undefined,
      required: item.required === true,
      status,
    };
  });
}

function parseEvidenceMappings(value: unknown): FormRegistryEvidenceMapping[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 80) {
    throw new FormRegistryValidationError("evidenceMappings must be a short array.");
  }
  return value.map((item) => {
    if (!isRecord(item)) {
      throw new FormRegistryValidationError("Evidence mapping must be an object.");
    }
    rejectUnsafeKeys(item, "evidence mapping");
    rejectUnsupportedKeys(
      item,
      new Set([
        "confidenceBucket",
        "evidenceNeed",
        "fieldName",
        "rationale",
        "reviewStatus",
      ]),
      "evidence mapping",
    );
    return {
      confidenceBucket: enumValue(
        item.confidenceBucket,
        CONFIDENCE_BUCKETS,
        "confidenceBucket",
      ),
      evidenceNeed: requiredText(item.evidenceNeed, "evidenceNeed", 120),
      fieldName: requiredText(item.fieldName, "fieldName", 120),
      rationale: optionalText(item.rationale, 240) ?? undefined,
      reviewStatus: enumValue(item.reviewStatus, MAPPING_STATUSES, "reviewStatus"),
    };
  });
}

function fieldToSafeMetadata(field: FormRegistryFieldSummary): SafeMetadata {
  return {
    confidenceBucket: field.confidenceBucket,
    evidenceNeed: field.evidenceNeed,
    fieldName: field.fieldName,
    fieldType: field.fieldType,
    label: field.label,
    required: field.required,
    status: field.status,
  };
}

function mappingToSafeMetadata(mapping: FormRegistryEvidenceMapping): SafeMetadata {
  return {
    confidenceBucket: mapping.confidenceBucket,
    evidenceNeed: mapping.evidenceNeed,
    fieldName: mapping.fieldName,
    rationale: mapping.rationale,
    reviewStatus: mapping.reviewStatus,
  };
}

function rejectUnsafeKeys(value: Record<string, unknown>, context: string) {
  for (const key of Object.keys(value)) {
    if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(key) || UNSAFE_KEY_PATTERN.test(key)) {
      throw new FormRegistryValidationError(`${context} includes unsupported data.`);
    }
  }
}

function rejectUnsupportedKeys(
  value: Record<string, unknown>,
  allowed: Set<string>,
  context: string,
) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new FormRegistryValidationError(`${context} includes unsupported data.`);
    }
  }
}

function requiredText(value: unknown, name: string, maxLength: number) {
  const text = optionalText(value, maxLength);
  if (!text) throw new FormRegistryValidationError(`${name} is required.`);
  return text;
}

function optionalText(value: unknown, maxLength: number) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new FormRegistryValidationError("Form registry text fields must be strings.");
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new FormRegistryValidationError("Form registry text field is invalid.");
  }
  if (/(\n|,).*(\n|,)|<script|=cmd|=hyperlink|\+cmd/i.test(trimmed)) {
    throw new FormRegistryValidationError("Form registry text looks like pasted data.");
  }
  return trimmed;
}

function requiredFingerprint(value: unknown) {
  const text = requiredText(value, "schemaFingerprint", 96);
  if (!/^[a-z0-9][a-z0-9_.:-]{7,95}$/i.test(text)) {
    throw new FormRegistryValidationError("schemaFingerprint is invalid.");
  }
  return text;
}

function textArray(
  value: unknown,
  name: string,
  maxItems: number,
  maxLength: number,
) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new FormRegistryValidationError(`${name} must be a short array.`);
  }
  return value.map((item) => requiredText(item, name, maxLength));
}

function enumValue<T extends string>(value: unknown, allowed: T[], name: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new FormRegistryValidationError(`${name} is unsupported.`);
  }
  return value as T;
}

function optionalEnum<T extends string>(
  value: unknown,
  allowed: T[],
  name: string,
): T | undefined {
  if (value == null || value === "") return undefined;
  return enumValue(value, allowed, name);
}

function optionalInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value == null) return fallback;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new FormRegistryValidationError("Form registry count is invalid.");
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
