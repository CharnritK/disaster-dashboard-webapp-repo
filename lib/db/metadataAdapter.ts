import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/db/serverClient";
import type {
  AIRecommendationResponse,
  CopilotTaskType,
} from "@/types/recommendations";
import type {
  FormRegistryReviewStatus,
  FormRegistryVisibility,
  MappingConfidenceBucket,
  MappingReviewStatus,
} from "@/types/formRegistry";
import type {
  FormFamily,
  FormIntakeSourceKind,
} from "@/types/formIntake";

// Server-only boundary: metadata adapters must not be imported from Client Components.

export const APPROVED_METADATA_TABLES = [
  "user_profiles",
  "ai_usage_daily",
  "ai_events",
  "feedback",
  "form_registries",
  "form_registry_versions",
  "custom_templates",
  "reusable_mappings",
  "template_versions",
] as const;

export type ApprovedMetadataTable = (typeof APPROVED_METADATA_TABLES)[number];
export type UserRole = "admin" | "user";
export type TemplateStatus = "archived" | "draft" | "reviewed";
export type TemplateVisibility = "private" | "reviewed";
export type TemplateReviewStatus =
  | "draft"
  | "pending_review"
  | "rejected"
  | "reviewed";
export type FeedbackThumb = "down" | "up";
export type SafeMetadataValue = boolean | number | string | null | undefined;
export type SafeMetadata = Record<string, SafeMetadataValue>;
export type AiFallbackReason = NonNullable<AIRecommendationResponse["fallbackReason"]>;

export type UserProfileRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
};

export type UserProfileInput = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  role?: UserRole;
  lastLoginAt?: string | null;
};

export type AiUsageDailyRecord = {
  id: string;
  userId: string;
  usageDate: string;
  usedCount: number;
  dailyLimit: number;
  createdAt: string;
  updatedAt: string;
};

export type AiUsageReserveResult =
  | {
      record: AiUsageDailyRecord;
      reserved: true;
    }
  | {
      record: AiUsageDailyRecord;
      reserved: false;
      reason: "quota_exceeded";
    };

export type AiEventDbInput = {
  attemptedProviderCall: boolean;
  fallbackReason?: AiFallbackReason;
  metadata?: SafeMetadata;
  model?: string;
  promptVersion: string;
  provider?: string;
  route:
    | "/api/coach"
    | "/api/copilot"
    | "/api/form-schema/interpret"
    | "/api/recommend";
  succeeded?: boolean;
  taskType: CopilotTaskType;
  userId?: string;
};

export type AiEventDbRecord = Required<
  Pick<AiEventDbInput, "attemptedProviderCall" | "promptVersion" | "route" | "succeeded" | "taskType">
> & {
  createdAt: string;
  fallbackReason?: AiFallbackReason;
  id: string;
  metadata: SafeMetadata;
  model?: string;
  provider?: string;
  updatedAt: string;
  userId?: string;
};

export type FeedbackInput = {
  aiEventId?: string | null;
  comment?: string | null;
  tags?: string[];
  templateId?: string | null;
  templateVersionId?: string | null;
  thumb: FeedbackThumb;
  userId: string;
};

export type FeedbackRecord = FeedbackInput & {
  createdAt: string;
  id: string;
  tags: string[];
};

export type CustomTemplateInput = {
  description?: string | null;
  ownerUserId: string;
  status?: TemplateStatus;
  title: string;
  visibility?: TemplateVisibility;
};

export type CustomTemplateRecord = Required<
  Pick<CustomTemplateInput, "ownerUserId" | "status" | "title" | "visibility">
> & {
  createdAt: string;
  description?: string | null;
  id: string;
  latestVersionId?: string | null;
  updatedAt: string;
};

export type TemplateVersionInput = {
  caveats?: string;
  decisionMaker: string;
  decisionQuestion: string;
  exampleDataSchema?: SafeMetadata;
  geographyTimeframe: string;
  intendedAction: string;
  isReviewed?: boolean;
  requiredEvidence?: string[];
  reviewStatus?: TemplateReviewStatus;
  reviewedByUserId?: string | null;
  suggestedFields?: SafeMetadata[];
  templateId: string;
  versionNumber: number;
};

export type TemplateVersionRecord = Required<
  Pick<
    TemplateVersionInput,
    | "caveats"
    | "decisionMaker"
    | "decisionQuestion"
    | "geographyTimeframe"
    | "intendedAction"
    | "isReviewed"
    | "requiredEvidence"
    | "reviewStatus"
    | "suggestedFields"
    | "templateId"
    | "versionNumber"
  >
> & {
  createdAt: string;
  exampleDataSchema: SafeMetadata;
  id: string;
  reviewedByUserId?: string | null;
};

export type FormRegistryInput = {
  caveats?: string[];
  description?: string | null;
  fieldCount: number;
  formFamily: FormFamily;
  mappingCount?: number;
  ownerUserId: string;
  requiredFieldCount: number;
  reviewStatus?: FormRegistryReviewStatus;
  schemaFingerprint: string;
  sourceKind: FormIntakeSourceKind;
  title: string;
  visibility?: FormRegistryVisibility;
};

