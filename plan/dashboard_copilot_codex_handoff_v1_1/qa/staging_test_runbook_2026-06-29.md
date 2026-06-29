# Staging Test Runbook

Date prepared: 2026-06-29

Status: `READY_FOR_APPROVED_STAGING_SESSION`

Primary evidence packet:
`plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_evidence_capture_2026-06-29.md`

Safe payload fixtures:
`plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_test_payloads_2026-06-29.json`

## Purpose

Use this runbook to complete the remaining controlled-beta staging evidence
without weakening the app's privacy or approval boundaries.

This runbook is for staging proof only. It does not approve production
deployment, production environment changes, Supabase project configuration,
database migrations, admin allowlist changes, provider/model/quota changes,
retention automation, or persistence expansion.

## Real Problem

Local tests already prove the current repo behavior. The remaining release risk
is external-state proof:

- the approved staging preview accepts the approved magic-link session;
- authenticated staging pages render;
- metadata-only feedback and template writes work;
- admin reporting stays aggregate-only;
- unauthenticated reads/mutations deny access;
- Supabase metadata and RLS behavior match the contract;
- runtime logs do not expose secrets or forbidden data.

## Materials

Prepare these before testing:

| Material | Required? | Notes |
|---|---:|---|
| Approved staging preview URL | Yes | Use the branch preview or alias approved for this run. |
| Approved beta/admin email session | Yes | Click the latest magic link yourself. Do not paste the link or token anywhere. |
| Safe non-admin test identity | Optional | Use only if already available and safe. Do not create/modify allowlists for this run. |
| Evidence packet | Yes | Fill `staging_evidence_capture_2026-06-29.md`. |
| Payload fixture file | Yes | Copy only the safe payload shapes if manual API testing is needed. |
| Redaction tool | Recommended | Redact email, account menus, ids if sensitive, and auth-bearing URLs. |

## Hard Boundaries

Stop immediately if a step requires any of the following:

- production deployment;
- production environment variable mutation;
- production Supabase settings, redirect URL, email auth, or migration changes;
- admin/beta allowlist policy or value changes;
- provider/model/quota changes;
- billing, quota, payment, subscription, or account-plan page inspection;
- pasting magic links, OTP tokens, cookies, local storage, bearer tokens, API
  keys, service-role keys, database URLs, or private account identifiers;
- uploading real disaster response data;
- recording raw rows, prepared rows, full datasets, prompts, model responses,
  reports, exports, raw DB rows, or raw platform logs.

## Recommended Sequence

Run the tests in this order. It minimizes account exposure and separates
authenticated UI checks from anonymous API probes.

1. Fill artifact control fields.
2. Establish the approved staging auth session.
3. Verify authenticated route rendering.
4. Verify safe metadata writes.
5. Verify admin aggregate-only behavior.
6. Run unauthenticated route probes from a session with no cookies.
7. Review Supabase metadata/RLS summaries only.
8. Review Vercel/runtime logs for absence of forbidden data.
9. Fill final verdict and open gates.

## Step 1 - Artifact Control

Open `staging_evidence_capture_2026-06-29.md` and fill:

- staging preview URL or alias;
- deployment id, if visible without account-sensitive detail;
- evidence actor role;
- reviewer role;
- session date/time/timezone;
- branch and commit SHA if available.

Do not record account emails unless already approved for docs. Prefer
`approved beta/admin, redacted`.

Expected result: the evidence packet identifies the environment and actor class
without leaking credentials or personal account data.

## Step 2 - Approved Magic-Link Session

In the browser session you intend to use for authenticated checks:

1. Open the approved staging preview URL.
2. Navigate to `/login`.
3. Request or use the latest approved magic link.
4. Click the magic link yourself.
5. Confirm the session lands in the app or can open `/app/usage`.

Record in `STG-001`:

- success/failure;
- timestamp;
- actor class: `approved beta/admin, redacted`;
- privacy proof: `magic link and token not captured`.

Do not paste the magic-link URL, token, email inbox content, cookies, local
storage values, or auth callback URL.

Expected result: an authenticated staging session exists.

## Step 3 - Authenticated Route Rendering

In the authenticated session, open:

- `/app/usage`
- `/app/templates`
- `/app/feedback`
- `/admin`

Record in `STG-002` through `STG-005` and in the route-check table:

- route;
- actual status or visible result;
- whether the page rendered;
- whether any forbidden data appeared.

Expected results:

| Route | Expected |
|---|---|
| `/app/usage` | Usage meter or safe usage fallback renders; no row, prompt, report, export, or raw model content. |
| `/app/templates` | Template surface renders metadata-only list/drafts. |
| `/app/feedback` | Feedback surface renders safe metadata-only form. |
| `/admin` | Approved admin sees aggregate metadata only. |

Safe screenshots:

- route heading;
- aggregate counts;
- metadata-only cards;
- redacted browser URL.

Unsafe screenshots:

- account menus with email;
- magic-link or callback URL;
- cookies/local storage;
- raw database rows;
- logs containing tokens or ids;
- uploaded data, prompts, model responses, reports, or exports.

## Step 4 - Optional Non-Admin Admin Denial

Run only if a safe non-admin staging identity already exists.

