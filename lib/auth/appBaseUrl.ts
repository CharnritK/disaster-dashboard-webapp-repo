export function getAuthAppBaseUrl(
  request: Request,
  env: NodeJS.ProcessEnv = process.env,
) {
  const configured = env.APP_BASE_URL?.trim();
  if (configured) {
    return safeBaseUrl(configured, env);
  }

  if (env.NODE_ENV === "production") return null;

  return safeBaseUrl(new URL(request.url).origin, env);
}

function safeBaseUrl(value: string, env: NodeJS.ProcessEnv) {
  try {
    const url = new URL(value);
    if (url.pathname !== "/" || url.search || url.hash) return null;
    if (url.protocol === "https:") return url;
    if (url.protocol === "http:" && isLocalHost(url.hostname) && env.NODE_ENV !== "production") {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
