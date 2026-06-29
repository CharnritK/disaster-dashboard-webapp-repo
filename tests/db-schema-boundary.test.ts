import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REQUIRED_TABLES = [
  "user_profiles",
  "ai_usage_daily",
  "ai_events",
  "feedback",
  "custom_templates",
  "form_registries",
  "form_registry_versions",
  "reusable_mappings",
  "template_versions",
];

describe("metadata database drafts", () => {
  it("defines only the approved metadata tables", () => {
    const schema = readText("db/schema.sql");
    const declaredTables = Array.from(
      schema.matchAll(/create table if not exists public\.([a-z_]+)/g),
      (match) => match[1],
    ).sort();

    for (const table of REQUIRED_TABLES) {
      expect(schema).toContain(`public.${table}`);
    }

    expect(declaredTables).toEqual([...REQUIRED_TABLES].sort());
    expect(declaredTables).not.toEqual(
      expect.arrayContaining([
        "dataset_rows",
        "exports",
        "files",
        "model_responses",
        "prepared_rows",
        "prompt_bodies",
        "screenshots",
        "uploaded_rows",
      ]),
    );
  });

  it("enables RLS and owner policies for every metadata table", () => {
    const rls = readText("db/rls.sql");

    for (const table of REQUIRED_TABLES) {
      expect(rls).toContain(`alter table public.${table} enable row level security`);
    }

    expect(rls).toMatch(/auth\.uid\(\)/);
    expect(rls).toMatch(/grant select on table public\.ai_usage_daily to authenticated/i);
    expect(rls).toMatch(/grant select on table public\.ai_events to authenticated/i);
    expect(rls).toMatch(/grant select, insert on table public\.form_registries to authenticated/i);
    expect(rls).toMatch(/grant select, insert on table public\.form_registry_versions to authenticated/i);
    expect(rls).toMatch(/grant select, insert on table public\.reusable_mappings to authenticated/i);
    expect(rls).not.toMatch(/grant\s+(?:insert|update|delete)[^;]+public\.ai_usage_daily\s+to authenticated/i);
    expect(rls).not.toMatch(/grant\s+(?:insert|update|delete)[^;]+public\.ai_events\s+to authenticated/i);
    expect(rls).not.toMatch(/grant\s+[^;]*update[^;]+public\.form_registries\s+to authenticated/i);
    expect(rls).not.toMatch(/grant\s+[^;]*delete[^;]+public\.reusable_mappings\s+to authenticated/i);
  });

  it("keeps SQL RPC signatures and AI event routes aligned with server code", () => {
    const schema = readText("db/schema.sql");
    const rls = readText("db/rls.sql");
    const adapter = readText("lib/db/metadataAdapter.ts");

    expect(schema).toContain("create or replace function public.reserve_ai_usage(");
    expect(schema).toContain("p_user_id uuid");
    expect(schema).toContain("p_usage_date date");
    expect(schema).toContain("p_daily_limit integer");
    expect(rls).toContain("public.reserve_ai_usage(uuid, date, integer)");
    expect(rls).toContain("from public");
    expect(rls).not.toContain("public.reserve_ai_usage(uuid, date, text, integer)");

    for (const route of [
      "/api/recommend",
      "/api/copilot",
      "/api/coach",
      "/api/form-schema/interpret",
    ]) {
      expect(schema).toContain(route);
      expect(adapter).toContain(route);
    }
  });

  it("keeps service-role access behind the server-only helper", () => {
    const helper = readText("lib/db/serverClient.ts");
    expect(helper).toContain("Server-only boundary");
    expect(helper).toContain("SUPABASE_SECRET_KEY");

    for (const file of sourceFiles(ROOT)) {
      const text = readFileSync(file, "utf8");
      if (isClientModule(text)) {
        expect(text, file).not.toMatch(
          /SUPABASE_SECRET_KEY|DATABASE_URL|AUTH_SECRET|LLM_API_KEY|OPENAI_API_KEY|@\/lib\/db\/serverClient|lib\/db\/serverClient/,
        );
      }
    }
  });
});

function readText(path: string) {
  return readFileSync(join(ROOT, path), "utf8");
}

function sourceFiles(dir: string): string[] {
  const ignored = new Set([".git", ".next", "dist", "node_modules", "tests"]);
  return readdirSync(dir).flatMap((entry) => {
    if (ignored.has(entry)) return [];
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

function isClientModule(text: string) {
  return /^\s*["']use client["'];/.test(text);
}
