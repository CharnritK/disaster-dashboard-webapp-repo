# ChatGPT Desktop GPT-5.5 Pro Challenger Result

Date: 2026-06-28

Source: ChatGPT Desktop conversation titled `Red-Team Implementation Review`.

Scope: static challenger review of the supplied implementation plan. No repo
connector, account page, production system, connector setup, file upload,
dashboard, screenshot, raw uploaded data, or external context was used.

Status: completed.

## Top Risks

1. `metadata-only` is not automatically safe. Field names, form titles, source
   notes, caveats, owners, visibility, sync counts, and confidence notes can
   still disclose sensitive operational context.
2. Free-text metadata fields are covert raw-data channels. Highest-risk fields
   include source notes, caveats, `whyItMatters`, `easiestFix`, AI event errors,
   OCR notes, and geocoding notes.
3. AI schema interpretation remains under-specified. Schema labels, choice
   names, field names, and notes can carry row-like values or prompt-injection
   text.
4. Fuzzy matching, geocoding, and OCR naturally produce row-level artifacts.
   Candidate pairs, place names, coordinates, extracted text, OCR snippets, and
   confidence explanations must remain session-only.
5. SQL/RLS, route validators, adapter allowlists, sanitizers, logging controls,
   and tests must land together before any protected UI write path.
6. Coach language can overclaim authority. `Next Best Action`, `proceed`, and
   `repair` language must be framed as advisory and human-reviewed.
7. `/demo` needs explicit import/API-call guards, not only browser smoke tests.

## Required Mitigations

- Replace broad free-text metadata with constrained enums, bounded strings, and
  structured caveat codes wherever possible.
- Add a shared metadata/privacy boundary library with recursive allowlist
  validation and forbidden payload classification.
- Reject or sanitize secret-like, row-like, prompt-like, OCR-like,
  geocoding-like, file-like, coordinate-like, address-like, email-like, and
  phone-like values.
- Do not allow arbitrary JSONB metadata blobs.
- Keep repair actions and coach output behind an output sanitizer before UI
  render, API return, persistence, or logging.
- Limit AI event metadata to safe route/task identifiers, prompt version IDs,
  provider alias, status, fallback reason enum, quota event ID, timestamps, and
  coarse schema stats.
- Treat connector provider errors, OCR text, geocoding details, and fuzzy
  candidate details as unsafe unless explicitly reduced to approved metadata.

## Missing Tests

- Recursive unsafe payload rejection across nested metadata payloads.
- Positive and negative safe-metadata corpus tests.
- SQL/RLS cross-user insert/select/update/delete tests.
- Adapter allowlist tests proving adapters cannot write arbitrary columns,
  JSONB blobs, raw rows, connector rows, prompt text, AI responses, OCR text,
  geocoding results, or fuzzy candidates.
- Route validator tests for auth, unsafe payloads, multipart/file rejection,
  request size limits, unsafe nested fields, and unsafe error echo.
- AI outbound-payload tests proving no raw rows, samples, notes, caveats, full
  prompts, row-like schemas, or persisted provider responses.
- AI fallback tests for unauthenticated, disabled, missing key, unsupported
  provider, quota exceeded, timeout, invalid output, and provider error cases.
- Quota governance tests proving reservation happens immediately before the
  provider call and not during failed validation.
- Logging and telemetry tests proving request bodies, validation failures,
  prompts, provider responses, OCR/geocoding details, and row values do not
  reach logs, traces, or client events.
- Repair action tests proving every issue has concrete next steps and no
  row-like values.
- Coach tests proving it ranks blockers first, returns one to three actions,
  consumes sanitized repair actions only, and never overrides deterministic
  readiness.
- Fuzzy, geocoding, OCR/PDF, `/demo`, browser storage, and build-gate tests.

## Contradictions To Resolve

- `metadata-only` vs free-text fields: metadata-shaped fields can still contain
  raw data.
- `live sync` vs no background sync jobs: use `connector metadata status
  surface` unless background sync is separately approved.
- auth/quota-gated AI vs unauthenticated fallback: unauthenticated fallback is
  acceptable only if deterministic, non-AI, non-persistent, rate-limited, and
  not presented as AI execution.
- PDF/OCR metadata vs no OCR text: only reviewed template metadata should
  persist.
- fuzzy review candidates vs metadata-only persistence: candidate pairs and
  similarity explanations are row-derived and must not persist.
- deterministic readiness vs coach `proceed` mode: the coach can rank review
  steps but must not mark readiness, override blockers, or imply operational
  approval.
- SQL/RLS drafts vs safe staging writes: any write path requires enforced and
  tested RLS.
- choice list name vs schema metadata: distinguish list name, option count, and
  option labels. Do not persist option labels unless separately approved.

## Recommended Cuts

- Cut connector/OCR/geocoding/fuzzy persistence from the first slice.
- Cut or heavily constrain source notes and caveats.
- Cut AI wording improvements initially.
- Cut `live sync` language; use `connector metadata review` or `connector
  metadata status`.
- Cut persistent fuzzy review history.
- Cut `proceed` as a mode label unless constrained to `continue review`.
- Cut choice option persistence unless separately approved.
- Cut arbitrary JSONB metadata blobs.

## Recommended First Implementation Slice

Ship Phase 15A / 16A: Metadata Boundary + Minimal Repair Actions.

Include:

- Shared privacy boundary library.
- Recursive allowlist validation.
- Forbidden payload classifier.
- Secret-like, row-like, prompt-like, OCR-like, geocoding-like, and file-like
  detection.
- Output sanitizer for repair actions and coach responses.
- Only these first tables: `form_registries`, `form_registry_versions`,
  `reusable_mappings`.
- No first-slice tables for `connector_metadata`, `geocoding_metadata`,
  `ocr_pdf_metadata`, AI event metadata expansion, or fuzzy candidate
  persistence.
- Final SQL/RLS and adapter methods, not drafts.
- Protected API routes with auth, strict schema validation, unsafe payload
  rejection, no files/multipart, and no unsafe error echo.
- Repair actions only for missing evidence and ambiguous mapping.
- Deterministic coach that consumes sanitized repair actions only, returns one
  to three next review steps, cannot override deterministic readiness, and
  separates `appCanHelpWith` from `humanMustReview`.
- Protected UI behind staging feature flag only.
- No `/demo` changes.

Acceptance criterion: forbidden data classes must not be persisted, returned by
API routes, logged, sent to AI providers, placed in browser storage, exported,
shown in `/demo`, or embedded in repair/coach text.

Reviewer confidence: high on plan-level privacy and sequencing risks; medium on
implementation-level confidence because no code, schema, route handlers,
logging configuration, RLS policies, or UI components were inspected.
