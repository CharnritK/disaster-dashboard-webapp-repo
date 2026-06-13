# Accessibility and No-Code UX Checklist

## Keyboard
- [ ] Can tab through template selection.
- [ ] Can activate download CSV template.
- [ ] Can upload/load samples.
- [ ] Can profile, harmonize, adjust join, validate, generate dashboard, export.
- [ ] Focus indicator is visible.

## Semantics
- [ ] Each step has a clear heading.
- [ ] Buttons are real buttons.
- [ ] Tables have captions or nearby headings.
- [ ] Status panels use `role="status"` or `aria-live="polite"` where appropriate.

## Status communication
- [ ] No status is color-only.
- [ ] Evidence statuses include text: Covered / Needs review / Missing.
- [ ] Readiness statuses use human wording: Ready for review / Review needed / Not safe for action yet.
- [ ] Warnings explain what to do next.

## Plain language
- [ ] Technical terms are explained.
- [ ] Join is described as "combine files" where appropriate.
- [ ] The export log is described as a "decision handoff log."
- [ ] Decision-unsafe output is marked review-only, not final operational guidance.

## Privacy
- [ ] UI says full rows are not sent to LLM.
- [ ] UI says capped samples/metadata may be used when AI is on, if current behavior remains.
- [ ] AI off/fallback state is visible.

## Evidence Notes

2026-06-13 repo-local baseline:

- `ChartFrame` unit coverage verifies `aria-labelledby`, `aria-describedby`, data-quality state, and screen-reader summary rendering.
- Deterministic dashboard recommendation tests verify chart `screenReaderSummary` and mobile behavior after policy enforcement.
- Browser smoke used role and label selectors through template switching, fragmented demo data, profiling, harmonization, dashboard generation, export, and project-kit download.
- Human keyboard and assistive-technology review remains required before release.
