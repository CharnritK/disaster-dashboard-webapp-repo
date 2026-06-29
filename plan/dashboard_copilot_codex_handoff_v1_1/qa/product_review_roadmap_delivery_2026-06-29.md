# Product Review Roadmap Delivery Evidence

Date: 2026-06-29

Verdict: `LOCAL_GATES_1_2_IMPLEMENTED_AND_VERIFIED_STAGING_PRODUCTION_PENDING`

This records the local evidence for
`docs/superpowers/plans/2026-06-29-product-review-roadmap-delivery.md`.
It does not claim authenticated staging, production, migration, provider,
quota, admin allowlist, or retention automation completion.

## Local Scope Completed

- Gate 1 public-demo share release:
  - `/demo` keeps the controlled-beta, synthetic-sample, session-only, and
    not-operational-action framing visible.
  - The public demo hides the inert AI toggle and keeps the sign-in CTA.
  - The public demo remains sample-only and upload-free.
  - Step 5 user-facing label is now `Validate`.
  - Login copy handles unavailable auth without raw provider/config language.
- Gate 2 controlled-beta local safety release:
  - Unsafe readiness blocks dashboard generation until all current blocker IDs
    are acknowledged.
  - Acknowledged blocker IDs are sanitized and included only as metadata in
    workflow export/handoff packets.
  - Non-ready PNG/PDF exports receive review-only watermark labels.
  - Completed workflow steps can be revisited while forward navigation remains
    gated.
  - P-code/COD-style admin codes improve geography/join hints without
    treating generic code fields as area labels.
  - Join trust summaries show matched, unmatched, blank, and duplicate key
    counts with bounded key samples only; no row objects are returned.
  - Join recommendations cannot be accepted unless every join pair has a
    displayed trust summary.
  - A jsdom DOM test project covers modal focus trap/restore, dashboard mobile
    tab keyboard behavior, polite status announcements, and axe checks for
    the demo and dashboard surfaces.
  - Local staging-facing mock coverage now renders `/app/usage`,
    `/app/templates`, `/app/templates/new`, `/app/feedback`, and `/admin`
    with safe mocked metadata.
  - Template APIs are locally covered for unauthenticated `GET`, `POST`, and
    `PATCH` denial, caller-scoped private drafts, and reviewed-template
    visibility.
  - Custom template `exampleDataSchema` now accepts schema type labels only
    and rejects value-shaped examples such as district codes.
  - Admin aggregate tests verify the Supabase query shape selects only
    metadata fields: `fallback_reason`, `tags`, and `id`.
  - Focus-visible contrast was strengthened against the existing light theme.
    No dark-mode theme exists in the current app; `app/styles.css` declares
    `color-scheme: light`.

## Dependency Expansion Note

Task 2.6 required a local dev-dependency expansion before proceeding. The user
asked Codex to complete the full plan, so this run treated that as approval for
local development-only test dependencies. No runtime dependency, production
provider, deployment, migration, environment, or account change was made.

Added dev dependencies:

- `jsdom`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `vitest-axe`

`npm install` reported one moderate audit issue. No audit fix was run because
that can widen dependency churn.

## Files Added

- `lib/demoMessaging.ts`
- `lib/auth/loginMessaging.ts`
- `lib/readinessGate.ts`
- `lib/joinSummary.ts`
- `tests/demo-framing.test.ts`
- `tests/login-messaging.test.ts`
- `tests/readiness-gate.test.ts`
- `tests/export-watermark.test.ts`
- `tests/location-fields.test.ts`
- `tests/workflow-navigation.test.ts`
- `tests/join-summary.test.ts`
- `tests/dom/setup.ts`
- `tests/dom/workflow-a11y.dom.test.tsx`
- `tests/dom/staging-secondary-pages.dom.test.tsx`

## Verification Run

- `npm run lint` passed.
- `npm run test` passed: 29 test files, 219 tests.
- `npm run build` passed.
- `git diff --check` passed with Windows line-ending warnings only.

Fresh continuation verification on the current worktree:

- `npm run lint` passed.
- `npm run test` passed: 30 test files, 232 tests.
- `npm run build` passed.

Additional local mock verification after staging-facing coverage was added:

- `npm run test -- --run tests/templates-api.test.ts tests/admin-metrics.test.ts tests/privacy-no-row-persistence.test.ts tests/dom/staging-secondary-pages.dom.test.tsx`
  passed: 4 test files, 22 tests.
- `npm run test -- --run tests/dom/workflow-a11y.dom.test.tsx tests/dom/staging-secondary-pages.dom.test.tsx`
  passed: 2 test files, 16 tests.
- `npm run lint` passed.
- `npm run test` passed: 30 test files, 232 tests.
- `npm run build` passed.

Build warning retained from existing runtime surface:

- `@supabase/supabase-js` uses `process.version` in an Edge Runtime import
  trace through `lib/supabase/middleware.ts`.

## Browser Smoke

Local server:

- URL: `http://127.0.0.1:3017/demo`
- Browser: installed local Chrome executable driven headlessly.
- Temporary dev server was stopped after verification.

Observed:

