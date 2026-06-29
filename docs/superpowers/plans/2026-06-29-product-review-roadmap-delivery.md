# Product Review Roadmap Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the 2026-06-29 product review roadmap as gated, verifiable releases without weakening the controlled-beta privacy, safety, or approval boundaries.

**Architecture:** Use release gates, not a single backlog sprint. Start with low-risk public-demo trust fixes, then add pure helper interfaces for readiness gates, watermarks, join summaries, and analytics validation before wiring large React surfaces. Keep production, migration, provider/model, admin allowlist, retention automation, and public-demo behavior expansion behind explicit approval.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest, npm, existing metadata-only DB adapter, existing deterministic readiness/export/join modules.

---

## Source Inputs

- Primary review: `docs/product-review-synthesis-2026-06-29.md`
- Product contract: `plan/dashboard_copilot_codex_handoff_v1_1/docs/product_contract.md`
- Active roadmap: `plan/dashboard_copilot_codex_handoff_v1_1/docs/roadmap.md`
- Decisions: `plan/dashboard_copilot_codex_handoff_v1_1/docs/decisions_required.md`
- Current verified status: `plan/dashboard_copilot_codex_handoff_v1_1/qa/final_goal_status.md`
- Repo rules: `AGENTS.md`

## Current State

- Local/reviewable controlled-beta paths are documented as complete through phases 0-14.
- Latest documented verification: `npm run lint`, `npm run test`, `npm run build`, `git diff --check`, public `/demo` smoke, unauthenticated protected-route redirects, and privacy scans.
- Credential-dependent evidence remains open: clicked magic-link staging session, authenticated `/app/**` route smoke, metadata-only feedback/template write smoke, admin aggregate runtime proof, and staging DB/RLS checks.
- Production work remains blocked: production deployment, production env mutation, production Supabase config, production migrations, production admin allowlist changes, provider/model/quota changes, retention automation, and persistence expansion.
- `docs/product-review-synthesis-2026-06-29.md` is currently untracked user-provided input.

## Execution Status - 2026-06-29

Verdict: `LOCAL_GATES_1_2_IMPLEMENTED_AND_VERIFIED_STAGING_PRODUCTION_PENDING`

- Gate 0 baseline/branch guard: completed locally on
  `codex/product-review-roadmap-delivery`.
- Gate 1 public-demo share release: implemented and locally verified.
- Gate 2 tasks 2.1-2.6 controlled-beta safety release: implemented and locally
  verified.
- Gate 2 staging evidence: not completed in this run because it requires a
  clicked approved staging magic-link session and safe staging metadata writes.
  A safe capture packet is prepared at
  `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_evidence_capture_2026-06-29.md`.
- Gate 2 upload viability checkpoint: not started because no approval was given
  to change the upload-size policy. The pending decision is recorded at
  `docs/decisions/upload-viability.md`.
- Gate 3 production readiness: not started because production deployment,
  production Supabase configuration, production migrations, environment
  mutation, provider/model/quota changes, admin policy changes, and retention
  automation require explicit approval. The pending approval record is prepared
  at `docs/decisions/production-readiness.md`.
- Gate 4 optional polish: not started; it remains downstream of beta evidence.

Current evidence is recorded in
`plan/dashboard_copilot_codex_handoff_v1_1/qa/product_review_roadmap_delivery_2026-06-29.md`.

## Completion Audit - Checklist Semantics

Checklist items marked complete below mean the current worktree has local
implementation and verification evidence for the requested product outcome.
They do not imply that every historical command transcript was retained.

Process proof caveats:

- Gate 0 branch/workspace state is verified by the current branch and current
  `git status`; the original branch-creation transcript is not retained.
- Final `npm run lint`, `npm run test`, `npm run build`, browser smoke, and
  `git diff --check` evidence is retained. The timing of pre-change baseline
  checks is not independently auditable.
- TDD "failing test" steps produced final test files and passing focused/full
  runs, but the initial failing-run transcripts are not retained.
- Task 2.6 local dev-dependency expansion was treated as approved by the
  user's instruction to complete the full plan with test coverage. No runtime
  dependency, production provider, deployment, migration, environment, or
  account change was made.
- Unchecked items remain external-gated, approval-gated, or downstream of beta
  evidence.

## Delivery Principles

- Ship gates, not themes. A release gate is done only when evidence exists for user behavior, safety, privacy, and runtime proof.
- Keep `/demo` public, deterministic, sample/synthetic-only, upload-free, and free of anonymous AI.
- Keep uploaded data session-only. Persist only approved metadata.
- Treat AI as advisory. Deterministic readiness, validation, caveats, and exports remain authoritative.
- Prefer pure helpers with node tests before touching the large component files.
- Do not run multiple parallel writers against `components/WorkflowComponents.tsx` or `components/DashboardCopilotApp.tsx`.
- Do not add guest feedback persistence, anonymous analytics, upload-cap policy changes, production analytics, DB admin allowlists, retention automation, or production changes without explicit approval.

