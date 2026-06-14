export const DEFAULT_AUTH_REDIRECT_PATH = "/app";

export function normalizeAuthRedirectPath(
  value: unknown,
  fallback = DEFAULT_AUTH_REDIRECT_PATH,
) {
  if (typeof value !== "string") return fallback;

  const path = value.trim();
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path === "/login" ||
    path.startsWith("/login?") ||
    path === "/auth" ||
    path.startsWith("/auth/") ||
    path === "/api" ||
    path.startsWith("/api/") ||
    path === "/_next" ||
    path.startsWith("/_next/")
  ) {
    return fallback;
  }

  return path.slice(0, 240);
}

export function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
