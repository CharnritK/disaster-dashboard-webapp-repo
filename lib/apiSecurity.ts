import { createHash } from "node:crypto";

export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type JsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; status: number; error: string };

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  now = Date.now()
) {
  if (config.maxRequests <= 0) {
    return { limited: false, remaining: Number.POSITIVE_INFINITY, retryAfterSeconds: 0 };
  }

  pruneExpiredBuckets(now);
  const hashedKey = hashKey(key);
  const existing = rateLimitBuckets.get(hashedKey);
  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(hashedKey, {
      count: 1,
      resetAt: now + config.windowMs
    });
    return {
      limited: false,
      remaining: Math.max(config.maxRequests - 1, 0),
      retryAfterSeconds: 0
    };
  }

  if (existing.count >= config.maxRequests) {
    return {
      limited: true,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  existing.count += 1;
  return {
    limited: false,
    remaining: Math.max(config.maxRequests - existing.count, 0),
    retryAfterSeconds: 0
  };
}

export async function readJsonRequest(
  request: Request,
  maxBytes: number
): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, status: 415, error: "Content-Type must be application/json." };
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, status: 413, error: "Recommendation request is too large." };
  }

  const bodyText = await readRequestText(request, maxBytes);
  if (!bodyText.ok) return bodyText;

  try {
    return { ok: true, body: JSON.parse(bodyText.text) };
  } catch {
    return { ok: false, status: 400, error: "Request body must be valid JSON." };
  }
}

export function clientKeyForRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  return cloudflareIp || forwardedFor || realIp || "anonymous-client";
}

export function anonymousSafetyIdentifier(key: string) {
  return `anon_${hashKey(key).slice(0, 32)}`;
}

async function readRequestText(
  request: Request,
  maxBytes: number
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const reader = request.body?.getReader();
  if (!reader) {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      return { ok: false, status: 413, error: "Recommendation request is too large." };
    }
    return { ok: true, text };
  }

  const decoder = new TextDecoder();
  let text = "";
  let receivedBytes = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    receivedBytes += value.byteLength;
    if (receivedBytes > maxBytes) {
      return { ok: false, status: 413, error: "Recommendation request is too large." };
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return { ok: true, text };
}

function pruneExpiredBuckets(now: number) {
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }
}

function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}