## Subagent Model

Use subagents, but keep Codex parent accountable for synthesis, diff review, verification, and approval gates.

- `AGENT_UX_COPY`: Gate 1 public-demo copy and sign-in trust. One writer only for shared UI files.
- `AGENT_SAFETY`: Readiness-gate helpers, dashboard-generation gate, export watermarking.
- `AGENT_FEATURE`: Stepper navigation, P-code/COD vocabulary, join trust, upload viability if approved.
- `AGENT_A11Y`: jsdom harness and a11y component tests after dependency approval.
- `AGENT_RELEASE`: Staging proof and production approval packets. No production mutations.
- `AGENT_TEST_AUTHOR`: Cross-cutting test design and focused regression tests.

Parallelize only read-only review, isolated pure helper files, or disjoint test files. Serialize changes to the two main UI files.

---

## Gate 0: Baseline And Branch Guard

**Goal:** Start from known workspace state and avoid overwriting user or agent work.

**Files:**
- Inspect: `AGENTS.md`
- Inspect: `docs/product-review-synthesis-2026-06-29.md`
- Inspect: `package.json`
- Inspect: `vitest.config.ts`

- [x] **Step 1: Inspect workspace state**

Run:

```powershell
git status --short
```

Expected: note any dirty or untracked files. Do not modify untracked user input unless the task explicitly requires it.

- [x] **Step 2: Create an implementation branch when coding starts**

Run if implementation is requested:

```powershell
git switch -c codex/product-review-roadmap-delivery
```

Expected: branch switches successfully. If unrelated dirty files block the branch, create an isolated worktree before editing.

- [x] **Step 3: Run baseline checks only if implementation starts**

Run:

```powershell
npm run lint
npm run test
```

Expected: both pass before risky changes begin. For UI/config/dependency changes, also run `npm run build` before handoff.

---

## Gate 1: Public Demo Share Release

**Business outcome:** A user can land on `/demo`, understand the product, run the sample workflow, and not mistake the demo for operational approval or a broken AI/auth experience.

**Release scope:**
- A1 hero value prop and safety strip.
- A2 sample walkthrough CTA and progressive disclosure.
- A3 hide inert AI toggle in demo and fix AI helper copy.
- A4 rename Step 5 label from `Dataset` to `Validate`.
- A5 Step 2 demo copy and de-jargon deterministic language.
- A6 session-only and synthetic-sample copy.
- C1 sign-in unavailable copy and `auth_not_configured` handling.

**Explicitly not included:**
- Guest feedback persistence.
- Anonymous analytics.
- Upload controls in `/demo`.
- Anonymous AI.
- jsdom dependency expansion unless needed by the implementer for rendered-copy tests.

### Task 1.1: Extract Demo And Login Copy Constants

**Files:**
- Create: `lib/demoMessaging.ts`
- Create: `lib/auth/loginMessaging.ts`
- Modify: `components/WorkflowComponents.tsx`
- Modify: `app/login/page.tsx`
- Test: `tests/demo-framing.test.ts`
- Test: `tests/login-messaging.test.ts`

- [x] **Step 1: Write failing node tests for constants**

Create `tests/demo-framing.test.ts` with assertions for:

```ts
import { describe, expect, it } from "vitest";
import {
  DEMO_SAFETY_STRIP,
  DEMO_SESSION_CHIP,
  DEMO_UPLOAD_TITLE,
  STEP_LABELS,
} from "@/lib/demoMessaging";
import { WORKFLOW_STEPS } from "@/lib/config";

describe("demo framing copy", () => {
  it("keeps the public demo safety posture visible", () => {
    expect(DEMO_SAFETY_STRIP.toLowerCase()).toContain("controlled beta");
    expect(DEMO_SAFETY_STRIP.toLowerCase()).toContain("synthetic sample data");
    expect(DEMO_SAFETY_STRIP.toLowerCase()).toContain("not for operational action");
    expect(DEMO_SESSION_CHIP.toLowerCase()).toContain("session-only");
    expect(DEMO_SESSION_CHIP.toLowerCase()).toContain("nothing is stored");
  });

  it("uses clear user-facing labels", () => {
    expect(DEMO_UPLOAD_TITLE).toBe("Choose sample data");
    expect(Object.keys(STEP_LABELS).sort()).toEqual([...WORKFLOW_STEPS].sort());
    expect(STEP_LABELS.validate).toBe("Validate");
    expect(Object.values(STEP_LABELS).join(" ").toLowerCase()).not.toContain("deterministic");
  });
});
```

