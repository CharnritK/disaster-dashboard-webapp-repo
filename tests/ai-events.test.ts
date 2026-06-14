import { describe, expect, it } from "vitest";

import {
  AI_PROMPT_VERSIONS,
  promptVersionForTask,
} from "@/lib/ai/promptVersions";
import {
  InMemoryEntitlementStore,
  sanitizeAiEventMetadata,
} from "@/lib/entitlement";
import type { CopilotTaskType } from "@/types/recommendations";

const ALL_TASK_TYPES: CopilotTaskType[] = [
  "workflow_harmonization",
  "dashboard_synthesis",
  "quality_repair_guidance",
  "decision_handoff_summary",
];

describe("AI event metadata", () => {
  it("has a prompt version for every AI task type", () => {
    expect(Object.keys(AI_PROMPT_VERSIONS).sort()).toEqual(
      [...ALL_TASK_TYPES].sort(),
    );

    for (const taskType of ALL_TASK_TYPES) {
      expect(promptVersionForTask(taskType)).toMatch(new RegExp(`^${taskType}:v\\d+$`));
    }
  });

  it("records prompt versions without prompt bodies", async () => {
    const store = new InMemoryEntitlementStore();
    const event = await store.recordAiEvent({
      attemptedProviderCall: true,
      metadata: {
        profile_count: 2,
      },
      route: "/api/recommend",
      taskType: "workflow_harmonization",
      userId: "analyst-1",
    });

    expect(event.promptVersion).toBe("workflow_harmonization:v1");
    expect(JSON.stringify(event)).not.toMatch(/prompt_body|full_prompt|uploaded_rows/i);
  });

  it("rejects row-like, prompt-like, response-like, or nested metadata", () => {
    expect(
      sanitizeAiEventMetadata({
        count: 2,
        fallback: "ai_disabled",
      }),
    ).toEqual({
      count: 2,
      fallback: "ai_disabled",
    });

    expect(() =>
      sanitizeAiEventMetadata({
        prompt_body: "do the thing",
      }),
    ).toThrow(/Unsafe AI event metadata key/);

    expect(() =>
      sanitizeAiEventMetadata({
        rows: [] as unknown as string,
      }),
    ).toThrow(/Unsafe AI event metadata key/);

    expect(() =>
      sanitizeAiEventMetadata({
        context: { row: "value" },
      }),
    ).toThrow(/Unsafe AI event metadata value/);
  });
});
