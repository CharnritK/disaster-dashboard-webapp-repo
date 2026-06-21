# Form-Aware Disaster Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first deterministic, session-only form-aware disaster intake slice that maps structured form exports/schemas to existing decision evidence and handoff metadata.

**Architecture:** Add a pure client-safe form-intake layer over the existing `Dataset` workflow. The layer detects structured form/export metadata, creates normal session datasets, and feeds existing profiling, evidence coverage, readiness, dashboard, and export code. No API route, DB table, provider change, migration, production deployment, or row persistence is part of this plan.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest, npm, existing `Dataset`/profiling/readiness/export modules.

**Execution status on `codex/product-standout-roadmap`:** First local slice
implemented with pure form-intake types/module, evidence/readiness integration,
handoff metadata, privacy guards, and protected-app review UI. This status does
not imply production deployment, migration, provider change, persisted form
registry, public-demo upload behavior, or external authenticated staging proof.

---

## Execution Rules

- Use a fresh worktree/branch, preferably `codex/form-aware-disaster-intake`.
- Do not work directly in a dirty workspace unless the touched-file diffs have
  been inspected and are compatible.
- Do not read `.env`, `.env.local`, secrets, account pages, billing pages, or
  provider quota pages.
- Do not add persistence, migrations, production deployment, provider/model
  changes, admin allowlist changes, retention automation, or public demo upload
  behavior.
- Do not add PDF/OCR parsing, live KoBo/ODK sync, free-form AI schema
  interpretation, fuzzy matching, imputation, deduplication, geocoding, row
  deletion, or non-row-preserving cleaning.
- Run the focused tests after each task and final gates before claiming success.

## File Structure

- Create `types/formIntake.ts`: metadata-only form detection and mapping types.
- Modify `types/dataset.ts`: allow `Dataset.sourceType` of `"form"` and add
  optional form mapping hints.
- Create `lib/formIntake.ts`: pure deterministic form detection, HXL handling,
  and form-derived dataset creation.
- Modify `lib/decisionContext.ts`: prioritize form-derived evidence mappings
  when building evidence coverage and readiness missing-evidence checks.
- Modify `lib/workflowExport.ts`: include safe form detection/mapping metadata
  in dataset lineage.
- Create `tests/formIntake.test.ts`: focused unit tests for the new module.
- Modify `tests/dataPipeline.test.ts`: integration coverage for readiness and
  export behavior.
- Modify `tests/privacy-no-row-persistence.test.ts`: no server/DB/fetch or
  persistence-like methods in form intake.
- Create `components/workflow/FormIntakePanel.tsx`: protected-app form review
  panel.
- Modify `components/DashboardCopilotApp.tsx` and
  `components/WorkflowComponents.tsx`: wire form-derived datasets into the
  existing upload step while hiding the panel in sample-only mode.
- Modify `app/styles.css`: minimal styles for the review panel.

---

### Task 0: Branch And Baseline Guard

**Files:**
- Inspect only: repo status and docs.

- [ ] **Step 1: Confirm workspace status**

Run:

```powershell
git status --short
```

Expected: either a clean fresh worktree, or a dirty workspace whose touched-file
diffs are inspected before editing.

- [ ] **Step 2: Create or verify branch/worktree**

Run if not already in an isolated worktree:

```powershell
git switch -c codex/form-aware-disaster-intake
```

Expected: branch switches successfully. If the existing workspace has unrelated
dirty files that block branch creation, use `superpowers:using-git-worktrees`
to create a clean worktree instead.

- [ ] **Step 3: Read required docs**

Run:

```powershell
Get-Content -Raw AGENTS.md
Get-Content -Raw plan\dashboard_copilot_codex_handoff_v1_1\docs\product_contract.md
Get-Content -Raw plan\dashboard_copilot_codex_handoff_v1_1\docs\form_aware_disaster_intake_roadmap.md
```

Expected: confirm session-only upload boundary and blocked production actions.

---

### Task 1: Add Form Intake Types

**Files:**
- Create: `types/formIntake.ts`
- Modify: `types/dataset.ts`
- Test later: `tests/formIntake.test.ts`

- [ ] **Step 1: Create `types/formIntake.ts`**

Add:

