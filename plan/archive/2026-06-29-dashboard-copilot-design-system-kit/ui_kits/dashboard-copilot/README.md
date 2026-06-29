# Dashboard Copilot — UI kit

> Archived reference only. This click-through kit is not the current app
> implementation and may contain outdated copy. Use the root app source for
> current behavior.

Interactive click-through recreation of the Dashboard Copilot workflow app (the product's only surface besides the about page). Built from `app/page.tsx`, `components/WorkflowComponents.tsx`, and `app/styles.css` in the source repo.

- `index.html` — mounts `WorkflowApp`; walk the full 7-step flow with bundled demo data (no uploads, no API).
- `WorkflowApp.jsx` — shell: sticky header, AI toggle, stepper, step routing, AI-off warning notice.
- `BriefStep.jsx` → `ExportStep.jsx` — one file per workflow step, composing the design-system primitives.
- Sample data mirrors `public/samples/demo_needs_assessment.csv` (districts, severity, response gaps).

Interactions covered: step navigation with gating, AI on/off fallback warning, loading sample data, accordion disclosure, join adjustment reveal, export acknowledgement gate.
