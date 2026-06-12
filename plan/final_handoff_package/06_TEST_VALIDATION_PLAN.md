# 06 — Test & Validation Plan

## Validation command protocol

Run these commands when the environment supports them. Report exact command, result, and failure classification.

| Command | Purpose | Failure classification |
|---|---|---|
| `npm ci` | Install from lockfile | Environmental/dependency |
| `npm run lint` | Type/lint gate | Type/lint |
| `npm run test` | Vitest regression suite | Test/application |
| `npm run build` | Build/static packaging | Build/application/environment |

Do not write “tests passed” unless the command actually ran and produced passing output.

## P0 automated tests to add or confirm

| ID | Test | Input | Expected result | Safety condition |
|---|---|---|---|---|
| T-01 | Good fragmented demo path | Bundled fragmented sample | Profile, join, readiness, dashboard, export work | Caveats visible |
| T-02 | Risky quality sample | Quality-risk sample | Unsafe/review-needed readiness | No action approval |
| T-03 | AI disabled fallback | `LLM_ENABLED=false` or UI toggle off | Deterministic recommendations shown | Fallback visible |
| T-04 | Invalid model output fallback | Mock invalid JSON/schema | Fallback response | AI not trusted blindly |
| T-05 | Oversized upload | File > max limit | Clear rejection | Upload limit enforced |
| T-06 | Unsupported file type | Non-CSV/XLSX | Clear rejection | Parser boundary |
| T-07 | Missing evidence | Dataset lacking required fields | Missing coverage and caveat | Decision not action-ready |
| T-08 | Export caveats | Unsafe/review path | PDF/JSON contain caveats | Handoff safe |
| T-09 | No full-row LLM payload | Mock dataset with row marker | AI request lacks rows/data | Privacy boundary |
| T-10 | Viz policy | Problematic chart specs | Enforced or rejected | Avoid misleading visuals |

## Manual smoke test

1. Start local app.
2. Open `http://localhost:3000`.
3. Select response-prioritization template.
4. Use fragmented demo data.
5. Profile data.
6. Review evidence coverage.
7. Harmonize data.
8. Accept join recommendation.
9. Review readiness panel.
10. Generate dashboard.
11. Confirm caveats and insights are visible.
12. Export CSV, PDF/PNG, transformation log, and decision handoff.
13. Return to upload and run risky quality sample.
14. Confirm unsafe/review-only language appears.
15. Disable AI and repeat main path.
16. Confirm deterministic path still works.

## Failure reporting format

```text
Command:
Status:
Failure summary:
Likely cause:
Classification: environmental / dependency / type-test / application / unknown
Recommended fix:
Blocking? yes/no
```

## Release gate

A release candidate is not ready until:

- P0 tests exist or are manually validated.
- `npm run lint`, `npm run test`, and `npm run build` results are recorded.
- Manual smoke test passes.
- No secrets, PII, or partner-private data are included.
- Human review gate approves safety posture.