Create `tests/login-messaging.test.ts` with assertions for:

```ts
import { describe, expect, it } from "vitest";
import { loginMessage } from "@/lib/auth/loginMessaging";

describe("login messaging", () => {
  it("explains unavailable auth without showing raw config language", () => {
    const message = loginMessage({ authConfigured: false });
    expect(message?.tone).toBe("warning");
    expect(message?.copy).toContain("Sign-in isn't available in this preview");
    expect(message?.copy).toContain("public demo");
    expect(message?.copy).not.toMatch(/Supabase|auth_not_configured/i);
  });

  it("maps auth_not_configured to the same preview-safe message", () => {
    const message = loginMessage({ authConfigured: false, error: "auth_not_configured" });
    expect(message?.copy).toContain("Sign-in isn't available in this preview");
  });
});
```

- [x] **Step 2: Run failing tests**

Run:

```powershell
npm run test -- --run tests/demo-framing.test.ts tests/login-messaging.test.ts
```

Expected: fail because the new modules do not exist.

- [x] **Step 3: Implement constants and pure login messaging**

Add `lib/demoMessaging.ts`:

```ts
import type { WorkflowStep } from "@/lib/config";

export const STEP_LABELS: Record<WorkflowStep, string> = {
  brief: "Template",
  upload: "Upload",
  profile: "Profile",
  recommend: "Harmonize",
  validate: "Validate",
  dashboard: "Dashboard",
  export: "Export",
};

export const DEMO_SAFETY_STRIP =
  "Controlled beta - synthetic sample data - not for operational action";

export const DEMO_SESSION_CHIP = "Session-only - nothing is stored";

export const DEMO_UPLOAD_TITLE = "Choose sample data";

export const DEMO_SAMPLE_ONLY_COPY = "Synthetic sample data only";

export const DEMO_GUIDED_FLOW_COPY =
  "Use the template as-is for the guided flow without AI.";

export const DEMO_AI_CTA = "Sign in to use AI-assisted workflow";
```

Add `lib/auth/loginMessaging.ts`:

```ts
export type LoginMessageInput = {
  authConfigured: boolean;
  error?: string;
  sent?: string;
  status?: string;
};

export type LoginMessage = {
  tone: "neutral" | "success" | "warning";
  copy: string;
};

export function loginMessage({
  authConfigured,
  error,
  sent,
  status,
}: LoginMessageInput): LoginMessage | null {
  if (!authConfigured || error === "auth_not_configured") {
    return {
      tone: "warning",
      copy:
        "Sign-in isn't available in this preview. Explore the public demo - no account needed.",
    };
  }

  if (sent === "1") {
    return { tone: "success", copy: "Check your email for the secure sign-in link." };
  }

  if (status === "signed_out") {
    return { tone: "neutral", copy: "You have been signed out." };
  }

  if (error === "invalid_email") {
    return { tone: "warning", copy: "Enter a valid email address." };
  }

  if (error === "auth_rate_limited") {
    return {
      tone: "warning",
      copy:
        "A sign-in link was requested recently. Use the latest email link or wait a minute before requesting another.",
    };
  }

  if (error === "auth_failed" || error === "callback_failed") {
    return {
      tone: "warning",
      copy:
        "Sign-in could not be completed. Try again or check the provider configuration.",
    };
  }

  return null;
}
```

- [x] **Step 4: Wire constants into existing files**

Modify `components/WorkflowComponents.tsx` to import `STEP_LABELS` from `@/lib/demoMessaging` and remove the local `STEP_LABELS` constant.

Modify `app/login/page.tsx` to import `loginMessage` from `@/lib/auth/loginMessaging`, remove the local function, keep the input and submit button disabled when `authConfigured` is false, and add this copy near the email field:

```tsx
<p className="auth-helper">We use your email only to send a sign-in link.</p>
```

When `authConfigured` is false, the disabled submit button text should be:

```tsx
Sign-in unavailable
```

- [x] **Step 5: Verify**

Run:

```powershell
npm run test -- --run tests/demo-framing.test.ts tests/login-messaging.test.ts
npm run lint
npm run test
npm run build
```

Expected: all pass.

### Task 1.2: Public Demo Framing And AI Affordance

**Files:**
- Modify: `components/WorkflowComponents.tsx`
- Modify: `components/DashboardCopilotApp.tsx`
- Modify: `app/styles.css`
- Test: `tests/demo-framing.test.ts`

- [x] **Step 1: Change `LandingHero` to support hiding the AI toggle**

