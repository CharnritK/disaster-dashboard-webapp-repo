import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { InMemoryMetadataDbAdapter } from "@/lib/db/metadataAdapter";
import { sanitizeAiEventMetadata } from "@/lib/entitlement";
import { parseTemplateDraft } from "@/lib/templates";

const ROOT = process.cwd();
const FORBIDDEN_SCHEMA_TABLES = [
  "uploaded_rows",
  "prepared_rows",
  "dataset_rows",
  "stored_files",
  "exports",
  "screenshots",
  "prompt_bodies",
  "model_responses",
];

describe("privacy no-row persistence guard", () => {
  it("schema and adapter expose only metadata persistence", () => {
    const schema = readFileSync(join(ROOT, "db", "schema.sql"), "utf8");
    const adapterSource = readFileSync(join(ROOT, "lib", "db", "metadataAdapter.ts"), "utf8");
    const combined = `${schema}\n${adapterSource}`;

    for (const forbidden of FORBIDDEN_SCHEMA_TABLES) {
      expect(combined, forbidden).not.toMatch(new RegExp(`create table[^;]+${forbidden}`, "i"));
      expect(combined, forbidden).not.toMatch(new RegExp(`from\\("${forbidden}"\\)`, "i"));
    }

    const methods = Object.getOwnPropertyNames(InMemoryMetadataDbAdapter.prototype).map(
      (method) => method.toLowerCase(),
    );
    expect(methods).not.toEqual(
      expect.arrayContaining([
        "createuploadedrow",
        "createdatasetrow",
        "createpreparedrow",
        "createstoredfile",
        "createscreenshot",
        "createpromptbody",
        "createmodelresponse",
      ]),
    );
  });

  it("rejects row-like metadata in AI events and templates", () => {
    expect(() =>
      sanitizeAiEventMetadata({
        sample_values: "D01,D02",
      }),
    ).toThrow(/Unsafe AI event metadata key/);

    expect(() =>
      parseTemplateDraft({
        decisionMaker: "Lead",
        decisionQuestion: "What now?",
        exampleDataSchema: {
          row_example: "D01",
        },
        geographyTimeframe: "District, 72 hours",
        intendedAction: "Prioritize",
        title: "Unsafe template",
      }),
    ).toThrow(/example rows or values/i);
  });

  it("keeps client modules away from server-only metadata and secret helpers", () => {
    for (const file of sourceFiles(ROOT)) {
      const text = readFileSync(file, "utf8");
      if (!/^\s*["']use client["'];/.test(text)) continue;

      expect(text, file).not.toMatch(
        /@\/lib\/feedback(?!\/constants)|@\/lib\/db\/metadataAdapter|@\/lib\/db\/serverClient|SUPABASE_SECRET_KEY|DATABASE_URL|LLM_API_KEY|OPENAI_API_KEY/,
      );
    }
  });

  it("keeps form intake client-safe and persistence-free", () => {
    const formIntakeSource = readFileSync(join(ROOT, "lib", "formIntake.ts"), "utf8");

    expect(formIntakeSource).not.toMatch(/@\/lib\/db|@\/lib\/supabase|serverClient|metadataAdapter/i);
    expect(formIntakeSource).not.toMatch(/\bfetch\s*\(/);
    expect(formIntakeSource).not.toMatch(/insert|upsert|update|delete|persist|saveForm|formSubmission/i);
  });

  it("keeps repair and coach modules session-only", () => {
    const files = [
      "types/repairAction.ts",
      "lib/repairActions.ts",
      "lib/coach/nextBestAction.ts",
      "components/FormRepairPanel.tsx",
    ];

    for (const relativePath of files) {
      const file = join(ROOT, relativePath);
      if (!exists(file)) continue;
      const text = readFileSync(file, "utf8");
      expect(text, relativePath).not.toMatch(
        /@\/lib\/db|@\/lib\/supabase|metadataAdapter|serverClient|fetch\s*\(|localStorage|sessionStorage|indexedDB|insert|upsert|delete|persist|save/i,
      );
    }
  });

  it("keeps public demo deterministic and sample-only", () => {
    const demoSource = readFileSync(join(ROOT, "app", "demo", "page.tsx"), "utf8");
    const appSource = readFileSync(join(ROOT, "components", "DashboardCopilotApp.tsx"), "utf8");

    expect(demoSource).toMatch(/<DashboardCopilotApp forceDeterministic \/>/);
    expect(appSource).toMatch(/const aiApiAvailable = copilotApiEnabled && !forceDeterministic/);
    expect(appSource).toMatch(/onFiles=\{demoMode \? undefined : addFiles\}/);
    expect(appSource).toMatch(/sampleOnly=\{demoMode\}/);
    expect(appSource).not.toMatch(/fetch\(["']\/api\/(?:coach|repair|form-registry|form-mappings)/);
  });

  it("keeps workflow copy review-oriented around repair guidance", () => {
    const workflowSource = readFileSync(
      join(ROOT, "components", "WorkflowComponents.tsx"),
      "utf8",
    );

    expect(workflowSource).not.toMatch(/"Proceed (After|With)[^"]+"/);
    expect(workflowSource).not.toMatch(
      /\b(operational approval|approved for action|authorize|safe to act|decision-safe)\b/i,
    );
    expect(workflowSource).toMatch(/Continue review|Generate review dashboard|Prepare handoff/);
  });
});

function sourceFiles(dir: string): string[] {
  const ignored = new Set([".git", ".next", "dist", "node_modules"]);
  return readdirSync(dir).flatMap((entry) => {
    if (ignored.has(entry)) return [];
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

function exists(path: string) {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}
