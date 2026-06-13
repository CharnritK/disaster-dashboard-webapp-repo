# T024 — Add internal eval and usage dashboard
Owner: AI Governance Engineer

Goal: Show aggregate usage and feedback to admins using metadata only.

Target files:
- `app/app/usage/page.tsx`
- `app/admin/**`
- `lib/adminMetrics/**`

Implementation notes:
- `Aggregate usage, fallback reasons, feedback tags, templates.`
- `Protect with admin role.`
- `Do not display row data or full prompts.`

Acceptance criteria:
- `Admins see usage, fallbacks, tags.`
- `Users cannot access admin view.`
- `No row data shown.`

Tests:
- admin guard
- query functions
- metadata-only checks

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No export of eval data.`
- `No saved datasets.`

Dependencies: T015, T013

Risk: Medium

Stop condition: Stop if dashboard could expose user data or row-like metadata.
