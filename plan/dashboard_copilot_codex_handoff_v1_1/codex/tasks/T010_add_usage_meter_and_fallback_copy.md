# T010 — Add usage meter and fallback copy
Owner: Workspace IA Engineer

Goal: Show daily AI usage in authenticated app shell or interim shell without breaking demo.

Target files:
- `components/UsageMeter.tsx`
- `lib/useAiUsage.ts`
- `app/api/usage/route.ts`
- `app/page.tsx or new app shell`

Implementation notes:
- `Add usage endpoint backed by entitlement adapter.`
- `Render used / limit.`
- `Show quota exceeded copy and deterministic-continuation message.`
- `Hide in /demo or render CTA-only.`
- `This is the milestone checkpoint task. After completion, stop and report before provider SDK install, route split, AI coach, or internal dashboard work.`

Acceptance criteria:
- `Authenticated UI shows usage.`
- `Quota warning appears.`
- `Demo remains deterministic.`
- `Fallback copy is clear.`
- `Milestone checkpoint report lists changed files, commands run, tests added, product-contract checks, privacy checks, and open approvals.`

Tests:
- hook render
- usage API
- manual UI check

Commands:
- `npm run lint`
- `npm run test`
- `npm run build`

Non-goals:
- `No route split.`
- `No provider SDK install.`

Dependencies: T007, T008, T009

Risk: Low

Stop condition: Stop after T010 for human review before provider SDK install, route split, AI coach, or internal dashboard.