export type FormRegistryRecord = Required<
  Pick<
    FormRegistryInput,
    | "fieldCount"
    | "formFamily"
    | "mappingCount"
    | "ownerUserId"
    | "requiredFieldCount"
    | "reviewStatus"
    | "schemaFingerprint"
    | "sourceKind"
    | "title"
    | "visibility"
  >
> & {
  caveats: string[];
  createdAt: string;
  description?: string | null;
  id: string;
  updatedAt: string;
};

export type FormRegistryVersionInput = {
  caveats?: string[];
  evidenceMappings?: SafeMetadata[];
  fieldCount: number;
  fieldSummaries?: SafeMetadata[];
  registryId: string;
  requiredFieldCount: number;
  schemaFingerprint: string;
  sourceKind: FormIntakeSourceKind;
  versionNumber: number;
};

export type FormRegistryVersionRecord = Required<
  Pick<
    FormRegistryVersionInput,
    | "evidenceMappings"
    | "fieldCount"
    | "fieldSummaries"
    | "registryId"
    | "requiredFieldCount"
    | "schemaFingerprint"
    | "sourceKind"
    | "versionNumber"
  >
> & {
  caveats: string[];
  createdAt: string;
  id: string;
};

export type ReusableMappingInput = {
  caveats?: string[];
  confidenceBucket: MappingConfidenceBucket;
  evidenceNeed: string;
  fieldName: string;
  ownerUserId: string;
  rationale?: string | null;
  registryId: string;
  registryVersionId?: string | null;
  reviewStatus?: MappingReviewStatus;
};

export type ReusableMappingRecord = Required<
  Pick<
    ReusableMappingInput,
    | "confidenceBucket"
    | "evidenceNeed"
    | "fieldName"
    | "ownerUserId"
    | "registryId"
    | "reviewStatus"
  >
> & {
  caveats: string[];
  createdAt: string;
  id: string;
  rationale?: string | null;
  registryVersionId?: string | null;
  updatedAt: string;
};

export interface MetadataDbAdapter {
  createAiEvent(input: AiEventDbInput): Promise<AiEventDbRecord>;
  createCustomTemplate(input: CustomTemplateInput): Promise<CustomTemplateRecord>;
  createFeedback(input: FeedbackInput): Promise<FeedbackRecord>;
  createFormRegistry(input: FormRegistryInput): Promise<FormRegistryRecord>;
  createFormRegistryVersion(
    input: FormRegistryVersionInput,
  ): Promise<FormRegistryVersionRecord>;
  createReusableMapping(input: ReusableMappingInput): Promise<ReusableMappingRecord>;
  createTemplateVersion(input: TemplateVersionInput): Promise<TemplateVersionRecord>;
  getAiUsageDaily(userId: string, usageDate: string): Promise<AiUsageDailyRecord | null>;
  getCustomTemplate(templateId: string): Promise<CustomTemplateRecord | null>;
  getFormRegistry(registryId: string, ownerUserId: string): Promise<FormRegistryRecord | null>;
  getUserProfile(userId: string): Promise<UserProfileRecord | null>;
  listCustomTemplates(ownerUserId: string): Promise<CustomTemplateRecord[]>;
  listFormRegistries(ownerUserId: string): Promise<FormRegistryRecord[]>;
  listReusableMappings(
    ownerUserId: string,
    registryId?: string,
  ): Promise<ReusableMappingRecord[]>;
  reserveAiUsage(input: {
    dailyLimit: number;
    usageDate: string;
    userId: string;
  }): Promise<AiUsageReserveResult>;
  updateAiEvent(
    eventId: string,
    input: {
      fallbackReason?: AiFallbackReason;
      succeeded: boolean;
    },
  ): Promise<AiEventDbRecord | null>;
  updateCustomTemplate(
    templateId: string,
    ownerUserId: string,
    input: Partial<Pick<CustomTemplateInput, "description" | "status" | "title" | "visibility">>,
  ): Promise<CustomTemplateRecord | null>;
  upsertUserProfile(input: UserProfileInput): Promise<UserProfileRecord>;
}

export class InMemoryMetadataDbAdapter implements MetadataDbAdapter {
  private readonly aiEvents = new Map<string, AiEventDbRecord>();
  private readonly aiUsage = new Map<string, AiUsageDailyRecord>();
  private readonly customTemplates = new Map<string, CustomTemplateRecord>();
  private readonly feedback = new Map<string, FeedbackRecord>();
  private readonly formRegistries = new Map<string, FormRegistryRecord>();
  private readonly formRegistryVersions = new Map<string, FormRegistryVersionRecord>();
  private readonly reusableMappings = new Map<string, ReusableMappingRecord>();
  private readonly templateVersions = new Map<string, TemplateVersionRecord>();
  private readonly userProfiles = new Map<string, UserProfileRecord>();

  async upsertUserProfile(input: UserProfileInput): Promise<UserProfileRecord> {
    const now = new Date().toISOString();
    const existing = this.userProfiles.get(input.id);
    const record: UserProfileRecord = {
      createdAt: existing?.createdAt ?? now,
      displayName: input.displayName ?? existing?.displayName ?? null,
      email: input.email ?? existing?.email ?? null,
      id: input.id,
      lastLoginAt: input.lastLoginAt ?? existing?.lastLoginAt ?? null,
      role: input.role ?? existing?.role ?? "user",
      updatedAt: now,
    };
    this.userProfiles.set(record.id, record);
    return record;
  }

