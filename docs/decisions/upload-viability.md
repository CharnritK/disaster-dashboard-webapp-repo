# Upload Viability Decision

Date prepared: 2026-06-29

Verdict: `PENDING_USER_DECISION`

This records the open Gate 2 upload-viability decision from
`docs/superpowers/plans/2026-06-29-product-review-roadmap-delivery.md`.
No upload-cap code change has been made under this decision record.

## Decision Needed

Should the controlled beta accept realistic 3W/HDX-style files larger than
the current default upload cap?

Current local behavior:

- `MAX_UPLOAD_SIZE_MB` default remains `1`.
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

- Raise default `MAX_UPLOAD_SIZE_MB` from `1` to `10`.
- Keep environment override support.
- Add or extend config tests for default, override, byte derivation, and
  lower-bound clamping.
- Add client-side size precheck before parsing.
- Show row/column counts before commit when practical.
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

Approve Option B only when the next controlled-beta evidence run explicitly
needs realistic files over `1 MB`. Otherwise defer and keep the current cap.

## Approval Record

- Decision owner: `Pending`
- Selected option: `Pending`
- Approved default cap: `Pending`
- Required test fixture characteristics: `Pending`
- Date approved: `Pending`