Add a `showLlmToggle?: boolean` prop to `LandingHero`. Render the `<label className="llm-toggle">` only when `showLlmToggle !== false`.

- [x] **Step 2: Hide the inert AI toggle in demo**

In `components/DashboardCopilotApp.tsx`, pass:

```tsx
showLlmToggle={!demoMode}
```

to `LandingHero`. Keep the CTA:

```tsx
<a className="primary-action compact" href="/login?next=/app/data">
  {DEMO_AI_CTA}
</a>
```

- [x] **Step 3: Add persistent demo safety strip and session chip**

Render `DEMO_SAFETY_STRIP` and `DEMO_SESSION_CHIP` inside the public demo workflow shell when `demoMode` is true. Do not render them in workspace mode.

- [x] **Step 4: Add walkthrough CTA and progressive disclosure**

On the first demo step, render a primary action:

```tsx
Run the 3-minute sample walkthrough
```

Keep advanced caveats in a native `<details>` element collapsed by default.

- [x] **Step 5: Verify the demo remains upload-free**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Then run a browser smoke pass:

```powershell
npm run dev
```

Open `http://localhost:3000/demo` and verify:

- no file input is visible;
- no AI toggle is visible;
- sign-in CTA is visible;
- controlled-beta and session-only copy is visible;
- Step 5 reads `Validate`.

### Task 1.3: Demo Upload Step Copy

**Files:**
- Modify: `components/WorkflowComponents.tsx`
- Modify: `app/styles.css`
- Test: `tests/demo-framing.test.ts`

- [x] **Step 1: In the sample-only upload branch, use demo-specific copy**

When `sampleOnly` is true:

- title: `Choose sample data`
- helper copy: `Synthetic sample data only`
- remove upload-only sensitive-data warnings because no upload exists in demo
- replace user-facing `deterministic mode` with `guided flow without AI`

- [x] **Step 2: Verify**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected: all pass, and browser smoke still confirms `/demo` has no upload control.

---

## Gate 1 Approval Checkpoint: Demo Feedback

**Decision required before implementation:** Should `/demo` collect guest feedback?

Recommended default: do not persist anonymous demo feedback in Gate 1. Use either no feedback prompt or a client-only mailto/link until a metadata-only anonymous schema is approved.

If approved later, the allowed event taxonomy is:

```ts
type DemoFeedbackEvent =
  | { type: "step_reached"; step: string }
  | { type: "sample_chosen"; sample: "response-prioritization" | "service-gap" | "preparedness" }
  | { type: "export_type"; exportType: "csv" | "png" | "pdf" | "handoff" | "project-kit" };
```

Forbidden payload fields:

- raw rows
- prepared rows
- full datasets
- uploaded filenames if user-supplied
- prompts
- model responses
- reports
- exports
- free-form operational details
- direct personal contact details beyond approved auth/account metadata

---

## Gate 2: Controlled Beta Safety Release

**Business outcome:** Approved beta users can use real session-only files, understand unsafe evidence, review join trust, and export artifacts that cannot be mistaken for operational approval.

**Release scope:**
- B1 hard-gate dashboard generation for `decision_unsafe`.
- B2 watermark non-ready PNG/PDF artifacts.
- E2 stepper back-navigation to completed steps.
- E3 P-code/COD vocabulary.
- E1 join transparency and unmatched-key summary.
- D0-D3 a11y harness and critical keyboard/focus fixes.
- Authenticated staging smoke and metadata/admin runtime proof.

### Task 2.1: Add Pure Readiness Gate Helpers

**Files:**
- Create: `lib/readinessGate.ts`
- Modify: `lib/workflowExport.ts`
- Test: `tests/readiness-gate.test.ts`

- [x] **Step 1: Write failing tests**

