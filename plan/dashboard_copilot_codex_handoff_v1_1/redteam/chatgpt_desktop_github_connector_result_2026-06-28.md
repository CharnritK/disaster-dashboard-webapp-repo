Status

completed, with one evidence gap: the connector did not provide a usable recursive directory listing for tests/**/*.test.ts, so I directly inspected the known/addressable test file tests/formIntake.test.ts and attempted several likely test paths that returned 404. I am not treating missing test coverage as proven exhaustive absence.

Connector access used

GitHub connector/app read-only.

Used:

Repository metadata lookup
Branch/commit comparison
Read-only file fetches

Not used:

No account, billing, quota, deployment, production DB, secrets, .env, raw uploads, issue/PR/comment/commit, permission escalation, or repo mutation access.
No additional connector permission request was presented.
Repository/branch inspected
Repository: CharnritK/disaster-dashboard-webapp-repo
Branch: codex/salvage-pending-branch-work
Local HEAD reference supplied: ef6f09c
Connector result: intended branch was accessible and compared as identical to local HEAD ef6f09c.

No slug mismatch observed. I did not inspect CharnritK/disaster_dashboard_webapp_repo.

Files inspected

Directly inspected:

AGENTS.md
package.json
next.config.ts
vitest.config.ts
app/demo/page.tsx
app/app/layout.tsx
app/app/page.tsx
app/app/(workflow)/layout.tsx
app/app/(workflow)/data/page.tsx
app/app/(workflow)/prepare/page.tsx
app/app/(workflow)/readiness/page.tsx
app/app/(workflow)/dashboard/page.tsx
app/app/(workflow)/export/page.tsx
components/DashboardCopilotApp.tsx
components/WorkflowComponents.tsx
components/AiCoachPanel.tsx
components/workflow/WorkspaceWorkflowShell.tsx
components/workflow/WorkspaceRouteMarker.tsx
components/workflow/workspaceRoutes.ts
app/api/recommend/route.ts
app/api/copilot/route.ts
app/api/coach/route.ts
app/api/usage/route.ts
app/api/feedback/route.ts
app/api/templates/route.ts
app/admin/page.tsx
lib/fileParsers.ts
lib/formIntake.ts
types/formIntake.ts
types/copilot.ts
lib/profiling.ts
lib/decisionContext.ts
lib/deterministicJoinRecommendations.ts
lib/harmonization.ts
lib/cleaningTransforms.ts
lib/validation.ts
lib/dashboardRecommendations.ts
lib/vizPolicy.ts
lib/recommendationSchema.ts
lib/llmClient.ts
lib/copilotHandoff.ts
lib/workflowExport.ts
lib/apiSecurity.ts
lib/entitlement/index.ts
lib/db/metadataAdapter.ts
lib/db/metadataRuntime.ts
lib/db/serverClient.ts
lib/supabase/server.ts
lib/coach/index.ts
lib/coach/ai.ts
lib/templates/index.ts
lib/feedback/index.ts
lib/adminMetrics/index.ts
db/schema.sql
db/rls.sql
tests/formIntake.test.ts
plan/dashboard_copilot_codex_handoff_v1_1/docs/product_contract.md
plan/dashboard_copilot_codex_handoff_v1_1/docs/roadmap.md
plan/dashboard_copilot_codex_handoff_v1_1/docs/decisions_required.md

Evidence unavailable / not exhaustively inspected:

Full tests/**/*.test.ts enumeration.
Full directory enumeration for lib/vizRules/, lib/supabase/, lib/templates/, lib/feedback/, and lib/adminMetrics/; I inspected the directly addressable entrypoints.
Critical findings
1. Persisted form registry and reusable mappings are currently explicitly blocked, not merely unimplemented.

The proposed tables form_registries, form_registry_versions, and reusable_mappings conflict with the current product contract and decision record unless separately approved. The current contract allows only account/auth metadata, usage, events, feedback, templates, template versions, and non-sensitive eval metadata; it forbids uploaded files, uploaded rows, prepared rows, full datasets, exports, full prompts, full LLM bodies, row-like model responses, secrets, and sensitive operational data.