  async getUserProfile(userId: string): Promise<UserProfileRecord | null> {
    return this.userProfiles.get(userId) ?? null;
  }

  async getAiUsageDaily(
    userId: string,
    usageDate: string,
  ): Promise<AiUsageDailyRecord | null> {
    return this.aiUsage.get(usageKey(userId, usageDate)) ?? null;
  }

  async listCustomTemplates(ownerUserId: string): Promise<CustomTemplateRecord[]> {
    return Array.from(this.customTemplates.values()).filter(
      (template) =>
        template.ownerUserId === ownerUserId || template.visibility === "reviewed",
    );
  }

  async getCustomTemplate(templateId: string): Promise<CustomTemplateRecord | null> {
    return this.customTemplates.get(templateId) ?? null;
  }

  async listFormRegistries(ownerUserId: string): Promise<FormRegistryRecord[]> {
    return Array.from(this.formRegistries.values()).filter(
      (registry) =>
        registry.ownerUserId === ownerUserId || registry.visibility === "reviewed",
    );
  }

  async getFormRegistry(
    registryId: string,
    ownerUserId: string,
  ): Promise<FormRegistryRecord | null> {
    const registry = this.formRegistries.get(registryId);
    if (
      !registry ||
      (registry.ownerUserId !== ownerUserId && registry.visibility !== "reviewed")
    ) {
      return null;
    }
    return registry;
  }

  async reserveAiUsage(input: {
    dailyLimit: number;
    usageDate: string;
    userId: string;
  }): Promise<AiUsageReserveResult> {
    const key = usageKey(input.userId, input.usageDate);
    const existing = this.aiUsage.get(key);
    const now = new Date().toISOString();
    const record: AiUsageDailyRecord = existing ?? {
      createdAt: now,
      dailyLimit: input.dailyLimit,
      id: crypto.randomUUID(),
      usedCount: 0,
      updatedAt: now,
      usageDate: input.usageDate,
      userId: input.userId,
    };

    record.dailyLimit = input.dailyLimit;
    record.updatedAt = now;

    if (record.usedCount >= record.dailyLimit) {
      this.aiUsage.set(key, record);
      return {
        record,
        reason: "quota_exceeded",
        reserved: false,
      };
    }

    record.usedCount += 1;
    this.aiUsage.set(key, record);
    return {
      record,
      reserved: true,
    };
  }

  async createAiEvent(input: AiEventDbInput): Promise<AiEventDbRecord> {
    const now = new Date().toISOString();
    const metadata = sanitizeSafeMetadata(input.metadata ?? {});
    const record: AiEventDbRecord = {
      attemptedProviderCall: input.attemptedProviderCall,
      createdAt: now,
      fallbackReason: input.fallbackReason,
      id: crypto.randomUUID(),
      metadata,
      model: input.model,
      promptVersion: input.promptVersion,
      provider: input.provider,
      route: input.route,
      succeeded: input.succeeded ?? false,
      taskType: input.taskType,
      updatedAt: now,
      userId: input.userId,
    };
    this.aiEvents.set(record.id, record);
    return record;
  }

  async updateAiEvent(
    eventId: string,
    input: {
      fallbackReason?: AiFallbackReason;
      succeeded: boolean;
    },
  ): Promise<AiEventDbRecord | null> {
    const existing = this.aiEvents.get(eventId);
    if (!existing) return null;

    const updated: AiEventDbRecord = {
      ...existing,
      fallbackReason: input.fallbackReason,
      succeeded: input.succeeded,
      updatedAt: new Date().toISOString(),
    };
    this.aiEvents.set(eventId, updated);
    return updated;
  }

  async createFeedback(input: FeedbackInput): Promise<FeedbackRecord> {
    const record: FeedbackRecord = {
      ...input,
      comment: input.comment ?? null,
      createdAt: new Date().toISOString(),
      id: crypto.randomUUID(),
      tags: input.tags ?? [],
    };
    this.feedback.set(record.id, record);
    return record;
  }

  async createCustomTemplate(
    input: CustomTemplateInput,
  ): Promise<CustomTemplateRecord> {
    const now = new Date().toISOString();
    const record: CustomTemplateRecord = {
      createdAt: now,
      description: input.description ?? null,
      id: crypto.randomUUID(),
      latestVersionId: null,
      ownerUserId: input.ownerUserId,
      status: input.status ?? "draft",
      title: input.title,
      updatedAt: now,
      visibility: input.visibility ?? "private",
    };
    this.customTemplates.set(record.id, record);
    return record;
  }

  async updateCustomTemplate(
    templateId: string,
    ownerUserId: string,
    input: Partial<Pick<CustomTemplateInput, "description" | "status" | "title" | "visibility">>,
  ): Promise<CustomTemplateRecord | null> {
    const existing = this.customTemplates.get(templateId);
    if (!existing || existing.ownerUserId !== ownerUserId || existing.status === "reviewed") {
      return null;
    }

    const updated: CustomTemplateRecord = {
      ...existing,
      description: input.description ?? existing.description,
      status: input.status ?? existing.status,
      title: input.title ?? existing.title,
      updatedAt: new Date().toISOString(),
      visibility: input.visibility ?? existing.visibility,
    };
    this.customTemplates.set(templateId, updated);
    return updated;
  }

