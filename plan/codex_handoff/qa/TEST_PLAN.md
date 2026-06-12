# Test Plan

## Required unit/pure tests

### Evidence coverage
- maps fragmented sample datasets to response-prioritization evidence
- marks missing required evidence with plain next actions
- marks ambiguous evidence when multiple candidates are similarly plausible
- works without AI or recommendation state

### Demo samples
- fragmented demo sample data can be parsed/profiled
- fragmented demo data produces multi-source evidence coverage
- quality-risk sample triggers invalid value findings and decision_unsafe

### Handoff packet
- builds decision handoff packet with evidence coverage and lineage
- records deterministic fallback mode
- review-only language appears when decision readiness is unsafe

### No-code label helpers, if added
- readiness status labels are human-readable
- evidence coverage labels are human-readable

## Existing tests that must keep passing
- parsing/profiling
- join recommendation/application
- cleaning transforms
- workflow context sanitization
- LLM request body controls
- API fallback handling
- CSV formula neutralization
- dashboard recommendation reconciliation

## Command sequence
```bash
npm run test -- tests/dataPipeline.test.ts
npm run lint
npm run test
npm run build
```

## Manual browser checks
See `qa/ACCESSIBILITY_CHECKLIST.md` and `demo/SHOWCASE_SCRIPT.md`.