1. Sign out or use a separate browser profile.
2. Sign in as the non-admin identity.
3. Open `/admin`.

Record in `STG-006`:

- `denied` or redirect result;
- timestamp;
- `not-performed-no-safe-identity` if no safe identity exists.

Do not change admin allowlists or create a new identity just for this run.

Expected result: non-admin access is denied or redirected.

## Step 5 - Safe Feedback Metadata Write

Use the UI when practical. If manual API testing is needed, use the
`authenticatedFeedback` fixture from `staging_test_payloads_2026-06-29.json`:

```json
{
  "thumb": "up",
  "tags": ["useful"],
  "comment": "Safe staging smoke test only. No operational data."
}
```

Record in `STG-007`:

- submitted via UI or API;
- status;
- tags used;
- comment used: `safe non-operational test comment`;
- no raw rows/files/prompts/responses/reports/exports persisted.

Expected result: feedback save succeeds and returns only metadata such as
`ok` and an id. If the id is recorded, use a short non-sensitive prefix only.

## Step 6 - Safe Template Metadata Write

Use the UI when practical. If manual API testing is needed, use the
`authenticatedTemplateCreate` fixture from
`staging_test_payloads_2026-06-29.json`.

Key safety rule: `exampleDataSchema` values must be schema type labels only,
such as `string`, `number`, and `category`. Do not use district codes, place
names, row values, sample values, or file-derived examples.

Record in `STG-008`:

- created or updated;
- status;
- scope: `private draft metadata only`;
- example rows included: `No`;
- no raw rows/files/prompts/responses/reports/exports persisted.

Expected result: template create returns a private draft and version metadata.
Patch should update title or description only.

## Step 7 - Unauthenticated Probe Checks

Run these from a shell or browser profile with no staging cookies. Do not send
credentials, bearer tokens, cookies, or magic-link query parameters.

Set the staging origin:

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

PowerShell may throw for non-2xx responses. That is acceptable if the captured
status is `401`.

Record in `STG-009`, `STG-010`, and the route-check table:

- method;
- route;
- status code;
- timestamp;
- pass/fail.

Do not paste response headers, cookies, platform request ids, or raw logs.

## Step 8 - Supabase Metadata And RLS Review

Use only approved staging Supabase access. Do not run migrations, modify
policies, update settings, or inspect billing/account/quota pages.

Review summary evidence only:

- feedback rows are scoped to owner/admin metadata policy;
- template rows are scoped to owner/admin metadata policy;
- admin aggregate query excludes uploaded/prepared data;
- privileged DB access remains server-only;
- no tables contain uploaded files, raw rows, prepared rows, full datasets,
  prompts, model responses, reports, or exports.

Record only pass/fail summaries in the DB/RLS table. Do not paste raw SQL
results, row dumps, connection details, credentials, service-role keys, or
policy text containing sensitive project identifiers.

Expected result: metadata-only tables and RLS behavior match the controlled
beta contract.

## Step 9 - Runtime And Log Privacy Review

Use only approved staging preview logs. Do not paste logs into the repo.

Check for absence/presence of:

- secrets, tokens, cookies, auth callback URLs;
- raw rows, prepared rows, full datasets;
- full prompts, full LLM request bodies, model responses;
- generated reports, exports, or row-like model output.

Record only summary findings:

- `No forbidden content observed`, or
- `Potential issue observed; details held outside repo for remediation`.

Expected result: logs contain no forbidden data. If a potential leak appears,
stop release progression and treat it as a privacy issue.

## Step 10 - Production Not Performed

Fill every row in the `Production Not Performed` table.

Expected value for each boundary is `Confirmed not performed` unless the user
explicitly approved and separately executed that work outside this run.

Default recommendation: keep every production boundary closed until staging
evidence is complete and reviewed.

## Final Verdict

Use this mapping in `Final Staging Verdict`:

| Situation | Verdict |
|---|---|
| All required authenticated, metadata, admin, unauth, DB/RLS, and log checks pass | `STAGING_GATE_PASSED_METADATA_ONLY` |
| Some checks pass but retryable staging setup/session issue remains | `STAGING_GATE_PARTIAL_RETRY_REQUIRED` |
| Testing cannot proceed because approved credentials/session/access are missing | `STAGING_GATE_BLOCKED_CREDENTIAL_REQUIRED` |
| Any auth, privacy, persistence, or admin boundary fails | `STAGING_GATE_FAILED_PRIVACY_OR_AUTH_BOUNDARY` |

If the verdict is not `STAGING_GATE_PASSED_METADATA_ONLY`, do not move to
production planning except to document the blocker.

## What To Send Back To Codex

Send a concise status with:

- staging URL or alias, redacted if needed;
- final verdict;
- route/status table results;
- whether feedback/template metadata writes succeeded;
- whether admin aggregate view remained metadata-only;
- whether DB/RLS and logs passed summary checks;
- any blockers.

Do not send magic links, tokens, cookies, auth callback URLs, raw logs, raw DB
rows, screenshots with account details, uploaded data, prompts, model
responses, reports, or exports.

## Recommendation

Run staging evidence first. Do not change upload limits, production settings,
Supabase configuration, admin allowlists, AI provider/model/quota, analytics
sinks, or retention automation until the staging packet has a clean verdict.