```ts
export type FormDetectionStatus = "detected" | "review_needed" | "unsupported";

export type FormSourceType =
  | "hxl_tagged_table"
  | "ocha_3w_5w"
  | "xlsform_schema"
  | "odk_kobo_submission"
  | "custom_tabular_form";

export type FormEvidenceMappingStatus = "covered" | "ambiguous" | "missing";

export type FormEvidenceMapping = {
  evidenceNeed: string;
  sourceField: string;
  sourceLabel?: string;
  sourceTag?: string;
  mappingBasis: "hxl_tag" | "column_alias" | "xlsform_name" | "manual";
  confidence: number;
  status: FormEvidenceMappingStatus;
  caveat?: string;
  reviewerDecision?: "accepted" | "rejected" | "needs_review";
};

export type FormDetectionResult = {
  detectedType?: FormSourceType;
  familyId?: string;
  familyName?: string;
  familyVersion?: string;
  confidence: number;
  status: FormDetectionStatus;
  rationale: string;
  ambiguities: string[];
  unsupportedReasons: string[];
};

export type FormSchemaSummary = {
  fileType: "csv" | "xlsx" | "schema";
  sheetNames?: string[];
  fieldCount: number;
  requiredFieldCount: number;
  choiceListCount: number;
  hxlTagCount: number;
  questionTypeSummary: Record<string, number>;
};

export type FormIntakeMetadata = {
  detection: FormDetectionResult;
  schemaSummary: FormSchemaSummary;
  evidenceMappings: FormEvidenceMapping[];
  privacyAudit: {
    sessionOnly: true;
    persistedMetadataOnly: true;
    rowValuesExcludedFromMetadata: true;
  };
};

export type FormIntakeField = {
  name: string;
  label: string;
  type: "text" | "date" | "integer" | "number" | "percent" | "select" | "boolean";
  required: boolean;
  evidenceNeed: string;
  aliases: string[];
  hxlTags?: string[];
  caveat?: string;
};
```

- [ ] **Step 2: Extend `DatasetInputHints` safely**

Modify `types/dataset.ts`:

```ts
import type { FormIntakeMetadata, FormEvidenceMapping } from "./formIntake";

export type DatasetInputHints = {
  evidenceRole?: string;
  primaryField?: string;
  joinField?: string;
  timeField?: string;
  measurementUnit?: string;
  semanticNotes?: string;
  formFamilyId?: string;
  formFamilyName?: string;
  formDetectionStatus?: "detected" | "review_needed" | "unsupported";
  formEvidenceMappings?: FormEvidenceMapping[];
  formIntakeMetadata?: FormIntakeMetadata;
};
```

Also change:

```ts
sourceType: "upload" | "sample";
```

to:

```ts
sourceType: "upload" | "sample" | "form";
```

- [ ] **Step 3: Run type check**

Run:

```powershell
npm run lint
```

Expected: either pass, or fail only in files requiring new form-intake imports
that are fixed in later tasks. If unrelated dirty-file failures appear, report
them before continuing.

---

### Task 2: Add Pure Form Intake Module And Tests

