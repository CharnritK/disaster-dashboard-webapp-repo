# Branch Context

> Archive notice: this context belongs to the historical handoff package, not current project guidance. Use `README.md`, `AGENTS.md`, and `docs/README.md` for current setup and product contract.

Target branch: `001-decision-context-data-quality`.

Known current branch behavior from prior inspection:
- Next.js 15 / React 19 / TypeScript app.
- Workflow now starts with `brief` before upload/profile/recommend/validate/dashboard/export.
- Existing feature: response-prioritization decision brief.
- Existing feature: suggested collection template and CSV download.
- Existing feature: deterministic readiness statuses `ready`, `review_needed`, `decision_unsafe`.
- Existing feature: quality checks include decision metadata (`decisionArea`, `evidenceNeed`, `caveat`).
- Existing feature: decision caveats can propagate into dashboard chart rationale and export.
- Existing feature: `/api/recommend` uses minimized workflow context and deterministic fallback.
- Existing constraints: no new storage, no new packages, no unsafe automatic cleaning behavior.

Important target files:
- `app/page.tsx`
- `components/WorkflowComponents.tsx`
- `app/styles.css`
- `lib/decisionContext.ts`
- `lib/recommendationSchema.ts`
- `lib/llmClient.ts`
- `lib/fileParsers.ts`
- `lib/dashboardRecommendations.ts`
- `lib/dashboardInsights.ts`
- `lib/exportPdf.ts`
- `types/decision.ts`
- `types/quality.ts`
- `types/recommendations.ts`
- `tests/dataPipeline.test.ts`
- `public/samples/*`

Do not read or edit:
- `.agents/`
- unrelated generated directories
- package files unless a validation failure requires inspection
