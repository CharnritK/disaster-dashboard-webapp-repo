---
name: adapt-decision-template
description: Add or modify Dashboard Copilot decision templates. Use when creating a new use-case template, changing required evidence, updating suggested data collection fields, adding decision-readiness checks, or adapting response prioritization to another public-good workflow.
---

# Adapt Decision Template

## Overview

Use this skill when the project needs a new decision workflow. Keep the template deterministic, reviewable, and easy for non-technical users to understand.

## Decision Template Checklist

Before editing code, define:

- Decision question.
- Action that will be taken.
- Decision-maker or actor.
- Geography or grouping level.
- Timeframe.
- Required evidence.
- Fields that would make the decision unsafe if missing or low quality.
- Caveats that should travel into dashboard and export outputs.

## Code Touchpoints

- `types/decision.ts`: decision, template, suggested field, and readiness types.
- `lib/decisionContext.ts`: default template data, suggested collection fields, and readiness logic.
- `components/WorkflowComponents.tsx`: template selection, field preview, evidence coverage, and readiness UI.
- `lib/recommendationSchema.ts`: minimized request payload validation.
- `lib/dashboardRecommendations.ts`: caveat-aware dashboard recommendations.
- `lib/dashboardInsights.ts`: facts and insight support.
- `lib/exportPdf.ts` and related export helpers: report and handoff wording.
- `tests/dataPipeline.test.ts`: deterministic behavior coverage.

## Implementation Steps

1. Add or update the template data and required evidence.
2. Generate suggested collection fields from the decision brief without AI.
3. Keep the brief valid by default when possible.
4. Add readiness checks that name missing or unsafe evidence.
5. Carry readiness caveats into dashboard recommendations and exports.
6. Keep the workflow soft-gated after the brief is complete.
7. Add or update tests before calling the work complete.

## Product Rules

- Do not add automatic imputation, row deletion, fuzzy matching, category recoding, or deduplication.
- Do not send full uploaded rows to LLM routes.
- Do not make AI responsible for final readiness status.
- Do not hide missing evidence because the dashboard can still render.
- Use plain-language caveats that a response colleague can repeat in a meeting.

## Verification

Run `npm run lint` and `npm run test` for data, template, recommendation, or readiness changes.

Also run `npm run build` when UI, route, CSS, config, dependency, or runtime behavior changes.
