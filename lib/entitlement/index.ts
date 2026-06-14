import type {
  AIRecommendationResponse,
  CopilotTaskType,
} from "@/types/recommendations";
import { promptVersionForTask } from "@/lib/ai/promptVersions";
import {
  createMetadataDbAdapter,
  type MetadataDbAdapter,
} from "@/lib/db/metadataAdapter";

export type AiFallbackReason = NonNullable<AIRecommendationResponse["fallbackReason"]>;

export type AiEntitlementSubject =
  | string
  | {
      email?: string;
      source?: "supabase" | "test";
      userId: string;
    };

export type AiEntitlementDecision = {
  allowed: boolean;
  reason?: Extract<AiFallbackReason, "not_entitled" | "quota_exceeded">;
  usageDate: string;
  used: number;
  limit: number;
};

export type AiUsageReservation =
  | {
      reserved: true;
      usageDate: string;
      used: number;
      limit: number;
    }
  | {
      reserved: false;
      reason: Extract<AiFallbackReason, "quota_exceeded">;
      usageDate: string;
      used: number;
      limit: number;
    };

export type AiUsageSnapshot = {
  localDate: string;
  limit: number;
  used: number;
  remaining: number;
};

export type AiEventInput = {
  attemptedProviderCall: boolean;
  fallbackReason?: AiFallbackReason;
  metadata?: Record<string, string | number | boolean | null | undefined>;
  model?: string;
  promptVersion?: string;
  provider?: string;
  route: "/api/coach" | "/api/recommend" | "/api/copilot";
  succeeded?: boolean;
  taskType: CopilotTaskType;
  userId?: string;
};

export type AiEventRecord = AiEventInput & {
  createdAt: string;
  id: string;
  metadata: Record<string, string | number | boolean | null | undefined>;
  promptVersion: string;
  succeeded: boolean;
  updatedAt: string;
};

type UsageBucket = {
  dailyLimit: number;
  used: number;
};

type EntitlementOptions = {
  dailyLimit?: () => number;
};

const DEFAULT_TIME_ZONE = "Asia/Bangkok";
const globalForEntitlement = globalThis as typeof globalThis & {
  __dashboardCopilotEntitlementStore?: InMemoryEntitlementStore | MetadataEntitlementStore;
};

export class InMemoryEntitlementStore {
  private readonly dailyLimit: () => number;
  private readonly events = new Map<string, AiEventRecord>();
  private readonly usage = new Map<string, UsageBucket>();

  constructor(options: EntitlementOptions = {}) {
    this.dailyLimit = options.dailyLimit ?? (() => readDailyAiQuota());
  }

  async checkAiEntitlement(
    subject: AiEntitlementSubject,
    _taskType: CopilotTaskType,
    now = new Date(),
  ): Promise<AiEntitlementDecision> {
    const identity = entitlementIdentity(subject);
    const usageDate = usageLocalDate(now);
    const snapshot = await this.getDailyUsage(identity.userId, usageDate);
    if (!isAiBetaEntitled(identity)) {
      return {
        allowed: false,
        reason: "not_entitled",
        usageDate,
        used: snapshot.used,
        limit: snapshot.limit,
      };
    }

    if (snapshot.used >= snapshot.limit) {
      return {
        allowed: false,
        reason: "quota_exceeded",
        usageDate,
        used: snapshot.used,
        limit: snapshot.limit,
      };
    }

    return {
      allowed: true,
      usageDate,
      used: snapshot.used,
      limit: snapshot.limit,
    };
  }

  async reserveAiUsage(
    userId: string,
    usageDate: string,
    _taskType: CopilotTaskType,
  ): Promise<AiUsageReservation> {
    const bucket = this.bucketFor(userId, usageDate);
    if (bucket.used >= bucket.dailyLimit) {
      return {
        reserved: false,
        reason: "quota_exceeded",
        usageDate,
        used: bucket.used,
        limit: bucket.dailyLimit,
      };
    }

    bucket.used += 1;
    return {
      reserved: true,
      usageDate,
      used: bucket.used,
      limit: bucket.dailyLimit,
    };
  }