Create `tests/readiness-gate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  canGenerateDashboard,
  getReadinessBlockers,
  watermarkLabelForStatus,
} from "@/lib/readinessGate";
import type { DecisionReadinessResult } from "@/types/decision";

const unsafeReadiness: DecisionReadinessResult = {
  status: "decision_unsafe",
  summary: "Missing required evidence.",
  caveats: ["Missing affected population.", "Join match rate is low."],
  blockerCount: 2,
  reviewCount: 0,
  requiredEvidenceCovered: 1,
  requiredEvidenceMissing: 2,
};

describe("readiness gate", () => {
  it("derives stable blocker ids for unsafe readiness", () => {
    expect(getReadinessBlockers(unsafeReadiness)).toEqual([
      { id: "blocker-1", label: "Missing affected population." },
      { id: "blocker-2", label: "Join match rate is low." },
    ]);
  });

  it("blocks dashboard generation until every blocker is acknowledged", () => {
    expect(canGenerateDashboard(unsafeReadiness, new Set())).toBe(false);
    expect(canGenerateDashboard(unsafeReadiness, new Set(["blocker-1"]))).toBe(false);
    expect(canGenerateDashboard(unsafeReadiness, new Set(["blocker-1", "blocker-2"]))).toBe(true);
  });

  it("does not hard-block ready or review-needed readiness", () => {
    expect(canGenerateDashboard({ ...unsafeReadiness, status: "ready", caveats: [] }, new Set())).toBe(true);
    expect(canGenerateDashboard({ ...unsafeReadiness, status: "review_needed" }, new Set())).toBe(true);
  });

  it("returns watermark labels by status", () => {
    expect(watermarkLabelForStatus("decision_unsafe")).toBe("REVIEW ONLY - UNSAFE EVIDENCE");
    expect(watermarkLabelForStatus("review_needed")).toBe("REVIEW ONLY");
    expect(watermarkLabelForStatus("ready")).toBeNull();
  });
});
```

- [x] **Step 2: Run failing test**

Run:

```powershell
npm run test -- --run tests/readiness-gate.test.ts
```

Expected: fail because `lib/readinessGate.ts` does not exist.

- [x] **Step 3: Implement helper**

Create `lib/readinessGate.ts`:

```ts
import type { DecisionReadinessStatus, DecisionReadinessResult } from "@/types/decision";

export type ReadinessBlocker = {
  id: string;
  label: string;
};

export function getReadinessBlockers(
  readiness?: DecisionReadinessResult,
): ReadinessBlocker[] {
  if (!readiness || readiness.status !== "decision_unsafe") return [];
  return readiness.caveats.map((label, index) => ({
    id: `blocker-${index + 1}`,
    label,
  }));
}

export function canGenerateDashboard(
  readiness: DecisionReadinessResult | undefined,
  acknowledgedBlockerIds: ReadonlySet<string>,
) {
  const blockers = getReadinessBlockers(readiness);
  return blockers.every((blocker) => acknowledgedBlockerIds.has(blocker.id));
}

export function watermarkLabelForStatus(status?: DecisionReadinessStatus) {
  if (status === "decision_unsafe") return "REVIEW ONLY - UNSAFE EVIDENCE";
  if (status === "review_needed") return "REVIEW ONLY";
  return null;
}
```

- [x] **Step 4: Verify**

Run:

```powershell
npm run test -- --run tests/readiness-gate.test.ts
npm run lint
npm run test
```

Expected: all pass.

### Task 2.2: Hard-Gate Dashboard Generation

**Files:**
- Modify: `components/WorkflowComponents.tsx`
- Modify: `components/DashboardCopilotApp.tsx`
- Modify: `lib/workflowExport.ts`
- Test: `tests/readiness-gate.test.ts`

- [x] **Step 1: Add acknowledgement state in the parent workflow**

In `components/DashboardCopilotApp.tsx`, track acknowledged blocker ids for the current readiness result. Reset them when prepared data, decision brief, or readiness changes.

- [x] **Step 2: Pass blockers and acknowledgement handlers to `ValidationStep`**

Use `getReadinessBlockers(state.decisionReadiness)` and `canGenerateDashboard(...)` to decide whether the dashboard generation action is enabled.

- [x] **Step 3: Render per-blocker acknowledgement checklist**

In `ValidationStep`, when status is `decision_unsafe`, render:

- heading: `Dashboard is review-only: unresolved evidence gaps remain`
- one checkbox per blocker
- generate button disabled until all blocker ids are acknowledged

- [x] **Step 4: Carry acknowledgement metadata into handoff/export packets**

Extend the handoff packet input with:

```ts
acknowledgedBlockerIds?: string[];
```

Include it under `dossier.acknowledgedBlockerIds`.

- [x] **Step 5: Verify**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected: all pass. Browser smoke with the risky sample should show dashboard generation blocked until every blocker checkbox is checked.

### Task 2.3: Watermark Non-Ready PNG/PDF Artifacts

**Files:**
- Modify: `lib/exportPng.ts`
- Modify: `lib/exportPdf.ts`
- Modify: `components/DashboardCopilotApp.tsx`
- Test: `tests/export-watermark.test.ts`

- [x] **Step 1: Write tests against helper/boundaries**

Assert `watermarkLabelForStatus` behavior in `tests/readiness-gate.test.ts`. Add `tests/export-watermark.test.ts` that mocks capture/PDF boundaries and checks that watermark text is passed for non-ready statuses and omitted for ready status.

- [x] **Step 2: Add PNG export options**

