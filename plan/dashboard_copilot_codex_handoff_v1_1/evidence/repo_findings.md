# Repo Findings From Prior Inspection

These findings were based on an early repository inspection. They are preserved
as historical context and must not override current repo evidence. Current
status is recorded in `../qa/final_goal_status.md`.

## Confirmed files and modules

- `package.json`
- `.tool-versions`
- `.env.example`
- `next.config.ts`
- `scripts/prepare-sites-dist.mjs`
- `app/page.tsx`
- `app/api/recommend/route.ts`
- `app/api/copilot/route.ts`
- `app/api/recommend/status/route.ts`
- `lib/apiSecurity.ts`
- `lib/serverConfig.ts`
- `lib/llmClient.ts`
- `lib/recommendations.ts`
- `lib/decisionContext.ts`
- `components/WorkflowComponents.tsx`
- `docs/AI_MODE.md`
- `README.md`

## Stack

- Next.js App Router
- React
- TypeScript
- npm
- Vitest
- Server route handlers under `app/api`

## Scripts observed

- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run start`

## Important repo-specific facts

- `package.json` build script runs `next build && node scripts/prepare-sites-dist.mjs`.
- `.tool-versions` now pins `nodejs 24.15.0`; `package.json` declares Node
  `24.x`.
- `next.config.ts` sets `distDir: "dist"` only outside Vercel builds.
- `app/page.tsx` is a large client-side single-page workflow.
- AI routes are `/api/recommend`, `/api/copilot`, and `/api/recommend/status`.
- AI calls are server-side through `lib/llmClient.ts`.
- Deterministic fallback already exists.
- `.env.example` now defaults to deterministic-safe mode with
  `LLM_ENABLED=false`.
- Auth, metadata-only persistence, `/demo` plus protected `/app/**`, feedback,
  templates, coach, and admin aggregate surfaces were later implemented for
  controlled-beta validation.
- Current tests are tracked by the normal `npm run test` gate and current QA
  status docs.

## Must verify before implementation

- Current branch and clean working tree.
- Node runtime supported by Vercel today.
- Current Vercel Hobby limits.
- Whether `distDir: "dist"` is required for any active deploy target.
- Whether `scripts/prepare-sites-dist.mjs` is still needed.
- Whether any tests have been added since the prior inspection.