  async recordAiEvent(input: AiEventInput): Promise<AiEventRecord> {
    const now = new Date().toISOString();
    const record: AiEventRecord = {
      ...input,
      createdAt: now,
      id: crypto.randomUUID(),
      metadata: sanitizeAiEventMetadata(input.metadata ?? {}),
      promptVersion: input.promptVersion ?? promptVersionForTask(input.taskType),
      succeeded: input.succeeded ?? false,
      updatedAt: now,
    };
    this.events.set(record.id, record);
    return record;
  }

  async markAiEventComplete(
    eventId: string,
    outcome: {
      fallbackReason?: AiFallbackReason;
      succeeded: boolean;
    },
  ): Promise<AiEventRecord | undefined> {
    const existing = this.events.get(eventId);
    if (!existing) return undefined;
    const updated: AiEventRecord = {
      ...existing,
      fallbackReason: outcome.fallbackReason,
      succeeded: outcome.succeeded,
      updatedAt: new Date().toISOString(),
    };
    this.events.set(eventId, updated);
    return updated;
  }

  async getDailyUsage(
    userId: string,
    localDate = usageLocalDate(),
  ): Promise<AiUsageSnapshot> {
    const bucket = this.bucketFor(userId, localDate);
    return {
      localDate,
      limit: bucket.dailyLimit,
      remaining: Math.max(bucket.dailyLimit - bucket.used, 0),
      used: bucket.used,
    };
  }

  eventRecordsForTests() {
    return Array.from(this.events.values());
  }

  resetForTests() {
    this.events.clear();
    this.usage.clear();
  }

  private bucketFor(userId: string, localDate: string) {
    const key = `${userId}:${localDate}`;
    const existing = this.usage.get(key);
    const dailyLimit = this.dailyLimit();
    if (existing) {
      existing.dailyLimit = dailyLimit;
      return existing;
    }

    const created = { dailyLimit, used: 0 };
    this.usage.set(key, created);
    return created;
  }
}

export class MetadataEntitlementStore {
  private readonly dailyLimit: () => number;

  constructor(
    private readonly adapter: MetadataDbAdapter,
    options: EntitlementOptions = {},
  ) {
    this.dailyLimit = options.dailyLimit ?? (() => readDailyAiQuota());
  }

  async checkAiEntitlement(
    subject: AiEntitlementSubject,
    _taskType: CopilotTaskType,
    now = new Date(),
  ): Promise<AiEntitlementDecision> {
    const identity = entitlementIdentity(subject);
    const usageDate = usageLocalDate(now);
    const snapshot = await this.getDailyUsage(identity.userId, usageDate);
    if (!isAiBetaEntitled(identity)) {
      return {
        allowed: false,
        reason: "not_entitled",
        usageDate,
        used: snapshot.used,
        limit: snapshot.limit,
      };
    }

    if (snapshot.used >= snapshot.limit) {
      return {
        allowed: false,
        reason: "quota_exceeded",
        usageDate,
        used: snapshot.used,
        limit: snapshot.limit,
      };
    }

    return {
      allowed: true,
      usageDate,
      used: snapshot.used,
      limit: snapshot.limit,
    };
  }

  async reserveAiUsage(
    userId: string,
    usageDate: string,
    _taskType: CopilotTaskType,
  ): Promise<AiUsageReservation> {
    const result = await this.adapter.reserveAiUsage({
      dailyLimit: this.dailyLimit(),
      usageDate,
      userId,
    });

    if (!result.reserved) {
      return {
        limit: result.record.dailyLimit,
        reason: result.reason,
        reserved: false,
        usageDate: result.record.usageDate,
        used: result.record.usedCount,
      };
    }

    return {
      limit: result.record.dailyLimit,
      reserved: true,
      usageDate: result.record.usageDate,
      used: result.record.usedCount,
    };
  }

  async recordAiEvent(input: AiEventInput): Promise<AiEventRecord> {
    const record = await this.adapter.createAiEvent({
      ...input,
      metadata: sanitizeAiEventMetadata(input.metadata ?? {}),
      promptVersion: input.promptVersion ?? promptVersionForTask(input.taskType),
    });

    return {
      attemptedProviderCall: record.attemptedProviderCall,
      createdAt: record.createdAt,
      fallbackReason: record.fallbackReason,
      id: record.id,
      metadata: record.metadata,
      model: record.model,
      promptVersion: record.promptVersion,
      provider: record.provider,
      route: record.route,
      succeeded: record.succeeded,
      taskType: record.taskType,
      updatedAt: record.updatedAt,
      userId: record.userId,
    };
  }