  async createTemplateVersion(
    input: TemplateVersionInput,
  ): Promise<TemplateVersionRecord> {
    const record: TemplateVersionRecord = {
      caveats: input.caveats ?? "",
      createdAt: new Date().toISOString(),
      decisionMaker: input.decisionMaker,
      decisionQuestion: input.decisionQuestion,
      exampleDataSchema: sanitizeSafeMetadata(input.exampleDataSchema ?? {}),
      geographyTimeframe: input.geographyTimeframe,
      id: crypto.randomUUID(),
      intendedAction: input.intendedAction,
      isReviewed: input.isReviewed ?? false,
      requiredEvidence: input.requiredEvidence ?? [],
      reviewStatus: input.reviewStatus ?? "draft",
      reviewedByUserId: input.reviewedByUserId ?? null,
      suggestedFields: (input.suggestedFields ?? []).map((field) =>
        sanitizeSafeMetadata(field),
      ),
      templateId: input.templateId,
      versionNumber: input.versionNumber,
    };
    this.templateVersions.set(record.id, record);
    return record;
  }

  async createFormRegistry(input: FormRegistryInput): Promise<FormRegistryRecord> {
    const now = new Date().toISOString();
    const record: FormRegistryRecord = {
      caveats: input.caveats ?? [],
      createdAt: now,
      description: input.description ?? null,
      fieldCount: input.fieldCount,
      formFamily: input.formFamily,
      id: crypto.randomUUID(),
      mappingCount: input.mappingCount ?? 0,
      ownerUserId: input.ownerUserId,
      requiredFieldCount: input.requiredFieldCount,
      reviewStatus: input.reviewStatus ?? "draft",
      schemaFingerprint: input.schemaFingerprint,
      sourceKind: input.sourceKind,
      title: input.title,
      updatedAt: now,
      visibility: input.visibility ?? "private",
    };
    this.formRegistries.set(record.id, record);
    return record;
  }

  async createFormRegistryVersion(
    input: FormRegistryVersionInput,
  ): Promise<FormRegistryVersionRecord> {
    const record: FormRegistryVersionRecord = {
      caveats: input.caveats ?? [],
      createdAt: new Date().toISOString(),
      evidenceMappings: (input.evidenceMappings ?? []).map((mapping) =>
        sanitizeSafeMetadata(mapping),
      ),
      fieldCount: input.fieldCount,
      fieldSummaries: (input.fieldSummaries ?? []).map((field) =>
        sanitizeSafeMetadata(field),
      ),
      id: crypto.randomUUID(),
      registryId: input.registryId,
      requiredFieldCount: input.requiredFieldCount,
      schemaFingerprint: input.schemaFingerprint,
      sourceKind: input.sourceKind,
      versionNumber: input.versionNumber,
    };
    this.formRegistryVersions.set(record.id, record);
    return record;
  }

  async createReusableMapping(
    input: ReusableMappingInput,
  ): Promise<ReusableMappingRecord> {
    const now = new Date().toISOString();
    const record: ReusableMappingRecord = {
      caveats: input.caveats ?? [],
      confidenceBucket: input.confidenceBucket,
      createdAt: now,
      evidenceNeed: input.evidenceNeed,
      fieldName: input.fieldName,
      id: crypto.randomUUID(),
      ownerUserId: input.ownerUserId,
      rationale: input.rationale ?? null,
      registryId: input.registryId,
      registryVersionId: input.registryVersionId ?? null,
      reviewStatus: input.reviewStatus ?? "needs_review",
      updatedAt: now,
    };
    this.reusableMappings.set(record.id, record);
    return record;
  }

  async listReusableMappings(
    ownerUserId: string,
    registryId?: string,
  ): Promise<ReusableMappingRecord[]> {
    return Array.from(this.reusableMappings.values()).filter(
      (mapping) =>
        mapping.ownerUserId === ownerUserId &&
        (!registryId || mapping.registryId === registryId),
    );
  }

  recordsForTests() {
    return {
      aiEvents: Array.from(this.aiEvents.values()),
      aiUsage: Array.from(this.aiUsage.values()),
      customTemplates: Array.from(this.customTemplates.values()),
      feedback: Array.from(this.feedback.values()),
      formRegistries: Array.from(this.formRegistries.values()),
      formRegistryVersions: Array.from(this.formRegistryVersions.values()),
      reusableMappings: Array.from(this.reusableMappings.values()),
      templateVersions: Array.from(this.templateVersions.values()),
      userProfiles: Array.from(this.userProfiles.values()),
    };
  }
}

export class SupabaseMetadataDbAdapter implements MetadataDbAdapter {
  constructor(private readonly client: SupabaseClient = createServerSupabaseClient()) {}