The decisions file is even more direct: persisted form-family registry tables and reusable user mapping storage remain blocked without separate explicit approval, along with AI form/schema interpretation, public demo form upload, fuzzy matching, geocoding, sync jobs, and labeling mappings as official.

The current metadata adapter allowlist also contains only user_profiles, ai_usage_daily, ai_events, feedback, custom_templates, and template_versions; no form registry tables are approved in code.

Impact: Any first slice that includes DB-backed form registry or reusable mappings should be cut from staging scope until schema, RLS, adapter allowlists, privacy tests, and explicit approval exist.

2. Existing session objects mix safe metadata with raw/session data; persisting them directly would violate the contract.

The current app correctly keeps uploads in browser/session workflow objects, but those objects include raw rows and samples. createTabularDataset stores data and sampleRows, and form-created datasets also carry data and sampleRows.

Form metadata itself has a privacy audit claiming metadata-only, but the code caveat says the row data remains on the dataset object for session workflow use.

Profiling also derives sampleValues and top values from row values, and those become part of DatasetProfile.

Impact: The registry must use a dedicated persistence DTO. Do not persist Dataset, DatasetProfile, Dataset.inputHints, FormIntakeMetadata, WorkflowContext, handoff packets, project kits, or profile objects wholesale.

3. The generic metadata sanitizer is not strong enough for a form registry.

sanitizeSafeMetadata validates key shape, scalar values, and truncates strings, but it does not reject sensitive key classes such as sample, value, row, prompt, response, ocr, geo, candidate, coordinate, address, file, or screenshot.

There are stronger patterns elsewhere: AI event metadata rejects keys containing prompt, row, sample, or response, and the template validator rejects row/sample/value/file/prompt/response keys for schema-like objects.

Impact: A registry implementation must not rely on SafeMetadata or arbitrary JSONB. It needs a registry-specific allowlist with explicit columns/enums, plus validator tests for disallowed key names and disallowed value shapes.

4. The current /api/coach route is not the right base for the proposed Next Best Action Coach.

The current coach route reads bounded JSON with a simple 4 KB text limit, defaults to step, and builds deterministic fallback hints from step only.

The AI path sends only step and optional readinessStatus; it does not consume structured repair actions or evidence coverage.

Its JSON reader is weaker than the shared readJsonRequest helper used by recommendation/copilot routes because it does not enforce content type or return structured 413/415/400 behavior.

Impact: First-slice Next Best Action should be a deterministic library function consuming sanitized repair actions and readiness state. Do not expand /api/coach until the local deterministic behavior and validators are locked.

5. Existing “repair actions” are handoff-summary actions, not the proposed Decision Repair Layer.

The current HandoffRepairAction type has only title, rationale, priority, and ownerHint.

The LLM handoff schema mirrors that shallow shape.

The proposed Decision Repair Layer requires issueType, severity, whyItMatters, easiestFix, alternatives, appCanHelpWith, humanMustReview, estimatedEffort, and safeAutomationLevel. That is a different canonical domain model.

Impact: Add a new deterministic RepairAction model. Do not overload HandoffRepairAction, and do not make the LLM handoff response the source of truth.

Important findings
1. /demo is reasonably protected today, but shared-component scope creep is the main risk.

/demo renders DashboardCopilotApp with forceDeterministic.

Inside the shared app, forceDeterministic disables AI API availability, and demo mode is derived from forceDeterministic && !workspaceMode.

The upload UI is also gated: UploadStep receives onFiles={undefined} in demo and sampleOnly={demoMode}.

The public-demo contract says no login, sample/synthetic data only, deterministic only, no AI calls, and CTA to sign in.

Risk: /demo and /app share DashboardCopilotApp, so any new registry-save button, coach route call, form upload surface, or AI toggle must be explicitly gated against demo mode.

