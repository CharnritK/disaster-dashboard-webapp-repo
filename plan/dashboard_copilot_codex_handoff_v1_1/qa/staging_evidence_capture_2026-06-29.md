# Staging Evidence Capture Packet

Date prepared: 2026-06-29

Status: `PENDING_APPROVED_STAGING_SESSION`

Verdict taxonomy for this artifact:

- `implemented-local`
- `verified-local`
- `verified-staging-authenticated`
- `credential-dependent-not-verified`
- `production-not-performed`
- `user-decision-required`

## Artifact Control

| Field | Value |
|---|---|
| Source plan | `docs/superpowers/plans/2026-06-29-product-review-roadmap-delivery.md` |
| Local baseline evidence | `plan/dashboard_copilot_codex_handoff_v1_1/qa/product_review_roadmap_delivery_2026-06-29.md` |
| Tester runbook | `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_test_runbook_2026-06-29.md` |
| Safe payload fixtures | `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_test_payloads_2026-06-29.json` |
| Branch | `codex/product-review-roadmap-delivery` |
| Commit SHA | `Pending` |
| Staging preview URL or alias | `Pending` |
| Deployment id | `Pending` |
| Evidence actor role | `Pending` |
| Reviewer role | `Pending` |
| Session date/time/timezone | `Pending` |
| Overall verdict | `credential-dependent-not-verified` |

Purpose: capture the remaining Gate 2 staging evidence for
`docs/superpowers/plans/2026-06-29-product-review-roadmap-delivery.md` without
recording secrets, magic links, personal account details, uploaded rows,
prepared rows, prompts, model responses, reports, exports, or raw database
rows.

## Preconditions

- Follow the tester runbook before filling this packet:
  `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_test_runbook_2026-06-29.md`.
- Use only the approved beta/admin staging identity.
- Use the latest staging preview URL for this branch.
- Do not paste the magic link, OTP token, cookies, local storage values,
  bearer tokens, Supabase URL/key values, or private account identifiers into
  this file.
- Use synthetic or explicitly safe metadata-only inputs.
- If manual payloads are needed, use only the safe fixture shapes in
  `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_test_payloads_2026-06-29.json`.
- Do not upload real disaster response data for this evidence run.
- Do not mutate production.

## Evidence Summary

| Gate item | Status | Evidence note |
|---|---|---|
| Latest staging magic link clicked for approved beta/admin email | Pending | Record only success/failure and timestamp. Do not paste link/token/email unless already approved for docs. |
| Authenticated `/app/usage` renders | Pending | Record route status and whether user-specific usage metadata appears without row/prompt/report content. |
| Authenticated `/app/templates` renders | Pending | Record route status and metadata-only template list behavior. |
| Authenticated `/app/feedback` renders | Pending | Record route status and safe feedback form behavior. |
| `/admin` renders for approved admin | Pending | Record aggregate cards/tables shown. Do not paste personal identifiers or raw DB rows. |
| `/admin` denies non-admin, if safe test identity exists | Pending | Record deny state only. Skip if no safe non-admin staging identity exists. |
| Safe metadata-only feedback item submitted | Pending | Record allowed tags/count/status only; do not include operational free text. |
| Safe metadata-only template created or updated | Pending | Record template id prefix or count only if non-sensitive; no example rows. |
| Admin aggregate reporting shows metadata only | Pending | Record aggregate metric categories only. |
| Unauthenticated mutation routes return `401` | Pending | Record route/status pairs. |
| Staging DB/RLS row checks completed | Pending | Record pass/fail summary only; no raw rows or secret connection details. |

## Local Mock Evidence Already Completed

These checks are `verified-local`. They reduce staging risk but do not replace
the approved authenticated staging session.

| Gate item | Local status | Evidence |
|---|---|---|
| Login unavailable branch | verified-local | `tests/dom/staging-secondary-pages.dom.test.tsx` renders `/login` with missing public auth config and verifies disabled sign-in controls plus preview-safe copy. |
| Authenticated app shell guard | verified-local | `tests/dom/staging-secondary-pages.dom.test.tsx` verifies unauthenticated layout redirect and authenticated workspace chrome render with mocked identity. |
| Authenticated secondary page rendering | verified-local | `tests/dom/staging-secondary-pages.dom.test.tsx` renders `/app/usage`, `/app/templates`, `/app/templates/new`, and `/app/feedback` with mocked safe API responses. |
| Admin page branch rendering | verified-local | `tests/dom/staging-secondary-pages.dom.test.tsx` covers unauthenticated redirect, non-admin redirect, and admin aggregate render with mocked identity and metadata. |
| Unsafe readiness acknowledgement | verified-local | `tests/dom/workflow-a11y.dom.test.tsx` verifies dashboard generation remains disabled until all unsafe-readiness blockers are acknowledged. |
| Template mutation denial | verified-local | `tests/templates-api.test.ts` covers unauthenticated `GET`, `POST`, and `PATCH` denial. |
| Template list privacy | verified-local | `tests/templates-api.test.ts` verifies authenticated users see their private drafts and reviewed templates, not another user's private draft. |
| Template schema privacy | verified-local | `lib/templates/index.ts` and `tests/templates-api.test.ts` enforce type-label-only `exampleDataSchema` values and reject value-shaped examples. |
| Admin Supabase aggregate query shape | verified-local | `tests/admin-metrics.test.ts` verifies admin aggregation selects `fallback_reason`, `tags`, and `id` only, with empty fallback on read failure. |

