# Implementation Plan: Decision-Context Data Quality

**Branch**: `001-decision-context-data-quality` | **Date**: 2026-06-11 | **Spec**: `specs/001-decision-context-data-quality/spec.md`

**Input**: Feature specification from `specs/001-decision-context-data-quality/spec.md`

## Summary

Add a response-prioritization decision brief before data work, then evaluate profiled/prepared datasets against that decision context. Deterministic readiness becomes the authority for data safety labels, while AI receives only minimized context and remains optional.

## Technical Context

Historical status note: this plan belongs to the original decision-context
feature spec. Current repo runtime is Node.js 24.x, with `.tool-versions`
pinning `nodejs 24.15.0`.

**Language/Version**: TypeScript, React 19, Next.js 15 App Router, Node.js 24.x.

**Primary Dependencies**: Existing Next.js app, Vitest, `html-to-image`, `jspdf`, `read-excel-file`.

**Storage**: None. Decision brief is session-only React state.

**Testing**: `npm run lint`, `npm run test`, `npm run build`.

**Target Platform**: Browser client plus existing Next.js API route.

**Project Type**: Single Next.js web app.

**Performance Goals**: Deterministic readiness checks run in-memory on current uploaded/sample rows without new network calls or background work.

**Constraints**: Preserve minimized recommendation payloads, deterministic fallback, CSP self-only browser network posture, npm-only package management, and current cleaning transform contract.

**Scale/Scope**: Prototype workflow for CSV/XLSX uploads and bundled samples; V1 includes only the response-prioritization template.

## Constitution Check

The project constitution is still placeholder-only. Runtime governance comes
from `AGENTS.md`. For this historical feature spec, the relevant constraints
were recommendation-first workflow, session-only uploaded data, optional AI,
deterministic fallback, visible quality caveats, no new package manager, and no
new feature-specific storage. Current app-wide controlled-beta auth and
metadata-persistence boundaries are defined in `AGENTS.md`.

## Project Structure

### Documentation

```text
specs/001-decision-context-data-quality/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code

```text
app/page.tsx                         # Session workflow state and API request wiring
components/WorkflowComponents.tsx    # Decision brief, readiness, dashboard, export UI
lib/decisionContext.ts               # Template defaults, brief validation, readiness checks
lib/recommendationSchema.ts          # API request sanitization
lib/llmClient.ts                     # Minimized prompt payload
lib/dashboardRecommendations.ts      # Caveat-aware chart recommendations
lib/dashboardInsights.ts             # Readiness facts and insights
lib/exportPdf.ts                     # Readiness/caveat report output
types/decision.ts                    # Decision context and readiness types
types/quality.ts                     # Extended quality check metadata
types/recommendations.ts             # WorkflowContext decisionContext field
tests/dataPipeline.test.ts           # TDD coverage for deterministic/API behavior
```

**Structure Decision**: Keep the feature inside existing app/lib/types/tests boundaries. Do not add packages, storage, or new test frameworks.

## Complexity Tracking

No constitution violations. The feature adds one small deterministic module rather than broad platform infrastructure.