  async upsertUserProfile(input: UserProfileInput): Promise<UserProfileRecord> {
    const row = await this.single<UserProfileRow>(
      "user_profiles",
      this.client
        .from("user_profiles")
        .upsert(toUserProfileRow(input), { onConflict: "id" })
        .select("*")
        .single(),
    );
    return fromUserProfileRow(row);
  }

  async getUserProfile(userId: string): Promise<UserProfileRecord | null> {
    const row = await this.maybeSingle<UserProfileRow>(
      "user_profiles",
      this.client
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle(),
    );
    return row ? fromUserProfileRow(row) : null;
  }

  async getAiUsageDaily(
    userId: string,
    usageDate: string,
  ): Promise<AiUsageDailyRecord | null> {
    const row = await this.maybeSingle<AiUsageDailyRow>(
      "ai_usage_daily",
      this.client
        .from("ai_usage_daily")
        .select("*")
        .eq("user_id", userId)
        .eq("usage_date", usageDate)
        .maybeSingle(),
    );
    return row ? fromAiUsageDailyRow(row) : null;
  }

  async listCustomTemplates(ownerUserId: string): Promise<CustomTemplateRecord[]> {
    const { data, error } = await this.client
      .from("custom_templates")
      .select("*")
      .or(`owner_user_id.eq.${ownerUserId},visibility.eq.reviewed`)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(`Metadata DB custom_templates read failed: ${error.message}`);
    return (data ?? []).map((row) => fromCustomTemplateRow(row as CustomTemplateRow));
  }

  async getCustomTemplate(templateId: string): Promise<CustomTemplateRecord | null> {
    const row = await this.maybeSingle<CustomTemplateRow>(
      "custom_templates",
      this.client
        .from("custom_templates")
        .select("*")
        .eq("id", templateId)
        .maybeSingle(),
    );
    return row ? fromCustomTemplateRow(row) : null;
  }

  async listFormRegistries(ownerUserId: string): Promise<FormRegistryRecord[]> {
    const { data, error } = await this.client
      .from("form_registries")
      .select("*")
      .or(`owner_user_id.eq.${ownerUserId},visibility.eq.reviewed`)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(`Metadata DB form_registries read failed: ${error.message}`);
    return (data ?? []).map((row) => fromFormRegistryRow(row as FormRegistryRow));
  }

  async getFormRegistry(
    registryId: string,
    ownerUserId: string,
  ): Promise<FormRegistryRecord | null> {
    const row = await this.maybeSingle<FormRegistryRow>(
      "form_registries",
      this.client
        .from("form_registries")
        .select("*")
        .eq("id", registryId)
        .or(`owner_user_id.eq.${ownerUserId},visibility.eq.reviewed`)
        .maybeSingle(),
    );
    return row ? fromFormRegistryRow(row) : null;
  }

  async reserveAiUsage(input: {
    dailyLimit: number;
    usageDate: string;
    userId: string;
  }): Promise<AiUsageReserveResult> {
    const row = await this.single<AiUsageReserveRow>(
      "ai_usage_daily",
      this.client
        .rpc("reserve_ai_usage", {
          p_daily_limit: input.dailyLimit,
          p_usage_date: input.usageDate,
          p_user_id: input.userId,
        })
        .single(),
    );

    const record = fromAiUsageDailyRow(row);
    if (!row.reserved) {
      return {
        record,
        reason: "quota_exceeded",
        reserved: false,
      };
    }

    return {
      record,
      reserved: true,
    };
  }

  async createAiEvent(input: AiEventDbInput): Promise<AiEventDbRecord> {
    const row = await this.single<AiEventRow>(
      "ai_events",
      this.client
        .from("ai_events")
        .insert(toAiEventRow(input))
        .select("*")
        .single(),
    );
    return fromAiEventRow(row);
  }

  async updateAiEvent(
    eventId: string,
    input: {
      fallbackReason?: AiFallbackReason;
      succeeded: boolean;
    },
  ): Promise<AiEventDbRecord | null> {
    const row = await this.maybeSingle<AiEventRow>(
      "ai_events",
      this.client
        .from("ai_events")
        .update({
          fallback_reason: input.fallbackReason,
          succeeded: input.succeeded,
        })
        .eq("id", eventId)
        .select("*")
        .maybeSingle(),
    );
    return row ? fromAiEventRow(row) : null;
  }

  async createFeedback(input: FeedbackInput): Promise<FeedbackRecord> {
    const row = await this.single<FeedbackRow>(
      "feedback",
      this.client
        .from("feedback")
        .insert(toFeedbackRow(input))
        .select("*")
        .single(),
    );
    return fromFeedbackRow(row);
  }

  async createCustomTemplate(
    input: CustomTemplateInput,
  ): Promise<CustomTemplateRecord> {
    const row = await this.single<CustomTemplateRow>(
      "custom_templates",
      this.client
        .from("custom_templates")
        .insert(toCustomTemplateRow(input))
        .select("*")
        .single(),
    );
    return fromCustomTemplateRow(row);
  }

