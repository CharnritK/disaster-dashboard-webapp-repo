import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.VERCEL === "1" || process.env.VERCEL === "true") {
  console.log("Skipping Codex Sites dist post-processing during Vercel build.");
  process.exit(0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");
const server = path.join(dist, "server");

await rm(client, { recursive: true, force: true });
await rm(path.join(dist, "cache"), { recursive: true, force: true });
await rm(path.join(dist, "diagnostics"), { recursive: true, force: true });
await rm(path.join(dist, "types"), { recursive: true, force: true });
await rm(path.join(dist, "trace"), { force: true });
await rm(path.join(dist, "_appgen_meta"), { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(path.join(client, "_next"), { recursive: true });

await copyTopLevelHtmlRoutes(path.join(server, "app"), client);
await copyIfExists(path.join(server, "app", "demo.html"), path.join(client, "index.html"));
await copyIfExists(path.join(server, "app", "_not-found.html"), path.join(client, "404.html"));
await copyIfExists(path.join(server, "app", "icon.svg.body"), path.join(client, "icon.svg"));
await copyIfExists(path.join(dist, "static"), path.join(client, "_next", "static"));
await copyIfExists(path.join(root, "public"), client);

await writeFile(
  path.join(server, "index.js"),
  `const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-DNS-Prefetch-Control": "off",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function requestForPath(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url, request);
}

async function serveAsset(request, env, pathname) {
  return env.ASSETS.fetch(requestForPath(request, pathname));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        { error: "AI API routes are disabled on this Codex Sites static build." },
        { status: 404, headers: SECURITY_HEADERS }
      );
    }

    let response;
    if (url.pathname === "/") {
      response = await serveAsset(request, env, "/index.html");
    } else if (!url.pathname.includes(".")) {
      response = await serveAsset(request, env, \`\${url.pathname}.html\`);
      if (response.status === 404) {
        response = await serveAsset(request, env, "/index.html");
      }
    } else {
      response = await env.ASSETS.fetch(request);
    }

    return withSecurityHeaders(response);
  },
};
`,
);

async function copyIfExists(source, destination) {
  if (!existsSync(source)) return;
  await cp(source, destination, { recursive: true, force: true });
}

async function copyTopLevelHtmlRoutes(sourceDir, destinationDir) {
  if (!existsSync(sourceDir)) return;
  const entries = await readdir(sourceDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .map((entry) =>
        copyIfExists(path.join(sourceDir, entry.name), path.join(destinationDir, entry.name)),
      ),
  );
}
