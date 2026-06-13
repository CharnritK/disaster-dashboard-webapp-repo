# Review Gates

## RG-001 Code safety review
Reviewer: Human developer/user.
Scope: Changed files, validation output, branch diff.
Pass condition: No unexpected scope expansion, no dependency additions, no broken validation.
Fallback: Revert last phase or skip optional goals.

## RG-002 Privacy and data safety review
Reviewer: Privacy/Safety Agent + human.
Scope: LLM payload, sample data, exports, upload warnings.
Pass condition: No real PII, no secrets, no full uploaded rows sent to LLM, AI fallback works.
Fallback: Remove risky sample/copy/change; disable AI for demo.

## RG-003 Disaster-response decision safety review
Reviewer: Human presenter/user.
Scope: Readiness wording, dashboard caveats, decision-unsafe states.
Pass condition: App does not imply automated operational decisions.
Fallback: Add review-only copy or avoid risky demo path.

## RG-004 Accessibility/no-code review
Reviewer: UX/A11y Agent + human smoke tester.
Scope: Keyboard path, semantic labels, status text, plain language.
Pass condition: Non-technical user can follow demo without SQL/data engineering vocabulary.
Fallback: Simplify labels and remove optional advanced details from primary path.

## RG-005 Showcase readiness review
Reviewer: Release Manager Agent + human.
Scope: Full validation commands and manual demo script.
Pass condition: lint/test/build pass and 3–5 minute demo path works.
Fallback: Use branch-as-is demo, skip optional template pack, turn AI off.