  async updateCustomTemplate(
    templateId: string,
    ownerUserId: string,
    input: Partial<Pick<CustomTemplateInput, "description" | "status" | "title" | "visibility">>,
  ): Promise<CustomTemplateRecord | null> {
    const row = await this.maybeSingle<CustomTemplateRow>(
      "custom_templates",
      this.client
        .from("custom_templates")
        .update(toCustomTemplatePatchRow(input))
        .eq("id", templateId)
        .eq("owner_user_id", ownerUserId)
        .neq("status", "reviewed")
        .select("*")
        .maybeSingle(),
    );
    return row ? fromCustomTemplateRow(row) : null;
  }

  async createTemplateVersion(
    input: TemplateVersionInput,
  ): Promise<TemplateVersionRecord> {
    const row = await this.single<TemplateVersionRow>(
      "template_versions",
      this.client
        .from("template_versions")
        .insert(toTemplateVersionRow(input))
        .select("*")
        .single(),
    );
    return fromTemplateVersionRow(row);
  }

  async createFormRegistry(input: FormRegistryInput): Promise<FormRegistryRecord> {
    const row = await this.single<FormRegistryRow>(
      "form_registries",
      this.client
        .from("form_registries")
        .insert(toFormRegistryRow(input))
        .select("*")
        .single(),
    );
    return fromFormRegistryRow(row);
  }

  async createFormRegistryVersion(
    input: FormRegistryVersionInput,
  ): Promise<FormRegistryVersionRecord> {
    const row = await this.single<FormRegistryVersionRow>(
      "form_registry_versions",
      this.client
        .from("form_registry_versions")
        .insert(toFormRegistryVersionRow(input))
        .select("*")
        .single(),
    );
    return fromFormRegistryVersionRow(row);
  }

  async createReusableMapping(
    input: ReusableMappingInput,
  ): Promise<ReusableMappingRecord> {
    const row = await this.single<ReusableMappingRow>(
      "reusable_mappings",
      this.client
        .from("reusable_mappings")
        .insert(toReusableMappingRow(input))
        .select("*")
        .single(),
    );
    return fromReusableMappingRow(row);
  }

  async listReusableMappings(
    ownerUserId: string,
    registryId?: string,
  ): Promise<ReusableMappingRecord[]> {
    let query = this.client
      .from("reusable_mappings")
      .select("*")
      .eq("owner_user_id", ownerUserId)
      .order("updated_at", { ascending: false });
    if (registryId) query = query.eq("registry_id", registryId);

    const { data, error } = await query;
    if (error) throw new Error(`Metadata DB reusable_mappings read failed: ${error.message}`);
    return (data ?? []).map((row) => fromReusableMappingRow(row as ReusableMappingRow));
  }

  private async single<T>(
    table: ApprovedMetadataTable,
    query: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  ) {
    const { data, error } = await query;
    if (error || !data) {
      throw new Error(`Metadata DB ${table} write failed: ${error?.message ?? "missing row"}`);
    }
    return data;
  }

  private async maybeSingle<T>(
    table: ApprovedMetadataTable,
    query: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  ) {
    const { data, error } = await query;
    if (error) {
      throw new Error(`Metadata DB ${table} read failed: ${error.message}`);
    }
    return data;
  }
}

export function createMetadataDbAdapter() {
  return new SupabaseMetadataDbAdapter();
}

export function sanitizeSafeMetadata(metadata: SafeMetadata): SafeMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(key)) {
        throw new Error(`Unsafe metadata key: ${key}`);
      }

      if (
        value == null ||
        typeof value === "boolean" ||
        (typeof value === "number" && Number.isFinite(value)) ||
        typeof value === "string"
      ) {
        return [key, typeof value === "string" ? value.slice(0, 240) : value];
      }

      throw new Error(`Unsafe metadata value for ${key}. Use scalar metadata only.`);
    }),
  );
}

function usageKey(userId: string, usageDate: string) {
  return `${userId}:${usageDate}`;
}

type UserProfileRow = {
  created_at: string;
  display_name: string | null;
  email: string | null;
  id: string;
  last_login_at: string | null;
  role: UserRole;
  updated_at: string;
};

type AiUsageDailyRow = {
  created_at: string;
  daily_limit: number;
  id: string;
  updated_at: string;
  usage_date: string;
  used_count: number;
  user_id: string;
};

type AiUsageReserveRow = AiUsageDailyRow & {
  reserved: boolean;
};

type AiEventRow = {
  attempted_provider_call: boolean;
  created_at: string;
  fallback_reason: AiFallbackReason | null;
  id: string;
  metadata: SafeMetadata;
  model: string | null;
  prompt_version: string;
  provider: string | null;
  route:
    | "/api/coach"
    | "/api/copilot"
    | "/api/form-schema/interpret"
    | "/api/recommend";
  succeeded: boolean;
  task_type: CopilotTaskType;
  updated_at?: string;
  user_id: string | null;
};

type FeedbackRow = {
  ai_event_id: string | null;
  comment: string | null;
  created_at: string;
  id: string;
  tags: string[];
  template_id: string | null;
  template_version_id: string | null;
  thumb: FeedbackThumb;
  user_id: string;
};

type CustomTemplateRow = {
  created_at: string;
  description: string | null;
  id: string;
  latest_version_id: string | null;
  owner_user_id: string;
  status: TemplateStatus;
  title: string;
  updated_at: string;
  visibility: TemplateVisibility;
};