  async markAiEventComplete(
    eventId: string,
    outcome: {
      fallbackReason?: AiFallbackReason;
      succeeded: boolean;
    },
  ): Promise<AiEventRecord | undefined> {
    const record = await this.adapter.updateAiEvent(eventId, outcome);
    if (!record) return undefined;

    return {
      attemptedProviderCall: record.attemptedProviderCall,
      createdAt: record.createdAt,
      fallbackReason: record.fallbackReason,
      id: record.id,
      metadata: record.metadata,
      model: record.model,
      promptVersion: record.promptVersion,
      provider: record.provider,
      route: record.route,
      succeeded: record.succeeded,
      taskType: record.taskType,
      updatedAt: record.updatedAt,
      userId: record.userId,
    };
  }

  async getDailyUsage(
    userId: string,
    localDate = usageLocalDate(),
  ): Promise<AiUsageSnapshot> {
    const dailyLimit = this.dailyLimit();
    const record = await this.adapter.getAiUsageDaily(userId, localDate);
    const used = record?.usedCount ?? 0;

    return {
      localDate,
      limit: record?.dailyLimit ?? dailyLimit,
      remaining: Math.max((record?.dailyLimit ?? dailyLimit) - used, 0),
      used,
    };
  }

  eventRecordsForTests() {
    return [];
  }

  resetForTests() {
    // Supabase-backed stores are not reset through the app test helper.
  }
}

export function getEntitlementService() {
  globalForEntitlement.__dashboardCopilotEntitlementStore ??=
    process.env.AI_USAGE_STORE === "supabase"
      ? new MetadataEntitlementStore(createMetadataDbAdapter())
      : new InMemoryEntitlementStore();
  return globalForEntitlement.__dashboardCopilotEntitlementStore;
}

export function resetEntitlementServiceForTests() {
  getEntitlementService().resetForTests();
}

export function readDailyAiQuota(env: NodeJS.ProcessEnv = process.env) {
  const raw = env.AI_DAILY_QUOTA;
  if (!raw) return 20;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 20;
}

export function usageLocalDate(
  date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function entitlementIdentity(subject: AiEntitlementSubject) {
  if (typeof subject === "string") {
    return {
      source: "test" as const,
      userId: subject,
    };
  }

  return {
    email: subject.email,
    source: subject.source ?? "supabase",
    userId: subject.userId,
  };
}

export function isAiBetaEntitled(
  subject: ReturnType<typeof entitlementIdentity>,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (subject.source === "test") return true;
  if (env.AI_BETA_ALLOW_ALL_AUTHENTICATED === "true") return true;

  const allowedUserIds = envList(env.AI_BETA_ALLOWED_USER_IDS);
  const allowedEmails = envList(env.AI_BETA_ALLOWED_EMAILS).map((email) =>
    email.toLowerCase(),
  );

  return (
    allowedUserIds.includes(subject.userId) ||
    Boolean(subject.email && allowedEmails.includes(subject.email.toLowerCase()))
  );
}

function envList(value: string | undefined) {
  return (value ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeAiEventMetadata(
  metadata: Record<string, unknown>,
): Record<string, string | number | boolean | null | undefined> {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => {
      if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(key)) {
        throw new Error(`Unsafe AI event metadata key: ${key}`);
      }

      if (/prompt|row|sample|response/i.test(key)) {
        throw new Error(`Unsafe AI event metadata key: ${key}`);
      }

      if (
        value == null ||
        typeof value === "boolean" ||
        (typeof value === "number" && Number.isFinite(value)) ||
        typeof value === "string"
      ) {
        return [key, typeof value === "string" ? value.slice(0, 240) : value];
      }

      throw new Error(`Unsafe AI event metadata value for ${key}. Use scalar metadata only.`);
    }),
  );
}
