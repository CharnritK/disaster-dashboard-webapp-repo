# Form Expansion, Repair Layer, And Coach Design

Date: 2026-06-28

## Decision

Approved scope: local/staging-safe form-intake expansion plus a Decision
Repair Layer and a Next Best Action Coach.

Post-review execution note: this document describes the broader product
direction. The first long-running implementation goal is narrower:
session-only repair actions, deterministic next-best-action coaching, protected
UI integration, and tests. Registry persistence, reusable mapping persistence,
new APIs, AI schema interpretation, connector sync, OCR/PDF, geocoding, and
fuzzy matching are later approval-gated goals.

This is not approval for production deployment, production migrations,
production environment changes, provider/model changes, open signup, public
demo upload, anonymous AI, raw data persistence, or background retention
automation.

## Product Outcome

Turn form-intake warnings from passive flags into guided next actions. A user
should know what is wrong, why it matters, the easiest safe fix, what the app can
do, and what still requires human review.

The coach should stop being generic. It should triage the current workflow,
rank the next best actions, and explain the lowest-effort path to decision
readiness.

## Core Product Primitives

### 1. Later Metadata-Only Form Registry

Persist reviewed or user-owned metadata about form families and schema versions:

- form family, title, status, visibility, owner, review state;
- versioned field summaries: field name, label, type, evidence role, required
  flag, HXL tag, choice list name;
- schema counts, caveats, confidence thresholds, source notes;
- no uploaded files, raw rows, prepared rows, OCR text, connector rows, full
  prompts, model responses, exported reports, or secrets.

### 2. Later Reusable Mapping Registry

Persist reusable metadata that maps source form fields to evidence needs:

- evidence need;
- source field names and optional form version reference;
- mapping basis: deterministic rule, user-reviewed, registry-reviewed, AI
  suggested;
- confidence, caveats, review status;
- no sample values or row-like values.

### 3. Decision Repair Layer

Every detected issue becomes a structured `RepairAction`:

- `issueType`: missing evidence, ambiguous mapping, weak detection, connector
  sync issue, OCR confidence issue, geocoding uncertainty, fuzzy match conflict,
  AI fallback, quota/auth issue;
- `severity`: info, review, blocker;
- `whyItMatters`: operational consequence in plain language;
- `easiestFix`: lowest-effort next action;
- `alternatives`: other possible paths;
- `appCanHelpWith`: concrete supported assistance;
- `humanMustReview`: non-automatable judgment;
- `estimatedEffort`: seconds, minutes, needs owner;
- `safeAutomationLevel`: suggest only, apply after review, not automatable.

Flags must not dead-end. The repair layer should always offer at least one safe
next step unless the issue is intentionally blocked by missing credentials or
production approval.

### 4. Next Best Action Coach

The coach consumes workflow state and repair actions, then ranks the next 1-3
actions. It should support these modes:

- triage: what blocks decision readiness;
- repair: how to fix with least effort;
- explain: why the issue was flagged;
- proceed: whether dashboard/export is reasonable;
- handoff: what caveat belongs in the decision-owner packet.

Deterministic coach output is the authority. Optional AI may improve wording or
strategy only after auth, entitlement, quota, provider preflight, and minimized
schema-only payload validation.

## Later Expansion Surfaces

### AI Schema Interpretation

Add a dedicated server route and task type for schema-only interpretation.
It must not reuse dashboard prompts. It must send only metadata:

- field names;
- labels;
- types;
- required flags;
- HXL tags;
- counts;
- existing deterministic mappings;
- caveats.

It must not send raw rows, sample values, files, full schemas with row-like
values, full prompts, exports, or model responses for persistence.

### Live KoBo/ODK/Google Forms Sync

Initial implementation is connector metadata plus explicit user-triggered
session import planning. Persist only:

- connector kind;
- external object opaque id or hash;
- schema hash;
- sync status;
- field count;
- record count only if provided as metadata;
- last checked timestamp;
- caveats.

Do not persist tokens, credentials, synced records, raw responses, form files,
or background sync jobs in this pass.

### PDF/OCR

Initial implementation stores job metadata only:

- document type;
- page count;
- parse status;
- extracted field-name candidates;
- confidence buckets;
- caveats.

Do not persist PDFs, page images, OCR text, extracted rows, screenshots, or full
document text.

### Geocoding

Initial implementation generates review-only candidate metadata:

- source field role;
- provider/config version;
- matched count;
- unmatched count;
- precision buckets;
- caveats.

Do not persist row-level coordinates, addresses, place names, or geocoded result
rows.

### Fuzzy Matching

Fuzzy matching is a review aid, not a cleaning transform. It may propose
candidate matches with confidence, rationale, and review status. It must not
auto-merge, deduplicate, recode, delete rows, or mutate prepared data.

## UI Strategy

Keep the first implementation inside protected `/app/data`, expanding the
existing form intake panel and dataset metadata panel. Do not add a new route
unless URL-level navigation proves necessary.

The UI should show:

- form family and detection confidence;
- registry match status;
- reusable mapping suggestions;
- repair cards grouped by severity;
- coach-ranked next actions;
- explicit caveats and review requirements.

The public `/demo` remains deterministic, sample-only, and without arbitrary
upload controls.

## Data Boundary

First implementation slice has no new persistence. The following persistence
list is for later approval-gated expansion only.

Allowed persistence for later expansion:

- `form_registries`;
- `form_registry_versions`;
- `reusable_mappings`;
- `connector_metadata`;
- `geocoding_metadata`;
- `ocr_pdf_metadata`;
- aggregate/admin metadata counts for those tables.

Forbidden persistence remains:

- uploaded raw files;
- uploaded rows;
- prepared rows;
- connector records;
- synced rows;
- PDFs/images/screenshots;
- OCR full text;
- row-level geocoded coordinates or addresses;
- exported reports/files;
- full prompts;
- full LLM request bodies;
- model responses containing row-like values;
- secrets, API keys, tokens, service-role keys.

## Tests Required

Minimum unit and route coverage:

- form registry validators reject row-like fields and sample values;
- schema/RLS allow only approved metadata tables;
- adapter persists and lists registry/mapping metadata only;
- authenticated API routes reject unauthenticated access;
- AI schema route follows auth, entitlement, quota, provider preflight, reserve,
  event recording, and deterministic fallback;
- repair actions are generated for missing evidence, ambiguous mapping, weak
  form detection, fuzzy match conflict, geocoding uncertainty, OCR confidence
  issue, connector issue, and AI fallback;
- coach ranks next actions from repair actions and readiness state;
- public `/demo` remains unchanged and non-persistent;
- privacy guard confirms no form-intake raw data persistence or unsafe client
  imports.

## Red Team Questions

The challenger reviewer should attack:

- whether any path persists row-like or sensitive operational data;
- whether AI schema interpretation can echo and store unsafe values;
- whether repair cards accidentally imply operational authority;
- whether fuzzy matching/geocoding can silently mutate or overclaim;
- whether connector metadata leaks private source identifiers;
- whether the coach remains useful without becoming generic or authoritative;
- whether tests prove the boundaries rather than just checking strings.