**Files:**
- Create: `lib/formIntake.ts`
- Create: `tests/formIntake.test.ts`
- Modify if needed: `types/dataset.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/formIntake.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSuggestedDataCollectionTemplate, createDecisionBriefFromTemplate } from "@/lib/decisionContext";
import {
  createFormIntakeDataset,
  detectFormTable,
  stripHxlTagRow,
} from "@/lib/formIntake";
import { profileDataset } from "@/lib/profiling";

describe("form intake", () => {
  it("creates a session-only form dataset from a reviewed decision template", () => {
    const template = buildSuggestedDataCollectionTemplate(
      createDecisionBriefFromTemplate("response_prioritization"),
    );
    const dataset = createFormIntakeDataset({
      name: "rapid-needs-form",
      template,
      rows: [
        {
          admin_area: "North",
          admin_code: "D01",
          observation_date: "2026-06-20",
          severity_score: "78",
          affected_population: "1200",
          response_gap_percent: "35",
          current_capacity: "2",
          data_source: "field team",
        },
      ],
    });

    expect(dataset.sourceType).toBe("form");
    expect(dataset.fileType).toBe("csv");
    expect(dataset.data?.[0].severity_score).toBe(78);
    expect(dataset.inputHints?.formIntakeMetadata?.privacyAudit).toEqual({
      sessionOnly: true,
      persistedMetadataOnly: true,
      rowValuesExcludedFromMetadata: true,
    });
    expect(JSON.stringify(dataset.inputHints?.formIntakeMetadata)).not.toContain("North");
  });

  it("detects and strips HXL tag rows without treating tags as records", () => {
    const rows = [
      {
        district_code: "#adm2+code",
        district_name: "#adm2+name",
        org: "#org",
        sector: "#sector",
        activity: "#activity",
      },
      {
        district_code: "D01",
        district_name: "North",
        org: "Responder A",
        sector: "WASH",
        activity: "Water trucking",
      },
    ];

    const result = stripHxlTagRow(rows);

    expect(result.hxlTags).toEqual({
      district_code: "#adm2+code",
      district_name: "#adm2+name",
      org: "#org",
      sector: "#sector",
      activity: "#activity",
    });
    expect(result.records).toHaveLength(1);
    expect(result.records[0].district_code).toBe("D01");
  });

  it("detects OCHA 3W/5W-style operational presence tables", () => {
    const result = detectFormTable([
      {
        organization: "Responder A",
        sector: "WASH",
        activity: "Water trucking",
        admin_code: "D01",
        reporting_period: "2026-W25",
      },
    ]);

    expect(result.detection.detectedType).toBe("ocha_3w_5w");
    expect(result.detection.status).toBe("detected");
    expect(result.detection.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.evidenceMappings.map((mapping) => mapping.evidenceNeed)).toContain("Admin geography");
    expect(result.evidenceMappings.map((mapping) => mapping.evidenceNeed)).toContain("Capacity signal");
  });

  it("marks weak or mixed form evidence for review", () => {
    const result = detectFormTable([
      {
        place: "North",
        notes: "some activity happened",
      },
    ]);

    expect(result.detection.status).toBe("review_needed");
    expect(result.detection.confidence).toBeLessThan(0.7);
    expect(result.detection.ambiguities.length).toBeGreaterThan(0);
  });

  it("profiles form-derived datasets through the normal pipeline", () => {
    const template = buildSuggestedDataCollectionTemplate(
      createDecisionBriefFromTemplate("response_prioritization"),
    );
    const dataset = createFormIntakeDataset({
      name: "rapid-needs-form",
      template,
      rows: [
        {
          admin_area: "North",
          admin_code: "D01",
          observation_date: "2026-06-20",
          severity_score: "78",
          affected_population: "1200",
          response_gap_percent: "35",
          current_capacity: "2",
          data_source: "field team",
        },
      ],
    });
    const profile = profileDataset(dataset);

    expect(profile.potentialGeographicFields).toContain("admin_area");
    expect(profile.potentialMetricFields).toContain("severity_score");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```powershell
npm run test -- tests/formIntake.test.ts
```

Expected: fail because `@/lib/formIntake` does not exist.

- [ ] **Step 3: Implement `lib/formIntake.ts`**

Add:

```ts
import type { Dataset } from "@/types/dataset";
import type { SuggestedDataCollectionTemplate } from "@/types/decision";
import type {
  FormDetectionResult,
  FormEvidenceMapping,
  FormIntakeMetadata,
  FormSchemaSummary,
} from "@/types/formIntake";
import { createTabularDataset } from "./fileParsers";

type FormDatasetInput = {
  name: string;
  template: SuggestedDataCollectionTemplate;
  rows: Record<string, unknown>[];
};

const OCHA_3W_ALIASES = new Map<string, string>([
  ["organization", "Capacity signal"],
  ["organisation", "Capacity signal"],
  ["org", "Capacity signal"],
  ["sector", "Service availability"],
  ["cluster", "Service availability"],
  ["activity", "Response gap"],
  ["service", "Service availability"],
  ["admin_area", "Admin geography"],
  ["admin_code", "Admin geography"],
  ["pcode", "Admin geography"],
  ["district", "Admin geography"],
  ["location", "Admin geography"],
  ["reporting_period", "Admin geography"],
]);

const HXL_EVIDENCE = new Map<string, string>([
  ["#adm", "Admin geography"],
  ["#date", "Admin geography"],
  ["#geo", "Admin geography"],
  ["#org", "Capacity signal"],
  ["#sector", "Service availability"],
  ["#activity", "Response gap"],
  ["#affected", "Affected population"],
  ["#population", "Population denominator"],
  ["#status", "Service availability"],
]);

export function createFormIntakeDataset(input: FormDatasetInput): Dataset {
  const sanitizedRows = input.rows
    .map((row) => normalizeRow(row, input.template.fields.map((field) => field.name)))
    .filter((row) => Object.values(row).some((value) => value !== "" && value !== undefined && value !== null));
  const dataset = createTabularDataset(`${input.name}.csv`, "csv", "form", sanitizedRows);
  const metadata = metadataFromTemplate(input.template);

  return {
    ...dataset,
    name: input.name,
    originalFilename: `${input.name}.csv`,
    inputHints: {
      evidenceRole: input.template.title,
      semanticNotes: "Form-derived dataset created in browser/session state from reviewed decision fields.",
      formFamilyId: "decision-template",
      formFamilyName: input.template.title,
      formDetectionStatus: "detected",
      formEvidenceMappings: metadata.evidenceMappings,
      formIntakeMetadata: metadata,
    },
  };
}