2. /app/** protection is strong enough for the proposed authenticated workspace, but the pages are thin route markers.

The /app layout checks Supabase identity and redirects unauthenticated users to login.

The workflow route pages are mostly markers wrapped by WorkspaceWorkflowShell, which renders the same DashboardCopilotApp in workspace mode.

The step-to-route map is centralized: brief/upload/profile all map to /app/data, recommend maps to /app/prepare, validate to /app/readiness, dashboard to /app/dashboard, export to /app/export.

Implication: First-slice roadmap work should happen in shared domain/state components and deterministic libraries before page-level behavior. Route-level isolation is not yet meaningful.

3. Existing readiness/control-tower code is the best substrate for the Decision Repair Layer.

buildEvidenceReadinessControlTower already produces deterministic authority, action safety state, missing evidence, ambiguous evidence, blockers, next collection asks, source confidence, and review-state copy.

assessDecisionReadiness already converts missing evidence into high-severity failures, ambiguous form mappings into warnings, invalid values into failures, and sets decision_unsafe, review_needed, or ready.

formMappingReviewFindings already emits a structured warning for ambiguous form mappings with evidence need, affected columns, caveat, and suggested action.

Implication: Build repair actions from EvidenceCoverageSummary, DecisionReadinessResult, and QualityCheckResult[]. Avoid new detection logic in the repair layer.

4. Current UI copy still uses “Proceed” language in places where the roadmap wants review/handoff framing.

The validation step allows “Proceed After Reviewing High-severity Issues” and “Proceed With Dashboard Generation,” then enables dashboard generation.

The product contract says AI is advisory and deterministic readiness remains authoritative for workflow continuity.

Implication: For the roadmap, change copy to “Continue review,” “Generate review dashboard,” or “Prepare handoff,” especially when decision_unsafe or high-severity issues exist.

5. Current AI minimization is acceptable for existing recommendation routes but conflicts with future AI schema interpretation constraints.

minimizeProfiles includes sampleValues up to three per column unless the field is a coordinate field.

It also preserves input hints such as semanticNotes.

The current LLM prompt treats sample values and semantic notes as untrusted context and instructs the model not to ask for full datasets.

Implication: Future “AI schema interpretation” must use a separate schema-only minimizer that excludes sample values, row-like values, semantic notes, prompt-like free text, and full form labels unless specifically reviewed.

6. Export/project-kit code is export-only today, but dangerous if moved server-side or persisted.

The project kit includes prepared-data.csv, decision-handoff-log.json, dashboard config, prepared schema, and transformation log.

The handoff packet includes dataset lineage with fields, inputHints, form intake metadata, and format assessment.

Form intake metadata included in exports can contain field names, labels, HXL tags, caveats, evidence mappings, and privacy audit.

Implication: Keep exports browser-download/session-only. Do not persist dossiers, source registers, project kits, prepared schemas, or handoff packets.

7. SQL/RLS patterns exist, but they do not cover the proposed registry tables.

The schema draft says it is a review artifact, stores only account/quota/event/feedback/template metadata, and must never expand to uploaded rows, prepared rows, exports, screenshots, full prompts, full model responses, provider secrets, or operational incident details.

RLS revokes browser-role access, enables RLS on existing tables, and has owner/reviewed policies for templates.

Implication: Registry staging cannot be enabled until equivalent SQL/RLS exists and is reviewed. Server-only adapter allowlisting is necessary but not sufficient.

Missing tests

Existing inspected test coverage is useful but insufficient for this roadmap.

Observed coverage:

tests/formIntake.test.ts verifies template-created form datasets are metadata-only with no rows/samples.
It verifies form metadata excludes sensitive table row values even when the session dataset still contains them.
It verifies XLSForm-like schema summarization does not include choice labels or settings text.

Missing or not found in inspected evidence:

Registry persistence negative tests
Reject payloads containing data, rows, sampleRows, profile.columns[].sampleValues, semanticNotes, prompt, response, ocrText, geocoding candidates, fuzzy candidates, screenshots, arbitrary JSONB, or prepared rows.
Reusable mapping tests
Allow only source field names, evidence need IDs, mapping status, reviewer state, and safe confidence/caveat codes.
Reject source sample values, row-like values, labels copied from filled forms, OCR snippets, and model-derived candidate pairs.
Decision Repair Layer tests
Convert missing_evidence and ambiguous_mapping into full structured repair actions with all required fields.
Preserve deterministic readiness authority.
Never produce “approved,” “safe to act,” “operationally authorized,” or broad “proceed” language.
Next Best Action Coach tests
Deterministic coach consumes repair actions and readiness.
Returns one to three concrete steps.
Separates appCanHelpWith from humanMustReview.
Prioritizes blockers before warnings.
Handles unsupported future issue types without generic advice.
Demo regression tests
/demo cannot render upload controls.
/demo cannot call /api/recommend, /api/copilot, /api/coach, or any future registry route.
/demo cannot show registry-save/reusable-mapping UI.
Route tests for any new API
Auth required.
Cache-Control: no-store.
Content-Type required.
Request-size bound.
Unknown keys rejected.
Unsafe metadata keys rejected.
No LLM/provider call on validation failure.
DB/RLS tests
User A cannot read/write User B registry rows.
Reviewed/shared visibility does not leak field names unless deliberately approved.
Service-role-only writes are server-only.
No table accepts arbitrary JSONB payloads.
Architecture conflicts
Registry tables conflict with approved persistence scope.
Current approved metadata tables and product decisions exclude the proposed registry/mapping tables.
Current form-intake metadata is not a persistence schema.
It is embedded in session dataset hints and surrounded by raw/session data.
Current coach route is AI-augmentable and too shallow for the proposed deterministic coach.
It only uses step and readiness status; proposed coach needs sanitized repair actions and evidence/readiness context.
Current handoff repair actions are not the roadmap’s repair-action model.
They are a lightweight handoff summary construct, not a canonical action layer.
Current copilot handoff parser is narrower than the template system.
The decision templates support several use cases, but parseDecisionBrief in copilotHandoff currently accepts only response_prioritization.
Prepared/joined datasets remain row-bearing objects.
Harmonization and cleaning produce new datasets with data and sampleRows, so downstream persistence surfaces must never accept prepared datasets directly.
Privacy leaks

High-risk leak surfaces:

Persisting dataset/session objects
Dataset.data
Dataset.sampleRows
Dataset.profile.columns[].sampleValues
Dataset.inputHints.semanticNotes
Dataset.inputHints.formMetadata
Persisting profile-derived “metadata” without filtering
profileDataset derives sample values and top values from raw rows.
Persisting handoff/project-kit artifacts
Project kits include prepared CSV and JSON handoff/config artifacts.
Using generic JSONB
template_versions.suggested_fields and example_data_schema are JSONB today, but comments explicitly forbid example rows and uploaded values.
Any new registry JSONB would need stronger constraints than comments plus TypeScript validation.
Future AI schema interpretation
Current minimizer includes sample values and semantic notes, so reusing it would violate the proposed “no sample values/full prompts” constraint.
Fuzzy/geocoding artifacts
Current LLM/viz policy forbids geocoding and remote map/boundary assumptions unless local verified geometry exists.
Future fuzzy/geocode candidate pairs must remain session-only.
Recommended first implementation slice
Smallest safe slice: deterministic Decision Repair Layer, no persistence, no new API

Implement:

New type
types/repairAction.ts
Fields:
issueType
severity
whyItMatters
easiestFix
alternatives
appCanHelpWith
humanMustReview
estimatedEffort
safeAutomationLevel
New deterministic builder
lib/repairActions.ts
Inputs:
EvidenceCoverageSummary
DecisionReadinessResult
QualityCheckResult[]
First supported issue types only:
missing_evidence
ambiguous_mapping
UI integration
Add repair-action panel under Evidence Readiness / Validation.
Replace risky “Proceed” copy with:
“Continue review”
“Generate review dashboard”
“Prepare handoff packet”
Keep deterministic readiness label visible.
Local Next Best Action Coach
Extend deterministicCoachHints or add deterministicNextBestActions.
Input: repair actions + readiness state.
Output: one to three next checks.
No /api/coach expansion in this slice.
Tests first
Unit tests for missing evidence.
Unit tests for ambiguous mapping.
Copy-safety tests.
Demo no-regression tests.

This slice gives product value without changing persistence, provider calls, schema, RLS, admin reporting, or public demo behavior.

Recommended cuts

Cut or delay from the next staging slice:

Persisted form registry tables
Delay form_registries, form_registry_versions, reusable_mappings.
Block until explicit approval, schema/RLS, adapter allowlist, and privacy tests.
Reusable user mappings
Delay persisted mappings.
Keep any mapping review state session-only first.
AI schema interpretation
Delay until a schema-only minimizer exists that excludes sample values, semantic notes, labels from filled forms, prompt bodies, and model-response storage.
KoBo/ODK/Google Forms
Delay all connector work.
No credentials, tokens, sync, response rows, background jobs, or connector metadata persistence in this pass.
PDF/OCR
Delay.
No PDFs, images, OCR text, snippets, paragraphs, or filled values.
Geocoding
Delay.
No addresses, place names, coordinates, candidate pairs, or geocoded rows.
Fuzzy matching
Keep session-only if introduced later.
No persisted candidate pairs, auto-merge, dedupe, recoding, row deletion, or prepared-data mutation.
Admin expansion
Delay registry/admin reporting.
Current admin dashboard is aggregate metadata only and explicitly excludes rows, prompts, files, reports, and screenshots.
Acceptance criteria before staging

Block staging enablement unless all are true:

No persistence expansion without approval
New form registry/mapping tables have explicit user approval.
Product contract and decisions are updated before code merge.
Dedicated persistence DTO
Save payload cannot be constructed from Dataset, DatasetProfile, inputHints, WorkflowContext, handoff packets, or project kits.
DTO allows only reviewed form family, schema version, safe field identifiers, evidence need IDs, mapping status, confidence bucket, reviewer status, and timestamps.
No arbitrary JSONB
Registry tables use explicit columns or tightly constrained JSON generated only from allowlisted fields.
JSONB cannot accept unknown keys.
Strong sanitizer
Reject keys or values matching:
row
sample
value
prompt
response
ocr
geo
candidate
coordinate
address
place
file
screenshot
secret
token
Reject arrays/objects unless explicitly modeled.
Route security
Any new API route uses readJsonRequest.
Requires auth.
Returns Cache-Control: no-store.
Enforces request byte limits.
Rejects unknown keys.
Does not call AI unless explicitly designed and separately approved.
SQL/RLS
New tables have RLS enabled.
Owner policies use auth.uid().
Service-role writes remain server-only.
Authenticated browser writes are blocked unless RLS tests exist.
Admin views remain aggregate-only.
Demo isolation
/demo remains public, deterministic, sample-only, no upload controls, no AI calls, no registry save, no coach API call.
Add tests for this.
Repair-action correctness
Missing evidence and ambiguous mapping produce complete structured repair actions.
Deterministic readiness remains authoritative.
No action implies operational approval.
Next Best Action Coach
Deterministic only for first slice.
Consumes sanitized repair actions and readiness.
Returns one to three specific next review steps.
Separates app automation from human review.
Verification gates
npm run lint
npm run test
npm run build
git diff --check

These align with the roadmap’s existing acceptance gate for form-aware intake and product-standout work.

Open questions
Are field names always safe enough to persist?
In disaster data, a field name can itself be sensitive, for example security_incident_notes, clinic_access_token, or named-site operational fields. I would not assume all source field names are safe.
Is the registry user-private, reviewed-shared, or tenant-wide?
This determines RLS, visibility, review workflow, and whether admin can see field names.
Can schema labels be persisted?
XLSForm labels may contain operational notes or sensitive instructions. First slice should persist field names/types/evidence needs only, not labels, unless reviewed.
What is the lifecycle of reusable mappings?
Mapping scope must be explicit: user, form family, schema version, decision template, organization, or global reviewed mapping.
Should repair actions appear before the prepared dataset stage?
The safest product experience is to show missing/ambiguous evidence as early as profile/readiness, not only after dashboard generation.
Should exports continue to include prepared rows as browser downloads?
Current contract forbids persistence, not user-initiated local export. If server-side export storage is ever proposed, it should be treated as a separate high-risk approval.
Reviewer confidence

Medium-high on architecture, privacy boundaries, API patterns, form intake, readiness logic, coach constraints, and persistence conflicts.

Medium on complete test coverage because the connector did not provide recursive test enumeration and code search returned no useful in-repo results. I inspected the directly addressable form-intake test and marked the broader test glob as an evidence gap rather than guessing.