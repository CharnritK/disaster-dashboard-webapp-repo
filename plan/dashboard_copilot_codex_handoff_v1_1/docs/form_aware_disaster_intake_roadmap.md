# Form-Aware Disaster Intake Roadmap

Date: 2026-06-21

Status: Phase 13 local implementation slice added on
`codex/product-standout-roadmap`; final completion still depends on fresh local
verification gates.

## Real Problem

Disaster responders already collect data through operational forms and field
collection tools. The product should meet them where data starts, then answer a
harder question than a generic dashboard tool can answer:

> Does this form export contain enough evidence for this operational decision?

The differentiation is not "supports forms." The differentiation is
form-aware decision readiness: recognizable disaster-management form exports
become evidence coverage, reviewable readiness, dashboard recommendations, and
auditable handoff artifacts while uploaded data remains session-only.

## Strategic Outcome

Add a **Disaster Form Intelligence Layer** to the controlled-beta product:

1. detect likely source form/export family;
2. map form fields/tags/questions to existing decision evidence;
3. show missing and ambiguous evidence before dashboard generation;
4. preserve source and mapping caveats in the handoff package;
5. keep raw form responses, uploaded files, prepared rows, prompts, and model
   responses out of persistence.

## Source-Backed Product Basis

- FEMA publishes official ICS forms including incident briefing, status,
  resource, message, planning, and activity-log forms:
  <https://training.fema.gov/icsresource/icsforms.aspx>
- ICS 201 and ICS 209 contain incident context, location, situation summary,
  public/responder status, resource needs, and projected activity.
- OCHA 3W guidance frames operational presence by sector/location as a way to
  identify overlaps, gaps, and partner activity:
  <https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/214499412/Who%2Bdoes%2BWhat%2BWhere%2B3W>
- MIRA/JNA-style rapid assessments inform early response planning, impact,
  response gaps, and operational constraints:
  <https://handbook.fscluster.org/docs/651-multi-clustersector-initial-rapid-assessment>
- IFRC emergency needs assessments focus on immediate survival needs, affected
  groups, priority locations, severity, and response options:
  <https://www.ifrc.org/our-work/disasters-climate-and-crises/supporting-local-humanitarian-action/emergency-needs>
- ODK/XLSForm is a practical schema format for field collection definitions:
  <https://docs.getodk.org/tutorial-first-form/>
- HXL can provide humanitarian column semantics, but should be treated as an
  optional mapping vocabulary rather than a platform dependency:
  <https://centre.humdata.org/learn-how-to-use-the-humanitarian-exchange-language/>

## Phase 13 - Form-Aware Disaster Intake

Objective: build deterministic, session-only form-aware intake that recognizes
structured disaster form exports/schemas and maps them into the existing
readiness workflow.

Acceptance:

- in-scope structured form/export inputs are detected with status, confidence,
  rationale, and caveats;
- form-derived mappings can support existing evidence needs without bypassing
  deterministic readiness;
- ambiguous detection is marked `review_needed`;
- handoff exports include safe source-form and mapping metadata;
- no raw form responses, uploaded files, prepared rows, full schemas containing
  row-like values, full prompts, model responses, or exports are persisted;
- `/demo` remains deterministic and sample-only;
- `npm run lint`, `npm run test`, `npm run build`, and `git diff --check` pass
  for implementation work.

### Phase 13.0 - Persist Roadmap And Playbook

Status: this document plus the implementation plan and overnight playbook.

Artifacts:

- `plan/dashboard_copilot_codex_handoff_v1_1/docs/form_aware_disaster_intake_roadmap.md`
- `docs/superpowers/plans/2026-06-21-form-aware-disaster-intake.md`
- `docs/agent-playbooks/form-aware-disaster-intake-overnight.md`

### Phase 13.1 - Form Intake Contract

Build a pure client-safe form-intake contract:

- `FormIntakeDefinition`
- `FormIntakeField`
- `FormDetectionResult`
- `FormEvidenceMapping`
- `FormIntakeMetadata`

The contract must be metadata-only and safe to include in workflow state and
handoff exports. It must not create a DB/API route or persistence surface.

### Phase 13.2 - Deterministic Structured Recognizers

First recognizers:

- HXL-tagged CSV/XLSX-style rows;
- OCHA 3W/5W-style operational presence columns;
- XLSForm-like schema metadata from `survey`, `choices`, and `settings`
  structures.

Explicit non-goals for this phase:

- ICS PDF/OCR parsing;
- live KoBo/ODK/Google Forms sync;
- free-form AI form interpretation;
- universal humanitarian ontology.

### Phase 13.3 - Evidence Mapping And Readiness Integration

Map recognized fields to the current evidence taxonomy:

- Admin geography;
- Need severity;
- Affected population;
- Response gap;
- Service availability;
- Capacity signal;
- Hazard exposure;
- Vulnerability;
- Population denominator;
- Preparedness capacity.