export function stripHxlTagRow(rows: Record<string, unknown>[]) {
  const [first, ...rest] = rows;
  if (!first) return { records: rows, hxlTags: {} as Record<string, string> };
  const entries = Object.entries(first);
  const tagEntries = entries.filter(([, value]) => typeof value === "string" && value.trim().startsWith("#"));
  if (tagEntries.length < Math.max(2, Math.ceil(entries.length / 2))) {
    return { records: rows, hxlTags: {} as Record<string, string> };
  }
  return {
    records: rest,
    hxlTags: Object.fromEntries(tagEntries.map(([key, value]) => [key, String(value).trim()])),
  };
}

export function detectFormTable(rows: Record<string, unknown>[]): FormIntakeMetadata {
  const { records, hxlTags } = stripHxlTagRow(rows);
  const columns = Object.keys(records[0] ?? rows[0] ?? {});
  const hxlMappings = mappingsFromHxlTags(hxlTags);
  const ochaMappings = mappingsFromAliases(columns);
  const evidenceMappings = mergeMappings([...hxlMappings, ...ochaMappings]);
  const detection = detectSource(columns, hxlTags, evidenceMappings);

  return {
    detection,
    schemaSummary: {
      fileType: "csv",
      fieldCount: columns.length,
      requiredFieldCount: 0,
      choiceListCount: 0,
      hxlTagCount: Object.keys(hxlTags).length,
      questionTypeSummary: {},
    },
    evidenceMappings,
    privacyAudit: {
      sessionOnly: true,
      persistedMetadataOnly: true,
      rowValuesExcludedFromMetadata: true,
    },
  };
}

function metadataFromTemplate(template: SuggestedDataCollectionTemplate): FormIntakeMetadata {
  const evidenceMappings = template.fields.map((field): FormEvidenceMapping => ({
    evidenceNeed: field.evidenceNeed,
    sourceField: field.name,
    sourceLabel: field.label,
    mappingBasis: "column_alias",
    confidence: field.required ? 0.9 : 0.72,
    status: "covered",
    caveat: field.caveat,
    reviewerDecision: "accepted",
  }));
  return {
    detection: {
      detectedType: "custom_tabular_form",
      familyId: "decision-template",
      familyName: template.title,
      confidence: 0.9,
      status: "detected",
      rationale: "Generated from the selected decision template fields.",
      ambiguities: [],
      unsupportedReasons: [],
    },
    schemaSummary: {
      fileType: "csv",
      fieldCount: template.fields.length,
      requiredFieldCount: template.fields.filter((field) => field.required).length,
      choiceListCount: 0,
      hxlTagCount: 0,
      questionTypeSummary: template.fields.reduce<Record<string, number>>((summary, field) => {
        summary[field.type] = (summary[field.type] ?? 0) + 1;
        return summary;
      }, {}),
    },
    evidenceMappings,
    privacyAudit: {
      sessionOnly: true,
      persistedMetadataOnly: true,
      rowValuesExcludedFromMetadata: true,
    },
  };
}

function normalizeRow(row: Record<string, unknown>, orderedFields: string[]) {
  return Object.fromEntries(
    orderedFields.map((field) => [field, normalizeValue(row[field])]),
  );
}

function normalizeValue(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "") return "";
  const numeric = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(numeric) && /^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+(\.\d+)?$/.test(trimmed)
    ? numeric
    : trimmed;
}

function mappingsFromAliases(columns: string[]): FormEvidenceMapping[] {
  return columns.flatMap((column) => {
    const normalized = normalize(column);
    const evidenceNeed = OCHA_3W_ALIASES.get(normalized);
    if (!evidenceNeed) return [];
    return [{
      evidenceNeed,
      sourceField: column,
      mappingBasis: "column_alias",
      confidence: 0.74,
      status: "covered",
      reviewerDecision: "needs_review",
    }];
  });
}

function mappingsFromHxlTags(hxlTags: Record<string, string>): FormEvidenceMapping[] {
  return Object.entries(hxlTags).flatMap(([field, tag]) => {
    const evidenceNeed = [...HXL_EVIDENCE.entries()].find(([prefix]) => tag.startsWith(prefix))?.[1];
    if (!evidenceNeed) return [];
    return [{
      evidenceNeed,
      sourceField: field,
      sourceTag: tag,
      mappingBasis: "hxl_tag",
      confidence: 0.82,
      status: "covered",
      reviewerDecision: "needs_review",
    }];
  });
}

