# Upload Viability Decision

Date prepared: 2026-06-29

Verdict: `APPROVED_OPTION_B`

This records the Gate 2 upload-viability decision from
`docs/superpowers/plans/2026-06-29-product-review-roadmap-delivery.md`.
The default per-file cap has been raised to 10 MB while keeping the existing
environment override.

## Decision Needed

Should the controlled beta accept realistic 3W/HDX-style files larger than
the original 1 MB default upload cap?

Current local behavior:

- `MAX_UPLOAD_SIZE_MB` default is `10`.
- The value remains environment-overridable through existing config.
- Public `/demo` remains sample-only and upload-free.

## Options

### Option A - Defer

Keep the default cap at `1 MB` for now.

Use when:

- the next beta evidence run does not require realistic large operational
  files;
- the team wants more browser/device performance evidence before raising the
  cap;
- upload size is not blocking controlled-beta learning.

Tradeoff:

- Lower parsing/performance risk, but realistic 3W/HDX-style validation may
  remain blocked.

### Option B - Raise Default To 10 MB

Recommended first increase if realistic beta files are in scope.

Required implementation if approved:

- Raise default `MAX_UPLOAD_SIZE_MB` from `1` to `10`. `Done`
- Keep environment override support.
- Add or extend config tests for default, override, byte derivation, and
  lower-bound clamping. `Done`
- Reject oversize files before parsing. `Existing parser precheck`
- Show row/column counts before commit when practical. `Existing behavior`
- Keep uploaded data session-only.

Tradeoff:

- Better fit for realistic small-to-medium 3W/HDX-style files while keeping
  memory and UX risk bounded.

### Option C - Raise Default To 25 MB

Use only if target beta files are known to exceed 10 MB.

Required implementation if approved:

- Same safeguards as Option B.
- Add explicit browser/device performance smoke with at least one safe large
  fixture.
- Consider parse progress only if it can be implemented without fragile UX or
  broad refactor.

Tradeoff:

- Higher realism, higher local browser memory and slow-parse risk.

## Non-Negotiable Boundaries

- Do not expose arbitrary upload controls on public `/demo`.
- Do not persist uploaded files, raw rows, prepared rows, full datasets,
  exports, prompts, model responses, or reports.
- Do not add background upload retention or automated deletion jobs without
  separate retention approval.
- Do not use real sensitive disaster data as a committed fixture.

## Current Recommendation

Use Option B for controlled-beta testing: 10 MB per uploaded file is large
enough for realistic small-to-medium evidence files while keeping browser
memory and parse-time risk bounded. Move to 25 MB only with specific fixture
evidence and browser performance testing.

## Approval Record

- Decision owner: `User`
- Selected option: `Option B - Raise Default To 10 MB`
- Approved default cap: `10 MB per uploaded file`
- Required test fixture characteristics: `Not required for this scoped config change`
- Date approved: `2026-06-29`
