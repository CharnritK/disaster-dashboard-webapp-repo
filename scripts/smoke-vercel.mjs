#!/usr/bin/env node

const args = new Set(process.argv.slice(2));
const urlArg = process.argv.find((arg) => arg.startsWith("--url="));
const urlValue = urlArg?.slice("--url=".length);
const dryRun = args.has("--dry-run") || !urlValue;

const checks = [
  "GET / should return 200.",
  "GET /api/recommend/status should return 200 with safe status only.",
  "GET /api/usage should return 401 without auth and no usage counts.",
  "Manual: confirm Vercel logs contain no secrets, rows, prompts, or exported artifacts.",
  "Manual: if a preview DB is attached, confirm deterministic public flow creates no metadata rows.",
];

if (dryRun) {
  console.log("Dashboard Copilot Vercel smoke dry run");
  for (const check of checks) console.log(`- ${check}`);
  console.log("Pass --url=https://preview.example.com to run public HTTP checks.");
  process.exit(0);
}

const baseUrl = normalizeUrl(urlValue);
const failures = [];

await checkGet("/", (response) => response.status === 200);
await checkJson("/api/recommend/status", (response, body) => {
  const serialized = JSON.stringify(body);
  return (
    response.status === 200 &&
    body?.ok === true &&
    typeof body?.ai?.mode === "string" &&
    !/hasApiKey|apiKey|provider|model|secret|LLM_API_KEY|OPENAI_API_KEY/i.test(serialized) &&
    response.headers.get("cache-control")?.includes("no-store")
  );
});
await checkJson("/api/usage", (response, body) => {
  const serialized = JSON.stringify(body);
  return (
    response.status === 401 &&
    body?.authenticated === false &&
    body?.fallbackReason === "unauthenticated" &&
    !/"used"|"remaining"|"limit"|"localDate"/.test(serialized)
  );
});

if (failures.length > 0) {
  console.error("Smoke checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Smoke checks passed for ${baseUrl}`);
console.log("Manual follow-up still required: Vercel logs and DB row checks.");

async function checkGet(path, predicate) {
  const response = await fetchUrl(path);
  if (!predicate(response)) {
    failures.push(`${path} returned ${response.status}`);
  }
}

async function checkJson(path, predicate) {
  const response = await fetchUrl(path);
  const body = await response.json().catch(() => null);
  if (!predicate(response, body)) {
    failures.push(`${path} returned unexpected response: ${response.status} ${JSON.stringify(body)}`);
  }
}

async function fetchUrl(path) {
  try {
    return await fetch(new URL(path, baseUrl), {
      headers: {
        accept: "application/json,text/html;q=0.9,*/*;q=0.8",
      },
    });
  } catch (error) {
    failures.push(`${path} request failed: ${error instanceof Error ? error.message : String(error)}`);
    return new Response(null, { status: 599 });
  }
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    console.error(`Invalid --url value: ${value}`);
    process.exit(1);
  }
}
