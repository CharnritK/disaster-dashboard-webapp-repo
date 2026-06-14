export type SignInErrorCode = "auth_failed" | "auth_rate_limited";

export function signInErrorCode(error: unknown): SignInErrorCode {
  if (isRecord(error)) {
    const status = typeof error.status === "number" ? error.status : undefined;
    const message = typeof error.message === "string" ? error.message : "";
    const code = typeof error.code === "string" ? error.code : "";
    const normalized = `${code} ${message}`.toLowerCase();

    if (
      status === 429 ||
      normalized.includes("rate limit") ||
      normalized.includes("security purposes") ||
      normalized.includes("only request")
    ) {
      return "auth_rate_limited";
    }
  }

  return "auth_failed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
