# 03 — Roadmap & Backlog

## Roadmap principle

Make one practitioner workflow trustworthy before adding platform features.

## Milestone 0 — Preflight and baseline

| Task | Owner | Output |
|---|---|---|
| Confirm current commands | Builder | Report results for `npm ci`, lint, test, build |
| Verify target files | Builder | File map and no-surprises summary |
| Confirm AI env defaults | Builder | `LLM_ENABLED=false` safe local default |
| Confirm no secrets/PII | Builder | Sample-data and docs scan |

## Milestone 1 — P0 credibility and safety

| ID | Work item | User value | Target areas | Acceptance criteria |
|---|---|---|---|---|
| P0-01 | Show AI fallback reason | Analyst understands when deterministic mode is active | `app/page.tsx`, `components/WorkflowComponents.tsx`, `lib/recommendations.ts` | AI-off, timeout, invalid output, and rate-limit states show clear fallback notice |
| P0-02 | Strengthen no-full-row AI tests | Privacy trust | `lib/recommendationSchema.ts`, `lib/copilotHandoff.ts`, `tests/dataPipeline.test.ts` | Tests fail if raw `data`, `rows`, or full sample row payload reaches AI route |
| P0-03 | Export caveat parity | Handoff trust | `lib/exportPdf.ts`, `lib/workflowExport.ts` | PDF and JSON handoff include readiness, caveats, AI mode, transformation log |
| P0-04 | Unsafe readiness regression tests | Prevent unsafe approval | `lib/decisionContext.ts`, `lib/validation.ts`, tests | Risky quality sample produces review/unsafe status and review-only export language |
| P0-05 | Demo copy cleanup | Non-technical clarity | `components/WorkflowComponents.tsx`, `docs/showcase-script.md` | Main demo can be narrated in 3–5 minutes without developer explanation |

## Milestone 2 — P1 leverage

| ID | Work item | User value | Target areas | Acceptance criteria |
|---|---|---|---|---|
| P1-01 | Add dashboard project kit README/config export | Easier second-pass handoff | `lib/workflowExport.ts`, export UI | Export includes data schema/config and README-style instructions |
| P1-02 | Improve accessibility baseline | Public-good readiness | UI components, chart summaries, tests | Keyboard navigation and chart summaries pass agreed checks |
| P1-03 | Add one additional decision template | Reuse proof | `types/decision.ts`, `lib/decisionContext.ts`, samples, tests | New template has samples, evidence map, readiness checks, docs |
| P1-04 | Visualization policy documentation | Chart trust | `docs/`, `lib/vizPolicy.ts` | Docs explain map/rate/denominator/caveat rules |

## Milestone 3 — P2 later enhancements

| ID | Work item | Reason deferred |
|---|---|---|
| P2-01 | More templates | Only after response-prioritization is credible |
| P2-02 | Richer geospatial boundaries | Requires map safety and denominator review |
| P2-03 | Playwright E2E suite | Useful after UI stabilizes |
| P2-04 | Local project kit zip | Useful after export content is stable |
| P2-05 | i18n | Later user research needed |

## P0 exit criteria

- Recommended validation commands run and results recorded.
- No new persistence/auth/background jobs added.
- AI-disabled path works.
- Invalid model output falls back.
- Export contains caveats.
- No full uploaded rows sent to LLM route.
- Demo script matches UI.
- Product owner and safety reviewer pass review gates.
