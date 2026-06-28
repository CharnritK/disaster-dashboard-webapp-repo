# ChatGPT Desktop GPT-5.5 Pro Red-Team Prompt

Use this prompt in ChatGPT Desktop with GPT-5.5 Pro/Pro reasoning mode.

No repo connector, file upload, account page, billing page, quota page,
production system, secret, `.env`, raw uploaded data, prepared row, exported
report, screenshot, private message, or external dashboard access is needed.

```text
You are GPT-5.5 Pro acting as a challenger red-team reviewer.

Context:
This is a controlled-beta disaster response decision-support app. The current
approved implementation direction is local/staging-safe form-intake expansion,
a Decision Repair Layer, and a Next Best Action Coach. Production deployment,
production database migrations, production environment changes, provider/model
changes, open signup, anonymous AI, raw data persistence, and public demo upload
remain blocked.

Core app constraints:
- Uploaded disaster data remains session-only.
- Persistence must be metadata-only.
- The public /demo route remains deterministic and sample-only.
- AI is optional, advisory, auth/quota-gated, server-side, and
  deterministic-fallback-first.
- Deterministic readiness remains authoritative.
- Repair actions must help users act but must not imply operational authority.
- Fuzzy matching, OCR/PDF, geocoding, and live sync are review-only or
  metadata-only in this pass.

Approved design:
1. Metadata-Only Form Registry
   - Persist reviewed or user-owned metadata about form families and schema
     versions.
   - Allowed: family, title, status, visibility, owner, review state, field
     name, label, type, evidence role, required flag, HXL tag, choice list name,
     schema counts, caveats, confidence thresholds, source notes.
   - Forbidden: uploaded files, raw rows, prepared rows, OCR text, connector
     rows, full prompts, model responses, exported reports, secrets.

2. Reusable Mapping Registry
   - Persist reusable metadata mapping source fields to evidence needs.
   - Allowed: evidence need, source field names, optional form version
     reference, mapping basis, confidence, caveats, review status.
   - Forbidden: sample values or row-like values.

3. Decision Repair Layer
   - Every detected issue becomes a structured RepairAction:
     issueType, severity, whyItMatters, easiestFix, alternatives,
     appCanHelpWith, humanMustReview, estimatedEffort, safeAutomationLevel.
   - Issue types include missing evidence, ambiguous mapping, weak detection,
     connector sync issue, OCR confidence issue, geocoding uncertainty, fuzzy
     match conflict, AI fallback, quota/auth issue.
   - Flags must not dead-end. Every issue should offer at least one safe next
     step unless blocked by missing credentials or production approval.

4. Next Best Action Coach
   - Deterministic coach consumes workflow state and repair actions.
   - It ranks the next 1-3 actions.
   - Modes: triage, repair, explain, proceed, handoff.
   - Optional AI may improve wording/strategy only after auth, entitlement,
     quota, provider preflight, and minimized schema-only payload validation.

Expansion surfaces:
- AI schema interpretation: dedicated server route/task, schema-only payload,
  no raw rows/sample values/files/full schemas with row-like values/full prompts
  or persisted model responses.
- KoBo/ODK/Google Forms sync: connector metadata only; no tokens, credentials,
  synced records, raw responses, form files, or background sync jobs.
- PDF/OCR: metadata only; no PDFs, page images, OCR text, extracted rows,
  screenshots, or full document text.
- Geocoding: review-only metadata; no row-level coordinates, addresses, place
  names, or geocoded result rows.
- Fuzzy matching: review aid only; no auto-merge, deduplication, recoding, row
  deletion, or prepared-data mutation.

Planned implementation phases:
Phase 15 - Metadata Registry Foundation
- Add typed metadata contracts and SQL/RLS drafts for:
  form_registries, form_registry_versions, reusable_mappings,
  connector_metadata, geocoding_metadata, ocr_pdf_metadata.
- Update adapter allowlist and tests.
- Validate row-like/sample/prompt/response/secret-like payload rejection.

Phase 16 - Decision Repair Layer
- Generate repair actions for missing evidence, ambiguous mapping, weak form
  detection, connector issue, OCR issue, geocoding issue, fuzzy conflict, and AI
  fallback.
- Each action must have easiestFix, whyItMatters, appCanHelpWith, and
  humanMustReview.

Phase 17 - Next Best Action Coach
- Rank blockers before review issues.
- Return at most 1-3 concrete actions.
- Separate what the app can help with from human review.
- Do not let the coach become generic or authoritative.

Phase 18 - AI Schema Interpretation
- Add new task type, prompt version, response schema, sanitizer, and route.
- Follow strong API governance:
  parse/validate -> deterministic fallback -> auth -> entitlement -> provider
  preflight -> reserve quota immediately before provider call -> safe AI event
  metadata -> sanitized response.
- Update SQL route check for new AI event route.

Phase 19 - Connector Metadata And Live Sync Surface
- Persist only connector metadata and sync status/counts/caveats.
- Keep imported response rows session-only.

Phase 20 - PDF/OCR And Geocoding Metadata
- Persist only OCR/geocoding metadata.
- Produce repair actions for confidence/coverage issues.

Phase 21 - Fuzzy Matching Review Candidates
- Deterministic candidate scoring.
- Suggest only, never mutate rows.

Phase 22 - Protected UI Integration
- Extend protected /app/data form review UI.
- Keep /demo unchanged.
- Show registry match, mapping suggestions, repair cards, and coach next
  actions.

Phase 23 - Staging Validation
- npm run lint
- npm run test
- npm run build
- git diff --check
- browser smoke for /demo and unauthenticated /app/data redirect
- authenticated staging smoke when magic-link session is available
- safe metadata-only write checks

Planned unit-test coverage:
- Form registry validators accept schema metadata and reject row-like/sample
  values.
- Schema/RLS allow only approved metadata tables and no raw-data tables.
- Adapter persists/list registry and mapping metadata only.
- Privacy guard rejects uploaded rows, connector rows, geocoded rows, OCR text,
  prompt bodies, model responses, screenshots, PDFs, and files.
- Repair actions cover missing evidence, ambiguous mapping, weak detection,
  connector issue, OCR issue, geocoding issue, fuzzy conflict, and AI fallback.
- Fuzzy matching suggests candidates without mutating source data.
- Coach ranks blockers/review actions and returns concrete next steps.
- Registry/mapping API routes require auth and reject unsafe payloads.
- AI schema route falls back safely when unauthenticated, AI disabled, missing
  key, unsupported provider, over quota, timeout, invalid output.
- Public /demo remains deterministic and sample-only.

Agent plan:
- Agent A: registry contract and validators.
- Agent B: SQL/RLS/adapter metadata boundary.
- Agent C: repair actions and fuzzy matching.
- Agent D: coach and protected UI.
- Agent E: AI schema interpretation route.
- Agent F: read-only privacy/security challenger.

Review objective:
Find gaps, contradictions, unsafe assumptions, missing tests, unclear approval
boundaries, privacy leaks, product overclaims, or sequencing mistakes.

Attack these questions:
1. Does any proposed table, adapter method, route, UI surface, or test plan risk
   storing raw rows, files, OCR text, geocoded results, connector records,
   prompts, model responses, or sensitive operational data?
2. Does the AI schema interpretation plan correctly separate schema metadata
   from row/sample values?
3. Are repair actions useful enough, or do they still flag issues without
   guiding the lowest-effort fix?
4. Does the coach become concrete and contextual, or does it remain generic?
5. Can fuzzy matching, geocoding, or OCR silently mutate data or overclaim
   confidence?
6. Are SQL/RLS, adapter allowlists, route validators, and tests updated in the
   same phase?
7. Is /demo protected from scope creep?
8. Are staging validation and production approval boundaries clear?
9. Are the proposed unit tests behavior-focused, or are they brittle string
   checks?
10. What is the smallest implementation slice that should ship first?

Output format:
Status: completed / partial / blocked
Top risks:
Findings:
Missing tests:
Contradictions:
Approval gates:
Recommended cuts:
Recommended first implementation slice:
Reviewer confidence:

Do not ask for secrets, account pages, billing/quota inspection, production
dashboards, raw uploaded data, private messages, connector setup, file upload,
or unshared external context.
```