## Evidence Ledger

Use this table for every check performed during the approved session.

| Evidence ID | Requirement | State | Actor/identity class | Environment | Route/API/DB target | Action | Expected | Observed | Privacy proof | Redactions | Evidence reference | Timestamp | Result | Follow-up |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| STG-001 | Magic-link session | credential-dependent-not-verified | approved beta/admin, redacted | staging preview | auth | Click latest magic link | Authenticated session established | Pending | Link/token not captured | Pending | Pending | Pending | Pending |  |
| STG-002 | Usage route | credential-dependent-not-verified | approved beta/admin, redacted | staging preview | `/app/usage` | Open route | Usage meter renders | Pending | No row/prompt/report content | Pending | Pending | Pending | Pending |  |
| STG-003 | Templates route | credential-dependent-not-verified | approved beta/admin, redacted | staging preview | `/app/templates` | Open route | Template surface renders | Pending | Metadata-only view | Pending | Pending | Pending | Pending |  |
| STG-004 | Feedback route | credential-dependent-not-verified | approved beta/admin, redacted | staging preview | `/app/feedback` | Open route | Feedback surface renders | Pending | Metadata-only form | Pending | Pending | Pending | Pending |  |
| STG-005 | Admin aggregate route | credential-dependent-not-verified | approved admin, redacted | staging preview | `/admin` | Open route | Aggregate dashboard renders | Pending | No raw rows/prompts/reports/exports | Pending | Pending | Pending | Pending |  |
| STG-006 | Admin deny-by-default | credential-dependent-not-verified | non-admin if available, redacted | staging preview | `/admin` | Open route | Denied or redirected | Pending | No account details recorded | Pending | Pending | Pending | Pending | Mark `not-performed-no-safe-identity` if needed. |
| STG-007 | Feedback metadata write | credential-dependent-not-verified | approved beta/admin, redacted | staging preview | `/api/feedback` or UI | Submit safe fixture | Metadata write succeeds | Pending | Payload shape only, no operational free text | Pending | Pending | Pending | Pending |  |
| STG-008 | Template metadata write | credential-dependent-not-verified | approved beta/admin, redacted | staging preview | `/api/templates` or UI | Create/update safe fixture | Metadata write succeeds | Pending | No example rows or raw data | Pending | Pending | Pending | Pending |  |
| STG-009 | Unauthenticated mutation denial | credential-dependent-not-verified | anonymous | staging preview | `POST /api/feedback`, `POST /api/templates`, `PATCH /api/templates/{safe-id}` | Send safe unauthenticated probes | `401` | Pending | No sensitive payload | Pending | Pending | Pending | Pending |  |
| STG-010 | Optional unauthenticated reads | credential-dependent-not-verified | anonymous | staging preview | `GET /api/usage`, `GET /api/templates` | Send safe probes | `401` where protected | Pending | No sensitive payload | Pending | Pending | Pending | Pending |  |
| STG-011 | DB/RLS metadata boundary | credential-dependent-not-verified | approved DB reviewer, redacted | staging DB | approved metadata tables | Review counts/RLS/grants only | Metadata-only, RLS enforced | Pending | No row dumps or secret connection data | Pending | Pending | Pending | Pending | Skip if no safe DB credential. |
| STG-012 | Runtime/log privacy | credential-dependent-not-verified | approved reviewer, redacted | staging preview logs | preview logs | Review redacted logs | No secrets/rows/prompts/responses/reports/exports | Pending | Findings only, no raw logs | Pending | Pending | Pending | Pending |  |

## Route Checks

Fill this table during the approved session.

| Route or API | Auth state | Expected | Actual | Pass? | Notes |
|---|---|---|---|---|---|
| `/app/usage` | authenticated approved beta/admin | renders usage meter | Pending | Pending |  |
| `/app/templates` | authenticated approved beta/admin | renders template surface | Pending | Pending |  |
| `/app/feedback` | authenticated approved beta/admin | renders feedback surface | Pending | Pending |  |
| `/admin` | authenticated approved admin | renders aggregate metadata dashboard | Pending | Pending |  |
| `/admin` | authenticated non-admin, if available | denied | Pending | Pending | Skip if no safe identity. |
| `POST /api/feedback` | unauthenticated | `401` | Pending | Pending | No payload details. |
| `POST /api/templates` | unauthenticated | `401` | Pending | Pending | No payload details. |
| `PATCH /api/templates/[id]` | unauthenticated | `401` | Pending | Pending | Use non-sensitive placeholder id or skip if unsafe. `DELETE` is not part of the current template route contract. |

