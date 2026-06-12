# 07 — Safety, Privacy & Governance

## Safety posture

This product supports human review. It does not approve disaster-response decisions.

## Non-negotiable safety rules

| Rule | Implementation expectation |
|---|---|
| Human review required | Readiness, dashboard, export and handoff preserve caveats |
| AI cannot approve | Deterministic readiness remains authoritative |
| No full rows to LLM | Recommendation/copilot requests use minimized profiles and summaries |
| Session-only | No auth, accounts, persistence, background jobs, or live pipelines |
| Deterministic fallback | AI disabled/unavailable/invalid/rate-limited returns safe fallback |
| Export caveats | PDF/JSON/CSV handoff include limitations and review notice |
| Synthetic/public data | Samples contain no PII or partner-private data |

## AI boundary

AI may assist with:

- Explaining quality issues.
- Suggesting harmonization language.
- Summarizing caveats.
- Drafting handoff narrative.

AI must not:

- Determine final readiness alone.
- Mark data safe for action.
- Send messages or alerts.
- Escalate cases.
- Approve operational decisions.
- Receive raw uploaded rows.

## Privacy checks

- Review API request builders for row fields.
- Search for raw dataset `data` / `rows` in LLM request payload construction.
- Confirm `LLM_API_KEY` is never referenced in client-visible code.
- Confirm sample datasets do not include real names, contacts, IDs, or sensitive operational data.
- Confirm exports do not add hidden persistence.

## Review gates

| Gate | Reviewer | Scope | Pass condition | Fallback |
|---|---|---|---|---|
| RG-01 Product scope | Product owner | vNext scope and non-goals | P0/P1 approved; platform features excluded | Reduce scope to P0 only |
| RG-02 Humanitarian workflow | Analyst / domain reviewer | Decision language and caveats | Workflow is understandable and review-safe | Rewrite copy and caveats |
| RG-03 AI/privacy | Safety reviewer | No-row AI, fallback, API key boundary | No raw rows/secrets; fallback proven | Block merge until fixed |
| RG-04 Export safety | QA/product reviewer | PDF/CSV/JSON handoff | Caveats, readiness, transformation log present | Block export changes |
| RG-05 Accessibility | Accessibility reviewer | UI, chart summaries, exports | No critical issues in agreed checks | Fix before release/demo |
| RG-06 Release | Repo maintainer | Tests/build/manual smoke | Commands recorded and P0 gate passed | Do not merge/release |

## Stop conditions

Stop and request review if:

- A task requires credentials.
- A task requires persistence or database changes.
- A task sends rows to AI routes.
- A task changes readiness semantics materially.
- Tests cannot be defined.
- The scope expands beyond approved P0/P1.
- The implementation would enable operational auto-approval/send/escalation.