Readiness must use deterministic form mappings first, column-name inference
second, and must continue to label evidence as covered, ambiguous, or missing.

### Phase 13.4 - Handoff Audit Fields

Add safe handoff metadata:

- `formDetection`: detected type/family, confidence, status, rationale, caveats;
- `schemaSummary`: field count, required field count, HXL tag count, question
  type summary;
- `evidenceMapping`: evidence need, source field, mapping basis, confidence,
  status, reviewer decision;
- `privacyAudit`: session-only statement and forbidden-persistence confirmation.

Do not include sample values or row-level form responses in handoff metadata.

### Phase 13.5 - Protected-App Review UI

Add a protected-app-only review surface where authenticated users can:

- see detected form/export type;
- review mapped fields and confidence;
- accept current-session mappings;
- see missing or ambiguous evidence;
- add a form-derived dataset into the existing session workflow.

Keep `/demo` unchanged unless there is explicit product approval to change demo
behavior.

### Phase 13.6 - Beta Validation

Validate with fixtures before external beta claims:

- HXL-tagged operational presence fixture;
- 3W/5W-style fixture with missing fields;
- XLSForm-like schema fixture;
- ambiguous/unsupported fixture;
- malicious label/formula-like fixture.

Success means the user can reach evidence coverage, readiness, dashboard
recommendations, and handoff export with form mapping caveats visible.

## Later Roadmap

Only after Phase 13 is stable:

- reviewed external form-family packs for ICS 201/209/213RR/214, FEMA PDA,
  MIRA/JNA, IFRC ENA, Sphere sector indicators, DTM, and HeRAMS-like forms;
- metadata-only reviewed registry persistence, if approved;
- reusable user mapping storage, if approved;
- read-only provider import adapters for KoBo/ODK, if approved;
- optional AI schema interpretation, if approved and kept auth/quota-gated,
  minimized, server-side, and deterministic-fallback-first.

## Agent And Subagent Usage

Recommended overnight execution is in
`docs/agent-playbooks/form-aware-disaster-intake-overnight.md`.

Use:

- Main Codex as accountable orchestrator.
- Agent A for pure form-intake contract and tests.
- Agent B for evidence/readiness/handoff integration.
- Agent C for protected-app UI review.
- Agent D for read-only privacy and verification review.

Subagents may inspect code and write their assigned local files. They must not
read secrets, inspect provider/account pages, deploy, migrate databases, mutate
production, or handle raw user disaster data.

## Required Tests

Implementation must add or update coverage for:

- registry validation;
- HXL detection and tag-row exclusion;
- 3W/5W operational presence detection;
- XLSForm-like schema metadata detection;
- evidence mapping confidence/status;
- readiness integration;
- handoff export metadata;
- privacy guards for no DB/server/persistence imports in form intake;
- unchanged `/demo` deterministic sample-only behavior.

Required final commands:

```powershell
npm run lint
npm run test
npm run build
git diff --check
```

## Decision Gates

Explicit user approval is required before:

- adding DB tables, migrations, or a persisted form-family registry;
- storing reusable user mapping overrides;
- enabling form upload in `/demo`;
- adding AI form/schema interpretation;
- changing AI provider, model, SDK, or quota policy;
- expanding evidence taxonomy beyond current decision needs;
- labeling any external form mapping as official or authoritative;
- adding fuzzy matching, imputation, deduplication, row deletion, geocoding, or
  non-row-preserving cleaning;
- adding live provider sync or background retention automation;
- production deployment or production environment mutation.

## Success Metrics

- Detection precision on approved fixtures is at least 90% for in-scope
  structured forms.
- False-confidence rate is near zero; ambiguous inputs are labeled ambiguous.
- Median manual mapping count is under three for supported form exports.
- At least one 3W/HXL-style fixture reaches readiness, dashboard, and handoff
  export without special-case breaks.
- No forbidden persistence is introduced.
- Existing lint, tests, build, and demo behavior remain stable.

## Current State Separation

Implemented before this roadmap:

- controlled-beta auth and protected app shell;
- CSV/XLSX parsing;
- evidence coverage and decision readiness;
- dashboard recommendations;
- handoff/project-kit export;
- metadata-only persistence boundary;
- deterministic public demo.

Implemented in the first local slice:

- deterministic form/export detection;
- HXL tag-row handling;
- XLSForm-like schema handling;
- form-aware evidence mapping;
- form mapping review UI;
- form detection fields in handoff output.

Not implemented:

- persisted form-family registry;
- reusable user mapping storage;
- AI form/schema interpretation;
- public-demo form upload;
- live external form sync;
- PDF/OCR parsing;
- external beta fixture precision measurement.

Production not performed:

- production deployment;
- production Supabase configuration;
- production migrations;
- production env mutation;
- admin allowlist change;
- retention automation.