- no visible `input[type="file"]` on `/demo`;
- no visible `.llm-toggle` on `/demo`;
- controlled-beta copy visible;
- session-only copy visible;
- not-operational-action copy visible;
- Step 5 label visible as `Validate`;
- decision-map dialog focuses `Close` when opened;
- Tab and Shift+Tab remain trapped inside the dialog;
- Escape closes the dialog and restores focus to `View decision map`;
- default sample walkthrough reached the Dashboard step;
- dashboard mobile tabs use distinct labels: `Overview`, `Insights`,
  `Overview charts`, `Location`, `Key Comparisons`,
  `Data Quality and Coverage`;
- ArrowRight, ArrowLeft, End, and Home move tab selection and focus correctly.

Risky-sample readiness gate smoke:

- URL: `http://127.0.0.1:3018/demo`
- Browser: installed local Chrome executable driven headlessly.
- Temporary dev server was stopped after verification.
- `input[type="file"]` count remained 0 on `/demo`.
- Selected `Use risky quality sample`.
- Workflow reached `Validate`.
- Review-only heading visible:
  `Dashboard is review-only: unresolved evidence gaps remain`.
- `Generate dashboard` was disabled before acknowledgements.
- Three blocker checkboxes were visible and unchecked:
  - `Do not assign scarce resources without checking response capacity evidence.`
  - `Do not use affected-population rankings until negative count values are corrected.`
  - `Do not use response-gap charts for action until invalid percentages are corrected.`
- After checking all three blocker boxes, `Generate dashboard` became enabled.
- Clicking `Generate dashboard` moved the workflow to `Dashboard`.

Fresh in-app browser smoke:

- URL: `http://127.0.0.1:3021/demo`
- Browser: Codex in-app browser.
- Temporary dev server was stopped after verification.
- Initial `/demo` page identity: title `Dashboard Copilot`.
- Public demo still showed controlled-beta, session-only, and
  not-operational-action framing.
- Public demo had `0` file inputs and `0` `.llm-toggle` elements.
- Walkthrough CTA led to the sample-selection step.
- Risky sample selected without exposing upload controls.
- Workflow reached the Validate step through current labels:
  `Profile data`, `Harmonize data`, and `Prepare dataset`.
- Unsafe readiness gate rendered the review-only heading and three blocker
  checkboxes.
- Before acknowledgement: `Generate dashboard` disabled, 3 blockers unchecked.
- After acknowledgement: all 3 blockers checked, `Generate dashboard` enabled.
- Clicking `Generate dashboard` moved the workflow to the Dashboard step.
- `/app/usage` unauthenticated browser check redirected to
  `/login?next=%2Fapp%2Fusage`; no login form was submitted.
- Browser console check returned no relevant warning or error logs.

## Not Verified In This Run

The following plan items remain external-state or approval gated:

- latest staging magic-link click for the approved beta/admin email;
- authenticated staging `/app/usage`, `/app/templates`, `/app/feedback`, and
  `/admin` route rendering;
- safe metadata-only feedback write in staging;
- safe metadata-only template write in staging;
- aggregate-only admin reporting in staging;
- direct staging DB/RLS row checks;
- upload cap increase or realistic 3W/HDX file-size policy change;
- production deployment target/timing;
- production Supabase project configuration, redirect URLs, and migrations;
- production environment variables;
- production admin/beta allowlist changes;
- AI provider/model/quota changes;
- retention automation;
- production analytics/event sink.

## Blocker Audit

As of the latest continuation, the current worktree has no remaining
non-credentialed local implementation task that materially advances the release
gate beyond the evidence already recorded here and in
`staging_evidence_capture_2026-06-29.md`.

Remaining plan completion requires one of the following external actions:

- approved staging magic-link session and authenticated route checks;
- approved staging metadata-only feedback/template write checks;
- approved staging admin aggregate, DB/RLS, and log privacy checks;
- 25 MB upload-cap expansion and parse-progress work, if fixture-backed
  performance evidence shows 10 MB is insufficient;
- explicit production approval before production deployment, environment,
  Supabase, migration, admin/beta allowlist, provider/model/quota, analytics,
  retention, or persistence changes.

No production deployment, production mutation, account-setting change,
provider/model change, migration, allowlist change, retention automation, or
persistence expansion has been performed.

Prepared follow-up artifacts:

- `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_evidence_capture_2026-06-29.md`
  provides a privacy-safe checklist for the credentialed staging run.
- `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_test_runbook_2026-06-29.md`
  provides tester-facing staging instructions, stop conditions, expected
  results, screenshot rules, and evidence recording guidance.
- `plan/dashboard_copilot_codex_handoff_v1_1/qa/staging_test_payloads_2026-06-29.json`
  provides safe metadata-only feedback/template fixtures and anonymous probe
  payload shapes.
- `docs/decisions/upload-viability.md` records the approved 10 MB per-file
  upload cap and keeps 25 MB/performance expansion behind evidence.
- `docs/decisions/production-readiness.md` records the pending production
  approval fields without authorizing or performing production work.

## Approval Boundary

No production deployment, production migration, production environment change,
provider/model change, admin policy change, retention automation, or persistence
expansion was performed.
