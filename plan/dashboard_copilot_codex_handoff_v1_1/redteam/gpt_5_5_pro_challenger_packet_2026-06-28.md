# GPT-5.5 Pro Challenger Packet

Date: 2026-06-28

Purpose: prepare a sanitized prompt for optional GPT-5.5 Pro challenger
red-team review of the local/staging-safe form-intake expansion plan.

Status: prepared for advisory review only. Codex remains responsible for final
scope, edits, tests, verification, and approval gates.

## Capacity And Privacy Note

ChatGPT Pro was user-confirmed in the local capacity ledger, but current usage
remaining is unknown. Treat GPT-5.5 Pro review as optional advisory work, not a
required verification path.

Do not send:

- `.env`, `.env.local`, API keys, tokens, auth secrets, service-role keys;
- raw uploaded data, prepared rows, full datasets, exports, screenshots;
- private messages, personal identifiers, account/billing/payment data;
- production DB details, production deployment settings, admin allowlists;
- full LLM prompts or model responses containing row-like values.

## Sanitized Review Prompt

You are a challenger red-team reviewer for a controlled-beta disaster response
decision-support app.

Review the following local planning artifacts:

- `AGENTS.md`
- `docs/superpowers/specs/2026-06-28-form-expansion-repair-coach-design.md`
- `docs/superpowers/plans/2026-06-28-form-expansion-repair-coach.md`
- `docs/agent-playbooks/form-expansion-repair-coach-agents.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/docs/form_intake_expansion_repair_coach_roadmap.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/docs/product_contract.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/docs/implementation_rules.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/docs/data_model.md`
- `plan/dashboard_copilot_codex_handoff_v1_1/docs/form_aware_disaster_intake_roadmap.md`
- `types/formIntake.ts`
- `lib/formIntake.ts`
- `tests/formIntake.test.ts`
- `tests/privacy-no-row-persistence.test.ts`
- `db/schema.sql`
- `db/rls.sql`
- `lib/db/metadataAdapter.ts`
- `lib/llmClient.ts`
- `app/api/recommend/route.ts`
- `app/api/coach/route.ts`

Review objective:

Find gaps, contradictions, unsafe assumptions, missing tests, unclear approval
boundaries, privacy leaks, or product overclaims in the planned local/staging
implementation.

Critical constraints:

- uploaded disaster data remains session-only;
- persisted data must be metadata-only;
- no production deployment or production migration is approved;
- public `/demo` remains deterministic and sample-only;
- AI is optional, advisory, auth/quota-gated, server-side, and
  deterministic-fallback-first;
- repair actions must help the user act but must not imply operational
  authority;
- fuzzy matching, OCR, geocoding, and live sync are review-only or metadata-only
  in this pass.

Attack these questions:

1. Does any proposed table, adapter method, route, or UI surface risk storing
   raw rows, files, OCR text, geocoded results, connector records, prompts, or
   model responses?
2. Does the AI schema interpretation plan correctly separate schema metadata
   from row/sample values?
3. Are repair actions useful enough, or do they still flag issues without
   guiding the lowest-effort fix?
4. Does the coach become concrete and contextual, or does it remain generic?
5. Can fuzzy matching, geocoding, or OCR silently mutate data or overclaim
   confidence?
6. Are SQL/RLS, adapter allowlists, route validators, and tests updated in the
   same phase?
7. Is `/demo` protected from scope creep?
8. Are staging validation and production approval boundaries clear?
9. Are the proposed unit tests behavior-focused, or are they brittle string
   checks?
10. What is the smallest implementation slice that should ship first?

Return format:

```text
Status: completed / partial / blocked
Top risks:
Findings:
Missing tests:
Contradictions:
Approval gates:
Recommended cuts:
Recommended first implementation slice:
Reviewer confidence:
```

Do not request or rely on secrets, account pages, billing pages, production
dashboards, raw uploaded data, private messages, or unshared external context.

## Local Fallback

If GPT-5.5 Pro is unavailable, use a local Codex read-only challenger subagent
with the same prompt and require file/line evidence for every finding.