Change `exportElementAsPng` signature to accept:

```ts
export type DashboardPngOptions = {
  watermarkLabel?: string | null;
};
```

Render a temporary watermark element into the export target before capture, then remove it in a `finally` block. Do not assert pixels in tests.

- [x] **Step 3: Add PDF watermark text**

In `exportElementAsPdf`, use `watermarkLabelForStatus(options.decisionReadiness?.status)` and write the label on each page in a consistent review-only style.

- [x] **Step 4: Wire current readiness status from export handlers**

In `components/DashboardCopilotApp.tsx`, pass the current readiness status into PNG/PDF export calls.

- [x] **Step 5: Verify**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected: all pass, with non-ready exports carrying review-only watermark copy.

### Task 2.4: Stepper Back Navigation And Domain Vocabulary

**Files:**
- Modify: `components/WorkflowComponents.tsx`
- Modify: `lib/locationFields.ts`
- Modify: `lib/profiling.ts`
- Test: `tests/location-fields.test.ts`

- [x] **Step 1: Allow completed steps to be clickable**

In `StepIndicator`, allow navigation to steps whose index is lower than the current step even when `canNavigateToStep` would not permit forward navigation. Keep future steps gated.

- [x] **Step 2: Add admin-code/P-code recognition without reclassifying codes as display labels**

Add a separate exported helper in `lib/locationFields.ts`:

```ts
export function isAdminCodeField(field: string) {
  const normalized = field.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return /^(pcode|admincode|adm\\d?pcode|adm\\d?code|iso\\d*)$/.test(normalized);
}
```

Use it in profiling/join confidence hints. Keep `findAreaField` from turning codes into area labels.

- [x] **Step 3: Add tests**

Create or extend `tests/location-fields.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isAdminCodeField } from "@/lib/locationFields";

describe("location field vocabulary", () => {
  it("recognizes P-code and COD-style admin code fields", () => {
    expect(isAdminCodeField("pcode")).toBe(true);
    expect(isAdminCodeField("ADM1_PCODE")).toBe(true);
    expect(isAdminCodeField("admin_code")).toBe(true);
    expect(isAdminCodeField("district_name")).toBe(false);
  });
});
```

- [x] **Step 4: Verify**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected: all pass.

### Task 2.5: Join Trust Summary

**Files:**
- Create: `lib/joinSummary.ts`
- Modify: `components/WorkflowComponents.tsx`
- Modify: `lib/harmonization.ts` only if existing `__join_matched` is insufficient
- Test: `tests/join-summary.test.ts`

- [x] **Step 1: Write tests for bounded unmatched-key summaries**

Create `tests/join-summary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { summarizeJoinMatch } from "@/lib/joinSummary";

describe("summarizeJoinMatch", () => {
  it("returns matched and unmatched counts with bounded key samples", () => {
    const left = [{ code: "A" }, { code: "B" }, { code: "C" }];
    const right = [{ code: "A" }, { code: "C" }, { code: "D" }];
    expect(summarizeJoinMatch(left, right, "code", "code", 2)).toEqual({
      leftCount: 3,
      rightCount: 3,
      matchedCount: 2,
      unmatchedLeftCount: 1,
      unmatchedRightCount: 1,
      unmatchedLeftKeys: ["B"],
      unmatchedRightKeys: ["D"],
    });
  });
});
```

- [x] **Step 2: Implement pure helper**

Create `lib/joinSummary.ts` with normalized string-key matching and bounded unmatched-key arrays. Do not return full rows.

- [x] **Step 3: Surface summary before join commit**

In the recommendation step, show matched count, unmatched count, bounded unmatched key samples, and an `Adjust join` affordance before accepting the join plan.

- [x] **Step 4: Verify privacy boundary**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected: all pass, and no unmatched row objects are persisted or included in metadata logs.