type TemplateVersionRow = {
  caveats: string;
  created_at: string;
  decision_maker: string;
  decision_question: string;
  example_data_schema: SafeMetadata;
  geography_timeframe: string;
  id: string;
  intended_action: string;
  is_reviewed: boolean;
  required_evidence: string[];
  review_status: TemplateReviewStatus;
  reviewed_by_user_id: string | null;
  suggested_fields: SafeMetadata[];
  template_id: string;
  version_number: number;
};

type FormRegistryRow = {
  caveats: string[];
  created_at: string;
  description: string | null;
  field_count: number;
  form_family: FormFamily;
  id: string;
  mapping_count: number;
  owner_user_id: string;
  required_field_count: number;
  review_status: FormRegistryReviewStatus;
  schema_fingerprint: string;
  source_kind: FormIntakeSourceKind;
  title: string;
  updated_at: string;
  visibility: FormRegistryVisibility;
};

type FormRegistryVersionRow = {
  caveats: string[];
  created_at: string;
  evidence_mappings: SafeMetadata[];
  field_count: number;
  field_summaries: SafeMetadata[];
  id: string;
  registry_id: string;
  required_field_count: number;
  schema_fingerprint: string;
  source_kind: FormIntakeSourceKind;
  version_number: number;
};

type ReusableMappingRow = {
  caveats: string[];
  confidence_bucket: MappingConfidenceBucket;
  created_at: string;
  evidence_need: string;
  field_name: string;
  id: string;
  owner_user_id: string;
  rationale: string | null;
  registry_id: string;
  registry_version_id: string | null;
  review_status: MappingReviewStatus;
  updated_at: string;
};

function toUserProfileRow(input: UserProfileInput) {
  return {
    display_name: input.displayName,
    email: input.email,
    id: input.id,
    last_login_at: input.lastLoginAt,
    role: input.role ?? "user",
  };
}

function fromUserProfileRow(row: UserProfileRow): UserProfileRecord {
  return {
    createdAt: row.created_at,
    displayName: row.display_name,
    email: row.email,
    id: row.id,
    lastLoginAt: row.last_login_at,
    role: row.role,
    updatedAt: row.updated_at,
  };
}

function fromAiUsageDailyRow(row: AiUsageDailyRow): AiUsageDailyRecord {
  return {
    createdAt: row.created_at,
    dailyLimit: row.daily_limit,
    id: row.id,
    updatedAt: row.updated_at,
    usageDate: row.usage_date,
    usedCount: row.used_count,
    userId: row.user_id,
  };
}

function toAiEventRow(input: AiEventDbInput) {
  return {
    attempted_provider_call: input.attemptedProviderCall,
    fallback_reason: input.fallbackReason,
    metadata: sanitizeSafeMetadata(input.metadata ?? {}),
    model: input.model,
    prompt_version: input.promptVersion,
    provider: input.provider,
    route: input.route,
    succeeded: input.succeeded ?? false,
    task_type: input.taskType,
    user_id: input.userId,
  };
}

function fromAiEventRow(row: AiEventRow): AiEventDbRecord {
  return {
    attemptedProviderCall: row.attempted_provider_call,
    createdAt: row.created_at,
    fallbackReason: row.fallback_reason ?? undefined,
    id: row.id,
    metadata: row.metadata,
    model: row.model ?? undefined,
    promptVersion: row.prompt_version,
    provider: row.provider ?? undefined,
    route: row.route,
    succeeded: row.succeeded,
    taskType: row.task_type,
    updatedAt: row.updated_at ?? row.created_at,
    userId: row.user_id ?? undefined,
  };
}

function toFeedbackRow(input: FeedbackInput) {
  return {
    ai_event_id: input.aiEventId,
    comment: input.comment,
    tags: input.tags ?? [],
    template_id: input.templateId,
    template_version_id: input.templateVersionId,
    thumb: input.thumb,
    user_id: input.userId,
  };
}

function fromFeedbackRow(row: FeedbackRow): FeedbackRecord {
  return {
    aiEventId: row.ai_event_id,
    comment: row.comment,
    createdAt: row.created_at,
    id: row.id,
    tags: row.tags,
    templateId: row.template_id,
    templateVersionId: row.template_version_id,
    thumb: row.thumb,
    userId: row.user_id,
  };
}

function toCustomTemplateRow(input: CustomTemplateInput) {
  return {
    description: input.description,
    owner_user_id: input.ownerUserId,
    status: input.status ?? "draft",
    title: input.title,
    visibility: input.visibility ?? "private",
  };
}

function toCustomTemplatePatchRow(
  input: Partial<Pick<CustomTemplateInput, "description" | "status" | "title" | "visibility">>,
) {
  return Object.fromEntries(
    Object.entries({
      description: input.description,
      status: input.status,
      title: input.title,
      visibility: input.visibility,
    }).filter(([, value]) => value !== undefined),
  );
}

function fromCustomTemplateRow(row: CustomTemplateRow): CustomTemplateRecord {
  return {
    createdAt: row.created_at,
    description: row.description,
    id: row.id,
    latestVersionId: row.latest_version_id,
    ownerUserId: row.owner_user_id,
    status: row.status,
    title: row.title,
    updatedAt: row.updated_at,
    visibility: row.visibility,
  };
}

