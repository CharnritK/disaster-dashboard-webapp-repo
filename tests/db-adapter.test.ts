import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  APPROVED_METADATA_TABLES,
  InMemoryMetadataDbAdapter,
  sanitizeSafeMetadata,
} from "@/lib/db/metadataAdapter";

const ROOT = process.cwd();
const FORBIDDEN_PERSISTENCE_WORDS =
  /uploaded_rows|prepared_rows|dataset_rows|raw_rows|stored_files|screenshots|prompt_bodies|model_responses/i;

describe("metadata DB adapter", () => {
  it("declares only the approved metadata tables", () => {
    expect([...APPROVED_METADATA_TABLES].sort()).toEqual([
      "ai_events",
      "ai_usage_daily",
      "custom_templates",
      "feedback",
      "form_registries",
      "form_registry_versions",
      "reusable_mappings",
      "template_versions",
      "user_profiles",
    ]);
  });

  it("supports basic metadata CRUD without row/file persistence methods", async () => {
    const adapter = new InMemoryMetadataDbAdapter();
    const profile = await adapter.upsertUserProfile({
      displayName: "Analyst",
      email: "analyst@example.org",
      id: "11111111-1111-1111-1111-111111111111",
    });

    expect(profile.role).toBe("user");
    await expect(adapter.getUserProfile(profile.id)).resolves.toMatchObject({
      email: "analyst@example.org",
    });

    const usage = await adapter.reserveAiUsage({
      dailyLimit: 2,
      usageDate: "2026-06-14",
      userId: profile.id,
    });
    expect(usage).toMatchObject({
      reserved: true,
      record: {
        usedCount: 1,
      },
    });

    const event = await adapter.createAiEvent({
      attemptedProviderCall: true,
      metadata: {
        profile_count: 2,
        workflow: "response-prioritization",
      },
      promptVersion: "workflow_harmonization:v1",
      provider: "openai",
      route: "/api/recommend",
      taskType: "workflow_harmonization",
      userId: profile.id,
    });
    expect(event.metadata).toEqual({
      profile_count: 2,
      workflow: "response-prioritization",
    });

    await expect(
      adapter.updateAiEvent(event.id, {
        succeeded: true,
      }),
    ).resolves.toMatchObject({
      succeeded: true,
    });

    const template = await adapter.createCustomTemplate({
      ownerUserId: profile.id,
      title: "District response prioritization",
    });
    await expect(
      adapter.createTemplateVersion({
        decisionMaker: "District coordinator",
        decisionQuestion: "Which locations need support first?",
        geographyTimeframe: "District, next 72 hours",
        intendedAction: "Prioritize response",
        requiredEvidence: ["Needs", "Capacity"],
        suggestedFields: [
          {
            field: "location",
            role: "join_key",
          },
        ],
        templateId: template.id,
        versionNumber: 1,
      }),
    ).resolves.toMatchObject({
      versionNumber: 1,
    });

    await expect(
      adapter.createFeedback({
        tags: ["useful"],
        thumb: "up",
        userId: profile.id,
      }),
    ).resolves.toMatchObject({
      tags: ["useful"],
    });

    const registry = await adapter.createFormRegistry({
      fieldCount: 3,
      formFamily: "xlsform",
      ownerUserId: profile.id,
      requiredFieldCount: 1,
      schemaFingerprint: "schema-priority-v1",
      sourceKind: "xlsform_schema",
      title: "Priority form",
    });
    const registryVersion = await adapter.createFormRegistryVersion({
      evidenceMappings: [
        {
          confidenceBucket: "high",
          evidenceNeed: "Needs",
          fieldName: "need_type",
        },
      ],
      fieldCount: 3,
      fieldSummaries: [
        {
          fieldName: "need_type",
          fieldType: "select_one",
        },
      ],
      registryId: registry.id,
      requiredFieldCount: 1,
      schemaFingerprint: "schema-priority-v1",
      sourceKind: "xlsform_schema",
      versionNumber: 1,
    });
    await expect(
      adapter.createReusableMapping({
        confidenceBucket: "high",
        evidenceNeed: "Needs",
        fieldName: "need_type",
        ownerUserId: profile.id,
        registryId: registry.id,
        registryVersionId: registryVersion.id,
      }),
    ).resolves.toMatchObject({
      evidenceNeed: "Needs",
      fieldName: "need_type",
    });

    const methodNames = Object.getOwnPropertyNames(
      InMemoryMetadataDbAdapter.prototype,
    ).map((name) => name.toLowerCase());
    expect(methodNames).not.toEqual(
      expect.arrayContaining([
        "createuploadedrow",
        "createpreparedrow",
        "createdatasetrow",
        "createfile",
        "createexport",
        "createpromptbody",
        "createmodelresponse",
      ]),
    );
  });

  it("rejects row-like or nested metadata", () => {
    expect(
      sanitizeSafeMetadata({
        count: 2,
        fallback: "missing_server_configuration",
      }),
    ).toEqual({
      count: 2,
      fallback: "missing_server_configuration",
    });

    expect(() =>
      sanitizeSafeMetadata({
        "not safe": "value",
      }),
    ).toThrow(/Unsafe metadata key/);

    expect(() =>
      sanitizeSafeMetadata({
        rows: [] as unknown as string,
      }),
    ).toThrow(/Unsafe metadata value/);
  });

  it("keeps DB adapter source free of forbidden persistence tables", () => {
    for (const file of sourceFiles(join(ROOT, "lib", "db"))) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(FORBIDDEN_PERSISTENCE_WORDS);
    }
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}