function mergeMappings(mappings: FormEvidenceMapping[]) {
  const seen = new Set<string>();
  return mappings.filter((mapping) => {
    const key = `${mapping.evidenceNeed}:${mapping.sourceField}:${mapping.sourceTag ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function detectSource(
  columns: string[],
  hxlTags: Record<string, string>,
  mappings: FormEvidenceMapping[],
): FormDetectionResult {
  const normalizedColumns = columns.map(normalize);
  const hasHxl = Object.keys(hxlTags).length >= 2;
  const ochaSignalCount = ["organization", "organisation", "org", "sector", "activity"].filter((name) =>
    normalizedColumns.includes(name),
  ).length;
  if (hasHxl) {
    return {
      detectedType: "hxl_tagged_table",
      familyId: "hxl",
      familyName: "HXL-tagged humanitarian table",
      confidence: 0.86,
      status: "detected",
      rationale: "The first record contains HXL hashtag metadata for multiple columns.",
      ambiguities: [],
      unsupportedReasons: [],
    };
  }
  if (ochaSignalCount >= 3 && mappings.length >= 3) {
    return {
      detectedType: "ocha_3w_5w",
      familyId: "ocha-3w-5w",
      familyName: "OCHA 3W/5W-style operational presence",
      confidence: 0.74,
      status: "detected",
      rationale: "Columns include organization, sector/activity, and location-like fields.",
      ambiguities: [],
      unsupportedReasons: [],
    };
  }
  return {
    detectedType: "custom_tabular_form",
    familyId: "custom-tabular-form",
    familyName: "Custom tabular form",
    confidence: mappings.length > 0 ? 0.46 : 0.2,
    status: "review_needed",
    rationale: "Only weak form-family signals were found.",
    ambiguities: ["Confirm which columns support the decision evidence before using mappings."],
    unsupportedReasons: [],
  };
}

function normalize(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm run test -- tests/formIntake.test.ts
```

Expected: all tests in `tests/formIntake.test.ts` pass.

---

### Task 3: Integrate Form Mappings Into Evidence Coverage

**Files:**
- Modify: `lib/decisionContext.ts`
- Modify: `tests/dataPipeline.test.ts`

- [ ] **Step 1: Add failing integration test**

Add to `tests/dataPipeline.test.ts` inside the existing `describe("data pipeline", ...)` block:

```ts
  it("uses form evidence mappings before generic column-name inference", () => {
    const dataset = withProfile({
      ...createTabularDataset("field-form.csv", "csv", "form", parseCsv("place,need,people,gap,teams\nNorth,78,1200,35,2\n")),
      inputHints: {
        formFamilyId: "custom-tabular-form",
        formFamilyName: "Custom rapid response form",
        formDetectionStatus: "detected",
        formEvidenceMappings: [
          { evidenceNeed: "Admin geography", sourceField: "place", mappingBasis: "manual", confidence: 0.88, status: "covered" },
          { evidenceNeed: "Need severity", sourceField: "need", mappingBasis: "manual", confidence: 0.88, status: "covered" },
          { evidenceNeed: "Affected population", sourceField: "people", mappingBasis: "manual", confidence: 0.88, status: "covered" },
          { evidenceNeed: "Response gap", sourceField: "gap", mappingBasis: "manual", confidence: 0.88, status: "covered" },
          { evidenceNeed: "Capacity signal", sourceField: "teams", mappingBasis: "manual", confidence: 0.88, status: "covered" },
        ],
      },
    });
    const brief = createDecisionBriefFromTemplate("response_prioritization");
    const coverage = buildEvidenceCoverageSummary([dataset], brief);
    const readiness = assessDecisionReadiness(dataset, brief, runQualityChecks(dataset)).readiness;

    expect(coverage.missingCount).toBe(0);
    expect(coverage.items.every((item) => item.status === "covered")).toBe(true);
    expect(coverage.items.find((item) => item.evidenceNeed === "Need severity")?.candidates[0].columnName).toBe("need");
    expect(readiness.requiredEvidenceMissing).toEqual([]);
  });
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npm run test -- tests/dataPipeline.test.ts
```

Expected: fail because `assessDecisionReadiness` still uses column-name
patterns only.

- [ ] **Step 3: Add form mapping candidate helper**

In `lib/decisionContext.ts`, add before `evidenceCandidatesForDataset`:

```ts
function formEvidenceCandidatesForDataset(
  dataset: Dataset,
  rule: EvidenceRule,
): EvidenceCoverageCandidate[] {
  const mappings = dataset.inputHints?.formEvidenceMappings ?? [];
  const rows = dataset.data ?? [];
  return mappings
    .filter((mapping) => mapping.evidenceNeed === rule.label && mapping.status !== "missing")
    .map((mapping) => {
      const profileColumn = dataset.profile?.columns.find(
        (column) => column.columnName === mapping.sourceField,
      );
      return {
        datasetId: dataset.id,
        datasetName: dataset.name,
        columnName: mapping.sourceField,
        inferredType: profileColumn?.inferredType ?? inferBasicType(rows, mapping.sourceField),
        missingPercentage:
          profileColumn?.missingPercentage ?? calculateMissingPercentage(rows, mapping.sourceField),
        confidence: Math.max(0, Math.min(1, mapping.confidence)),
        rationale: `Form mapping (${mapping.mappingBasis}) links this field to ${rule.label.toLowerCase()}.`,
      };
    });
}
```

Then change the candidate collection in `buildEvidenceCoverageSummary` from:

```ts
const candidates = datasets
  .flatMap((dataset) => evidenceCandidatesForDataset(dataset, rule))
```

to:

```ts
const candidates = datasets
  .flatMap((dataset) => [
    ...formEvidenceCandidatesForDataset(dataset, rule),
    ...evidenceCandidatesForDataset(dataset, rule),
  ])
```

- [ ] **Step 4: Update readiness missing-evidence check**

In `assessDecisionReadiness`, before `const missingFindings = requiredRules`,
add:

```ts
const formMappedEvidence = new Set(
  (dataset.inputHints?.formEvidenceMappings ?? [])
    .filter((mapping) => mapping.status === "covered")
    .map((mapping) => mapping.evidenceNeed),
);
```

Change the missing filter from:

```ts
.filter((rule) => !columns.some((column) => rule.patterns.some((pattern) => pattern.test(column))))
```

to:

```ts
.filter(
  (rule) =>
    !formMappedEvidence.has(rule.label) &&
    !columns.some((column) => rule.patterns.some((pattern) => pattern.test(column))),
)
```

- [ ] **Step 5: Run integration test**

Run:

```powershell
npm run test -- tests/dataPipeline.test.ts
```

Expected: pass.

---

### Task 4: Add Handoff Metadata And Privacy Guard Tests

**Files:**
- Modify: `lib/workflowExport.ts`
- Modify: `tests/dataPipeline.test.ts`
- Modify: `tests/privacy-no-row-persistence.test.ts`

- [ ] **Step 1: Add failing handoff test**

Add to `tests/dataPipeline.test.ts`:

```ts
  it("includes form mapping metadata in decision handoff without sample values", () => {
    const dataset = withProfile({
      ...createTabularDataset("field-form.csv", "csv", "form", parseCsv("place,need\nNorth,78\n")),
      inputHints: {
        formFamilyId: "custom-tabular-form",
        formFamilyName: "Custom rapid response form",
        formDetectionStatus: "detected",
        formEvidenceMappings: [
          { evidenceNeed: "Admin geography", sourceField: "place", mappingBasis: "manual", confidence: 0.88, status: "covered" },
          { evidenceNeed: "Need severity", sourceField: "need", mappingBasis: "manual", confidence: 0.88, status: "covered" },
        ],
        formIntakeMetadata: {
          detection: {
            detectedType: "custom_tabular_form",
            familyId: "custom-tabular-form",
            familyName: "Custom rapid response form",
            confidence: 0.88,
            status: "detected",
            rationale: "Manual test mapping.",
            ambiguities: [],
            unsupportedReasons: [],
          },
          schemaSummary: {
            fileType: "csv",
            fieldCount: 2,
            requiredFieldCount: 2,
            choiceListCount: 0,
            hxlTagCount: 0,
            questionTypeSummary: {},
          },
          evidenceMappings: [
            { evidenceNeed: "Admin geography", sourceField: "place", mappingBasis: "manual", confidence: 0.88, status: "covered" },
            { evidenceNeed: "Need severity", sourceField: "need", mappingBasis: "manual", confidence: 0.88, status: "covered" },
          ],
          privacyAudit: {
            sessionOnly: true,
            persistedMetadataOnly: true,
            rowValuesExcludedFromMetadata: true,
          },
        },
      },
    });
    const brief = createDecisionBriefFromTemplate("response_prioritization");
    const evidenceCoverage = buildEvidenceCoverageSummary([dataset], brief);
    const handoff = buildDecisionHandoffPacket({
      decisionBrief: brief,
      evidenceCoverage,
      datasets: [dataset],
      selectedJoinRecommendations: [],
      qualityResults: [],
      transformationLog: [],
      aiMode: "disabled",
    });
    const serialized = JSON.stringify(handoff);

    expect(handoff.datasetLineage[0].formIntake?.detection.familyName).toBe("Custom rapid response form");
    expect(handoff.datasetLineage[0].formIntake?.evidenceMappings).toHaveLength(2);
    expect(serialized).not.toContain("North");
    expect(serialized).not.toContain("\"78\"");
  });
```

- [ ] **Step 2: Run test to verify failure**

Run:

```powershell
npm run test -- tests/dataPipeline.test.ts
```

Expected: fail because `datasetLineage[].formIntake` is not exported yet.

- [ ] **Step 3: Add safe handoff fields**

In `lib/workflowExport.ts`, inside `datasetLineage: input.datasets.map`,
add:

```ts
      formIntake: dataset.inputHints?.formIntakeMetadata
        ? {
            detection: dataset.inputHints.formIntakeMetadata.detection,
            schemaSummary: dataset.inputHints.formIntakeMetadata.schemaSummary,
            evidenceMappings: dataset.inputHints.formIntakeMetadata.evidenceMappings.map((mapping) => ({
              evidenceNeed: mapping.evidenceNeed,
              sourceField: mapping.sourceField,
              sourceLabel: mapping.sourceLabel,
              sourceTag: mapping.sourceTag,
              mappingBasis: mapping.mappingBasis,
              confidence: mapping.confidence,
              status: mapping.status,
              caveat: mapping.caveat,
              reviewerDecision: mapping.reviewerDecision,
            })),
            privacyAudit: dataset.inputHints.formIntakeMetadata.privacyAudit,
          }
        : undefined,
```

This is metadata only. Do not include sample values, rows, or full uploaded form
files.

- [ ] **Step 4: Add privacy guard**

Add to `tests/privacy-no-row-persistence.test.ts`:

```ts
  it("keeps form intake client-safe and persistence-free", () => {
    const formIntakeSource = readFileSync(join(ROOT, "lib", "formIntake.ts"), "utf8");

    expect(formIntakeSource).not.toMatch(/@\/lib\/db|@\/lib\/supabase|serverClient|metadataAdapter/i);
    expect(formIntakeSource).not.toMatch(/\bfetch\s*\(/);
    expect(formIntakeSource).not.toMatch(/insert|upsert|update|delete|persist|saveForm|formSubmission/i);
  });
```

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm run test -- tests/dataPipeline.test.ts tests/privacy-no-row-persistence.test.ts
```

Expected: pass.

---

### Task 5: Add Protected-App Form Intake Review UI

**Files:**
- Create: `components/workflow/FormIntakePanel.tsx`
- Modify: `components/WorkflowComponents.tsx`
- Modify: `components/DashboardCopilotApp.tsx`
- Modify: `app/styles.css`

- [ ] **Step 1: Inspect existing dirty diffs before UI edits**

Run:

```powershell
git diff -- components\WorkflowComponents.tsx components\DashboardCopilotApp.tsx app\styles.css
```

Expected: understand existing changes before editing. If the diff contains
unrelated user work that makes safe integration unclear, stop and report.

- [ ] **Step 2: Create `FormIntakePanel`**

Create `components/workflow/FormIntakePanel.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Dataset } from "@/types/dataset";
import type { DecisionBrief } from "@/types/decision";
import { buildSuggestedDataCollectionTemplate } from "@/lib/decisionContext";
import { createFormIntakeDataset, detectFormTable } from "@/lib/formIntake";

type FormIntakePanelProps = {
  decisionBrief: DecisionBrief;
  onCreateDataset: (dataset: Dataset) => void;
};

export function FormIntakePanel({ decisionBrief, onCreateDataset }: FormIntakePanelProps) {
  const template = useMemo(() => buildSuggestedDataCollectionTemplate(decisionBrief), [decisionBrief]);
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(
    template.fields.map((field) => [field.name, ""]),
  ));
  const preview = detectFormTable([draft]);

  function updateField(name: string, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function createDataset() {
    onCreateDataset(createFormIntakeDataset({
      name: `${decisionBrief.useCaseId}-form-intake`,
      template,
      rows: [draft],
    }));
    setDraft(Object.fromEntries(template.fields.map((field) => [field.name, ""])));
  }

  return (
    <section className="form-intake-panel" aria-labelledby="form-intake-title">
      <div className="form-intake-panel__header">
        <div>
          <h3 id="form-intake-title">Form intake</h3>
          <p>{preview.detection.familyName ?? "Decision-template fields"} · {preview.detection.status.replace("_", " ")}</p>
        </div>
        <button type="button" className="secondary-button" onClick={createDataset}>
          Add form dataset
        </button>
      </div>
      <div className="form-intake-panel__grid">
        {template.fields.map((field) => (
          <label key={field.name} className="form-intake-field">
            <span>{field.label}</span>
            <input
              value={draft[field.name] ?? ""}
              onChange={(event) => updateField(field.name, event.target.value)}
              inputMode={field.type === "integer" || field.type === "number" || field.type === "percent" ? "decimal" : "text"}
            />
            <small>{field.evidenceNeed}</small>
          </label>
        ))}
      </div>
      <div className="form-intake-panel__mappings">
        {preview.evidenceMappings.slice(0, 6).map((mapping) => (
          <span key={`${mapping.evidenceNeed}-${mapping.sourceField}`}>
            {mapping.evidenceNeed}: {mapping.sourceField}
          </span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Wire panel into upload/data step only when not sample-only**

In `components/WorkflowComponents.tsx`:

1. Import:

```ts
import { FormIntakePanel } from "@/components/workflow/FormIntakePanel";
```

2. Add props to the upload step component that currently receives file/sample
handlers:

```ts
onCreateFormDataset: (dataset: Dataset) => void;
sampleOnly?: boolean;
decisionBrief: DecisionBrief;
```

3. Render the panel inside the protected upload/data workflow:

```tsx
{!sampleOnly ? (
  <FormIntakePanel
    decisionBrief={decisionBrief}
    onCreateDataset={onCreateFormDataset}
  />
) : null}
```

Do not render this panel for `/demo` sample-only mode.

- [ ] **Step 4: Add dataset handler in `DashboardCopilotApp.tsx`**

Add a handler near existing dataset upload/sample handlers:

```ts
function addFormDataset(dataset: Dataset) {
  setState((current) => ({
    ...current,
    datasets: [...current.datasets, dataset],
    preparedDataset: undefined,
    selectedJoinRecommendations: [],
    appliedTransformations: [],
    qualityResults: [],
    dashboardRecommendation: undefined,
  }));
}
```

Pass it to `WorkflowComponents`/upload step as `onCreateFormDataset`.

- [ ] **Step 5: Add minimal CSS**

Add to `app/styles.css`:

```css
.form-intake-panel {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  background: var(--surface);
}

.form-intake-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.form-intake-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.form-intake-field {
  display: grid;
  gap: 6px;
}

.form-intake-field input {
  min-height: 40px;
}

.form-intake-panel__mappings {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.form-intake-panel__mappings span {
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 0.82rem;
}
```

If these CSS variables do not exist, use the nearest existing surface/border
variables in `app/styles.css` rather than introducing a new palette.

- [ ] **Step 6: Run type/build gates for UI changes**

Run:

```powershell
npm run lint
npm run build
```

Expected: both pass.

---

### Task 6: Final Verification And Review

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run full test suite**

Run:

```powershell
npm run test
```

Expected: pass.

- [ ] **Step 2: Run full type check**

Run:

```powershell
npm run lint
```

Expected: pass.

- [ ] **Step 3: Run production build guard**

Run:

```powershell
npm run build
```

Expected: pass.

- [ ] **Step 4: Run diff hygiene check**

Run:

```powershell
git diff --check
```

Expected: pass, or Windows line-ending warnings only if already present and
not introduced by this feature.

- [ ] **Step 5: Verify no forbidden changes**

Run:

```powershell
git diff --name-only
rg -n "form_submissions|uploaded_rows|prepared_rows|prompt_bodies|model_responses|SUPABASE_SECRET_KEY|DATABASE_URL|OPENAI_API_KEY|LLM_API_KEY|fetch\\(" lib types components app tests
```

Expected: changed files are limited to local form intake, UI, tests, and docs;
no forbidden persistence tables, secrets, provider calls, or new raw-row server
paths are introduced. `fetch(` may appear in unrelated existing files; inspect
any match in new form-intake code.

- [ ] **Step 6: Optional browser smoke**

If a local dev server can be started safely:

```powershell
npm run dev
```

Open `/app/data` while unauthenticated and verify redirect to login. If an
authenticated local session is unavailable, report the protected-route UI smoke
as unverified. Do not change `/demo`.

- [ ] **Step 7: Final handoff**

Report:

- objective;
- files changed;
- subagents used;
- commands run and results;
- implemented behavior;
- not verified;
- production/external work not performed;
- privacy gates checked;
- remaining risks and next action.
