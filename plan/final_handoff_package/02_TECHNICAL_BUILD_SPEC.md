# 02 — Technical Build Spec

## Architecture stance

Preserve current architecture:

- Next.js / React / TypeScript.
- npm package manager.
- Vitest for tests.
- Client/session-local workflow state.
- Server-side AI provider calls only.
- Deterministic fallback in `lib/`.
- Decision and data types in `types/`.
- UI workflow localized to `app/` and `components/`.

## Target files / areas to verify

These are target areas to inspect and potentially modify; this package does not claim they have been changed.

| Area | Target files |
|---|---|
| App shell | `app/page.tsx` |
| Workflow UI | `components/WorkflowComponents.tsx` |
| API routes | `app/api/recommend/route.ts`, `app/api/copilot/route.ts` |
| Config | `lib/config.ts`, `.env.example` |
| Parsing | `lib/fileParsers.ts` |
| Profiling | `lib/profiling.ts` |
| Decision context | `lib/decisionContext.ts`, `types/decision.ts` |
| Harmonization | `lib/harmonization.ts`, `lib/cleaningTransforms.ts` |
| Validation | `lib/validation.ts`, `types/quality.ts` |
| Dashboard | `lib/dashboardRecommendations.ts`, `lib/dashboardInsights.ts`, `lib/vizPolicy.ts` |
| AI safety | `lib/recommendationSchema.ts`, `lib/llmClient.ts`, `lib/copilotHandoff.ts`, `lib/apiSecurity.ts` |
| Export | `lib/exportCsv.ts`, `lib/exportPdf.ts`, `lib/workflowExport.ts` |
| Tests | `tests/dataPipeline.test.ts` |
| Samples | `public/samples/`, `data/samples/` |
| Docs | `README.md`, `docs/` |

## Frontend requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| FE-01 | Fallback notice | When AI is disabled/unavailable, user sees a clear deterministic fallback message |
| FE-02 | Non-technical labels | Workflow copy avoids developer jargon |
| FE-03 | Readiness visibility | Status, caveats, and blockers remain visible through dashboard/export |
| FE-04 | Accessible controls | Buttons, file inputs, alerts, dialogs have labels and keyboard support |
| FE-05 | Chart summaries | Charts expose title, axes, caveats, and screen-reader summary |
| FE-06 | Upload guardrails | PII/sensitive-data warning appears before upload |

## Backend / library requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| BE-01 | Deterministic fallback | All AI failures return deterministic recommendations or handoff |
| BE-02 | No raw rows to AI | AI request builders include profiles/summaries only |
| BE-03 | Request limits | API routes enforce size and rate limits |
| BE-04 | Response sanitization | Invalid model output is sanitized or rejected into fallback |
| BE-05 | Quality checks | Missingness, duplicates, type issues, join coverage, unsafe ranges covered |
| BE-06 | Export safety | CSV formula neutralization remains tested |

## AI usage contract

AI may:

- Summarize workflow context.
- Suggest harmonization guidance.
- Suggest dashboard language.
- Draft handoff narrative.

AI must not:

- Decide final readiness.
- Approve operational action.
- Receive full uploaded rows.
- Perform hidden actions.
- Persist user data.

## Scaling and performance constraints

This is a browser/session prototype. Scaling means “larger local samples and smoother browser performance,” not production multi-user architecture.

| Concern | Guardrail |
|---|---|
| Large uploads | Keep file size limit; reject oversized files clearly |
| Heavy tables | Prefer summaries and capped previews |
| PDF export | Keep report bounded and caveated |
| AI cost/timeouts | Keep limits and deterministic fallback |
| Multi-user scaling | Out of scope unless architecture approved |

## Implementation style constraints

- Keep changes small and targeted.
- Do not introduce persistence, auth, or database dependencies.
- Do not add new package managers.
- Do not broaden to generic BI platform.
- Add or update tests with each logic change.
- Any new dependency requires explicit justification and review.
