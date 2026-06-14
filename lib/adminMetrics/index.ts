import { getMetadataDbAdapter } from "@/lib/db/metadataRuntime";
import { createServerSupabaseClient } from "@/lib/db/serverClient";

type MetadataSnapshot = {
  aiEvents: Array<{ fallbackReason?: string }>;
  customTemplates: unknown[];
  feedback: Array<{ tags?: string[] }>;
};

export function isAdminUser(
  userId: string,
  email?: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  const ids = envList(env.ADMIN_USER_IDS);
  const emails = envList(env.ADMIN_EMAILS).map((value) => value.toLowerCase());
  return ids.includes(userId) || Boolean(email && emails.includes(email.toLowerCase()));
}

export async function aggregateUsageSummary() {
  if (process.env.METADATA_STORE === "supabase") {
    return aggregateSupabaseMetadataSummary();
  }

  const snapshot = metadataSnapshot();
  if (snapshot) {
    return {
      fallbackReasons: topValues(snapshot.aiEvents.map((event) => event.fallbackReason)),
      feedbackCount: snapshot.feedback.length,
      feedbackTags: topValues(snapshot.feedback.flatMap((item) => item.tags ?? [])),
      templateCount: snapshot.customTemplates.length,
      usageEvents: snapshot.aiEvents.length,
    };
  }

  return {
    feedbackCount: 0,
    fallbackReasons: [],
    feedbackTags: [],
    templateCount: 0,
    usageEvents: 0,
  };
}

function envList(value: string | undefined) {
  return (value ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function metadataSnapshot() {
  const adapter = getMetadataDbAdapter() as {
    recordsForTests?: () => MetadataSnapshot;
  };
  return adapter.recordsForTests?.();
}

function topValues(values: Array<string | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ count, value }));
}

async function aggregateSupabaseMetadataSummary() {
  try {
    const client = createServerSupabaseClient();
    const [events, feedback, templates] = await Promise.all([
      client
        .from("ai_events")
        .select("fallback_reason", { count: "exact" })
        .limit(500),
      client
        .from("feedback")
        .select("tags", { count: "exact" })
        .limit(500),
      client
        .from("custom_templates")
        .select("id", { count: "exact", head: true }),
    ]);

    const fallbackReasons = Array.isArray(events.data)
      ? topValues(events.data.map((row) =>
          typeof row.fallback_reason === "string" ? row.fallback_reason : undefined,
        ))
      : [];
    const feedbackTags = Array.isArray(feedback.data)
      ? topValues(feedback.data.flatMap((row) =>
          Array.isArray(row.tags)
            ? row.tags.filter((tag): tag is string => typeof tag === "string")
            : [],
        ))
      : [];

    return {
      fallbackReasons,
      feedbackCount: feedback.count ?? 0,
      feedbackTags,
      templateCount: templates.count ?? 0,
      usageEvents: events.count ?? 0,
    };
  } catch {
    return {
      feedbackCount: 0,
      fallbackReasons: [],
      feedbackTags: [],
      templateCount: 0,
      usageEvents: 0,
    };
  }
}