## Safe Unauthenticated Probe Commands

Run these only against the approved staging preview URL. Do not run them
against production, and do not include credentials, cookies, bearer tokens, or
magic-link query parameters.

Use a shell variable for the staging origin:

```powershell
$staging = "https://<approved-preview-host>"
```

Expected result for each route is `401`.

```powershell
Invoke-WebRequest `
  -Uri "$staging/api/usage" `
  -Method GET `
  -UseBasicParsing

Invoke-WebRequest `
  -Uri "$staging/api/templates" `
  -Method GET `
  -UseBasicParsing

Invoke-WebRequest `
  -Uri "$staging/api/feedback" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"thumb":"up","tags":["useful"]}' `
  -UseBasicParsing

Invoke-WebRequest `
  -Uri "$staging/api/templates" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"title":"Unauth probe","decisionQuestion":"Test only","intendedAction":"Test only","decisionMaker":"Test only","geographyTimeframe":"Test only","requiredEvidence":["Test"],"suggestedFields":[{"field_name":"admin_code","role":"evidence"}],"exampleDataSchema":{"admin_code":"string"}}' `
  -UseBasicParsing

Invoke-WebRequest `
  -Uri "$staging/api/templates/unauth-probe" `
  -Method PATCH `
  -ContentType "application/json" `
  -Body '{"title":"Unauth probe"}' `
  -UseBasicParsing
```

Record only route, method, status code, timestamp, and pass/fail in this file.
Do not paste response headers, cookies, account identifiers, or raw platform
logs.

## Safe Metadata Write Checks

Feedback:

- Submitted? `Pending`
- Tags used: `Pending`
- Comment used: `None` or `safe non-operational test comment`
- Persisted raw rows/files/prompts/responses/reports/exports? `Pending`

Template:

- Created or updated? `Pending`
- Template scope: `private draft metadata only`
- Example rows included? `No`
- Persisted raw rows/files/prompts/responses/reports/exports? `Pending`

Admin aggregate:

- Usage event counts visible? `Pending`
- Fallback reason aggregate visible? `Pending`
- Feedback count/tag aggregate visible? `Pending`
- Template count aggregate visible? `Pending`
- Raw row, prompt, report, export, or row-like metadata visible? `Pending`

## DB/RLS Summary

Record only summary evidence.

| Check | Status | Notes |
|---|---|---|
| Feedback rows scoped to owner/admin metadata policy | Pending | No raw row dumps. |
| Template rows scoped to owner/admin metadata policy | Pending | No raw row dumps. |
| Admin aggregate query excludes uploaded/prepared data | Pending | No raw row dumps. |
| Service-role/server-only boundary preserved | Pending | Do not print credentials. |

## Runtime And Log Privacy

| Check | Status | Notes |
|---|---|---|
| Preview logs reviewed for secrets/tokens | Pending | Record absence/presence only. Do not paste logs containing secrets. |
| Preview logs reviewed for raw rows/prepared rows/full datasets | Pending | Record absence/presence only. |
| Preview logs reviewed for prompts/model responses/reports/exports | Pending | Record absence/presence only. |
| Screenshots redacted before attachment | Pending | Do not attach identity/session/token-bearing screenshots. |

## Production Not Performed

Confirm during the evidence run:

| Boundary | Status | Notes |
|---|---|---|
| Production deployment not run | Pending |  |
| Production environment variables not changed | Pending |  |
| Production Supabase config/redirects not changed | Pending |  |
| Production migrations not run | Pending |  |
| Admin/beta allowlists not changed | Pending |  |
| Provider/model/quota not changed | Pending |  |
| Retention automation not added or run | Pending |  |
| Persistence boundary not expanded | Pending |  |

## Open Gates After Staging Evidence

- Upload viability decision: `docs/decisions/upload-viability.md`.
- Production readiness approval packet.
- Additional beta/admin allowlist entries, if needed.
- Retention automation review.
- Analytics/provider event sink approval.
- DB/RLS direct checks if no safe staging DB credential is available.

## Final Staging Verdict

Verdict: `PENDING`

Use one of:

- `STAGING_GATE_PASSED_METADATA_ONLY`
- `STAGING_GATE_PARTIAL_RETRY_REQUIRED`
- `STAGING_GATE_BLOCKED_CREDENTIAL_REQUIRED`
- `STAGING_GATE_FAILED_PRIVACY_OR_AUTH_BOUNDARY`

Notes:

- Pending.