function toTemplateVersionRow(input: TemplateVersionInput) {
  return {
    caveats: input.caveats ?? "",
    decision_maker: input.decisionMaker,
    decision_question: input.decisionQuestion,
    example_data_schema: sanitizeSafeMetadata(input.exampleDataSchema ?? {}),
    geography_timeframe: input.geographyTimeframe,
    intended_action: input.intendedAction,
    is_reviewed: input.isReviewed ?? false,
    required_evidence: input.requiredEvidence ?? [],
    review_status: input.reviewStatus ?? "draft",
    reviewed_by_user_id: input.reviewedByUserId,
    suggested_fields: (input.suggestedFields ?? []).map((field) =>
      sanitizeSafeMetadata(field),
    ),
    template_id: input.templateId,
    version_number: input.versionNumber,
  };
}

function fromTemplateVersionRow(row: TemplateVersionRow): TemplateVersionRecord {
  return {
    caveats: row.caveats,
    createdAt: row.created_at,
    decisionMaker: row.decision_maker,
    decisionQuestion: row.decision_question,
    exampleDataSchema: row.example_data_schema,
    geographyTimeframe: row.geography_timeframe,
    id: row.id,
    intendedAction: row.intended_action,
    isReviewed: row.is_reviewed,
    requiredEvidence: row.required_evidence,
    reviewStatus: row.review_status,
    reviewedByUserId: row.reviewed_by_user_id,
    suggestedFields: row.suggested_fields,
    templateId: row.template_id,
    versionNumber: row.version_number,
  };
}

function toFormRegistryRow(input: FormRegistryInput) {
  return {
    caveats: input.caveats ?? [],
    description: input.description,
    field_count: input.fieldCount,
    form_family: input.formFamily,
    mapping_count: input.mappingCount ?? 0,
    owner_user_id: input.ownerUserId,
    required_field_count: input.requiredFieldCount,
    review_status: input.reviewStatus ?? "draft",
    schema_fingerprint: input.schemaFingerprint,
    source_kind: input.sourceKind,
    title: input.title,
    visibility: input.visibility ?? "private",
  };
}

function fromFormRegistryRow(row: FormRegistryRow): FormRegistryRecord {
  return {
    caveats: row.caveats,
    createdAt: row.created_at,
    description: row.description,
    fieldCount: row.field_count,
    formFamily: row.form_family,
    id: row.id,
    mappingCount: row.mapping_count,
    ownerUserId: row.owner_user_id,
    requiredFieldCount: row.required_field_count,
    reviewStatus: row.review_status,
    schemaFingerprint: row.schema_fingerprint,
    sourceKind: row.source_kind,
    title: row.title,
    updatedAt: row.updated_at,
    visibility: row.visibility,
  };
}

function toFormRegistryVersionRow(input: FormRegistryVersionInput) {
  return {
    caveats: input.caveats ?? [],
    evidence_mappings: (input.evidenceMappings ?? []).map((mapping) =>
      sanitizeSafeMetadata(mapping),
    ),
    field_count: input.fieldCount,
    field_summaries: (input.fieldSummaries ?? []).map((field) =>
      sanitizeSafeMetadata(field),
    ),
    registry_id: input.registryId,
    required_field_count: input.requiredFieldCount,
    schema_fingerprint: input.schemaFingerprint,
    source_kind: input.sourceKind,
    version_number: input.versionNumber,
  };
}

function fromFormRegistryVersionRow(
  row: FormRegistryVersionRow,
): FormRegistryVersionRecord {
  return {
    caveats: row.caveats,
    createdAt: row.created_at,
    evidenceMappings: row.evidence_mappings.map((mapping) =>
      sanitizeSafeMetadata(mapping),
    ),
    fieldCount: row.field_count,
    fieldSummaries: row.field_summaries.map((field) => sanitizeSafeMetadata(field)),
    id: row.id,
    registryId: row.registry_id,
    requiredFieldCount: row.required_field_count,
    schemaFingerprint: row.schema_fingerprint,
    sourceKind: row.source_kind,
    versionNumber: row.version_number,
  };
}

function toReusableMappingRow(input: ReusableMappingInput) {
  return {
    caveats: input.caveats ?? [],
    confidence_bucket: input.confidenceBucket,
    evidence_need: input.evidenceNeed,
    field_name: input.fieldName,
    owner_user_id: input.ownerUserId,
    rationale: input.rationale,
    registry_id: input.registryId,
    registry_version_id: input.registryVersionId,
    review_status: input.reviewStatus ?? "needs_review",
  };
}

function fromReusableMappingRow(row: ReusableMappingRow): ReusableMappingRecord {
  return {
    caveats: row.caveats,
    confidenceBucket: row.confidence_bucket,
    createdAt: row.created_at,
    evidenceNeed: row.evidence_need,
    fieldName: row.field_name,
    id: row.id,
    ownerUserId: row.owner_user_id,
    rationale: row.rationale,
    registryId: row.registry_id,
    registryVersionId: row.registry_version_id,
    reviewStatus: row.review_status,
    updatedAt: row.updated_at,
  };
}