### Task 2.6: A11y Harness And Critical Keyboard Fixes

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vitest.config.ts`
- Create: `tests/dom/setup.ts`
- Create: `tests/dom/*.test.ts`
- Modify: `components/WorkflowComponents.tsx`
- Modify: `app/styles.css`

- [x] **Step 1: Approve dependency expansion**

Only proceed after accepting that this adds dev dependencies and changes `package-lock.json`.

Install with npm only:

```powershell
npm install --save-dev jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom vitest-axe
```

- [x] **Step 2: Add jsdom Vitest project**

Update `vitest.config.ts` so existing node tests remain node-based and DOM tests run only under `tests/dom/**/*.test.ts`.

- [x] **Step 3: Add critical DOM tests**

Add tests for:

- modal focus trap and focus restore;
- tablist roving tabindex and Left/Right/Home/End behavior;
- `aria-live="polite"` on async validation summary;
- axe pass for demo step 1 and dashboard step where practical.

- [x] **Step 4: Implement fixes**

Patch the focus trap, tablist keyboard behavior, dark-mode focus ring contrast, and async `aria-live` regions.

- [x] **Step 5: Verify**

Run:

```powershell
npm run lint
npm run test
npm run build
```

Expected: all pass. Browser smoke should confirm keyboard operation on the affected controls.

---

## Gate 2 Approval Checkpoint: Upload Viability

**Decision required:** Is controlled beta expected to accept realistic 3W/HDX-style files larger than 1 MB?

If yes, move upload viability into Gate 2. If no, defer to Gate 3.

Approved implementation slice:

- Raise default `MAX_UPLOAD_SIZE_MB` from `1` to a decided value, recommended `10` before `25`.
- Add client-side size precheck before parsing.
- Show row/column counts before commit.
- Add parse progress only if it can be done without fragile UX or large refactor.

**Files:**
- Modify: `lib/config.ts`
- Modify: `lib/fileParsers.ts`
- Modify: `components/WorkflowComponents.tsx`
- Test: `tests/config.test.ts`
- Test: `tests/upload-validation.test.ts`

Verification:

```powershell
npm run lint
npm run test
npm run build
```

---

## Gate 2 Staging Evidence

Controlled beta is not ready from local tests alone.

Tester materials prepared:

- `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_test_runbook_2026-06-29.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_test_payloads_2026-06-29.json`
- `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_evidence_capture_2026-06-29.md`

- [ ] Click the latest staging magic link for the approved beta/admin email.
- [ ] Verify authenticated `/app/usage`.
- [ ] Verify authenticated `/app/templates`.
- [ ] Verify authenticated `/app/feedback`.
- [ ] Verify `/admin` as approved admin and deny as non-admin if a safe test identity exists.
- [ ] Submit one safe metadata-only feedback item.
- [ ] Create or update one safe metadata-only template.
- [ ] Confirm admin aggregate reporting shows metadata only.
- [ ] Confirm unauthenticated mutation routes return `401`.
- [ ] Record evidence in `plan/dashboard_copilot_codex_handoff_v1_1/qa/`.

Do not print or commit secrets, env values, magic links, tokens, raw DB rows, or personal account data.

---

## Gate 3: Production Readiness Packet

**Business outcome:** Production can be considered only after explicit production approval and proof that production configuration preserves auth, quota, privacy, RLS, fallback, and admin boundaries.

**Blocked until approval:**
- Production deployment.
- Production Supabase config and redirect URLs.
- Production migrations.
- Production environment variables.
- Admin allowlist policy or values.
- Provider/model/quota changes.
- Retention automation.
- Persistence expansion.

### Task 3.1: Production Approval Record

**Files:**
- Create or modify: `docs/decisions/production-readiness.md`
- Modify only after approval: `plan/dashboard_copilot_codex_handoff_v1_1/docs/decisions_required.md`

- [ ] **Step 1: Record production decision**

Include:

- production target;
- Supabase project boundary;
- redirect URL review;
- admin/beta allowlist owner;
- rollback plan;
- migration approval;
- retention posture;
- provider/model/quota confirmation.

- [ ] **Step 2: Verify docs-only change**

Run:

```powershell
git diff --check
```

Expected: no whitespace errors.

### Task 3.2: DB/Admin Hardening Only After Approval

**Files:**
- Modify: `lib/adminMetrics/index.ts`
- Modify: `lib/db/metadataAdapter.ts`
- Modify: `db/schema.sql`
- Modify: `db/rls.sql`
- Test: `tests/admin-metrics.test.ts`
- Test: `tests/db-schema-boundary.test.ts`

Recommended approach: prefer existing `user_profiles.role` if it satisfies the admin allowlist need. Avoid creating a new allowlist table unless the policy owner explicitly wants a separate reviewable table.

Verification:

```powershell
npm run lint
npm run test
npm run build
```

No production migration may run from this task without separate explicit approval.

### Task 3.3: Production Analytics Only After Approval

**Files:**
- Create or modify: `lib/analytics/events.ts`
- Modify: relevant API/UI call sites only after event taxonomy approval
- Test: `tests/analytics-events.test.ts`
- Extend: `tests/privacy-no-row-persistence.test.ts`

Required event validator:

```ts
export const ALLOWED_ANALYTICS_EVENT_TYPES = [
  "step_reached",
  "sample_chosen",
  "export_type",
  "fallback_reason_seen",
  "readiness_status_seen",
] as const;
```

Required rejection behavior:

- reject object/array values that resemble rows;
- reject keys containing `row`, `rows`, `sample_values`, `prompt`, `response`, `report`, `export_content`, or `file_content`;
- no network sink unless provider/env is approved.

Verification:

```powershell
npm run lint
npm run test
npm run build
```

---

## Gate 4: Optional Polish Backlog

Do not start Gate 4 until beta evidence shows it improves completion, trust, or decision quality.

- Manual column remap override.
- Local PII pre-scan warning.
- Profile histograms and outlier explanation.
- Export thumbnail preview.
- Reviewer/sign-off fields and CSV audit-header metadata.
- Deterministic district-name normalizer.
- Richer file error/retry states.
- "How this works" guide.

Each polish item must ship with:

- focused tests;
- no new forbidden persistence;
- no operational-action language;
- no public-demo upload or anonymous AI expansion;
- browser smoke if it touches user workflow.

---

## Verification Matrix

Use the smallest proof that covers the actual change, then run the full gate checks before handoff.

| Change type | Required verification |
|---|---|
| Docs only | `git diff --check` |
| Pure helper logic | `npm run lint`, focused `npm run test -- --run <test-file>`, then `npm run test` |
| UI/routes/CSS/config/dependencies | `npm run lint`, `npm run test`, `npm run build`, browser smoke |
| Auth/feedback/templates/admin/staging | local checks plus authenticated staging smoke with approved credentials |
| Production/deploy/migration/admin policy | explicit approval, migration/rollback review, production smoke, no secret disclosure |

## Subagent Execution Order

1. Parent: create branch, baseline, and confirm approval gates.
2. `AGENT_TEST_AUTHOR`: write node tests for demo messaging and readiness helpers.
3. `AGENT_UX_COPY`: implement Gate 1 constants/copy/sign-in changes. One writer owns `WorkflowComponents.tsx` and `DashboardCopilotApp.tsx`.
4. Parent: run `npm run lint`, `npm run test`, `npm run build`, and demo browser smoke.
5. `AGENT_SAFETY`: implement pure readiness gate helpers and tests.
6. `AGENT_SAFETY`: implement B1 hard gate, then B2 watermarking.
7. `AGENT_FEATURE`: implement E2/E3, then E1.
8. `AGENT_A11Y`: implement D0-D3 after dependency approval.
9. Parent: run full verification and staging smoke checklist.
10. `AGENT_RELEASE`: prepare production approval packet only after explicit production direction.

## Acceptance Criteria By Release

### Demo-share release

- `/demo` public, deterministic, sample-only, upload-free.
- no anonymous AI or upload control.
- controlled-beta, synthetic sample, session-only, and not-operational copy visible.
- AI toggle hidden in demo; sign-in CTA visible.
- login page handles unavailable auth without raw provider/config language.
- Step 5 label is `Validate`.
- verification: `npm run lint`, `npm run test`, `npm run build`, browser smoke.

### Controlled-beta release

- `/app/**` protected.
- unsafe readiness blocks dashboard generation until per-blocker acknowledgement.
- non-ready PNG/PDF artifacts are review-only watermarked.
- join trust shows matched/unmatched counts and bounded unmatched-key samples.
- completed steps can be revisited.
- P-code/COD vocabulary improves geography/join hints without treating codes as display labels.
- critical keyboard/focus/a11y checks pass.
- authenticated staging smoke and metadata/admin proof recorded.

### Production readiness

- explicit production approval exists.
- production env/config/migrations/admin policy reviewed.
- rollback path exists.
- RLS and metadata-only boundaries verified.
- no forbidden row/file/prompt/report persistence.
- retention automation remains blocked unless separately approved.

## Self-Review

- Spec coverage: every Gate 1 and Gate 2 item from `docs/product-review-synthesis-2026-06-29.md` is mapped to a release task or explicit approval checkpoint. Gate 3 and Gate 4 are intentionally separated because they require external decisions or beta evidence.
- Placeholder scan: no placeholder markers are used as acceptance criteria.
- Type consistency: helper names used by tests and tasks are consistent: `STEP_LABELS`, `DEMO_SAFETY_STRIP`, `loginMessage`, `getReadinessBlockers`, `canGenerateDashboard`, `watermarkLabelForStatus`, and `summarizeJoinMatch`.

## Recommended Next Action

Proceed with the remaining approval-gated evidence path: click the approved
staging magic link, verify authenticated staging routes and metadata-only
feedback/template writes, then record the evidence in
`plan/dashboard_copilot_codex_handoff_v1_1/qa/`. Hold upload-cap changes,
guest demo feedback, production deployment, production Supabase configuration,
production migrations, provider/model/quota changes, admin policy changes, and
retention automation until the required decisions are explicit.
