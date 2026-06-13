# Repo Findings From Prior Inspection

These findings are based on the prior repository inspection in this conversation. Codex must verify them again before editing.

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
- `.tool-versions` pins `nodejs 26.1.0`.
- `next.config.ts` sets `distDir: "dist"`.
- `app/page.tsx` is a large client-side single-page workflow.
- AI routes are `/api/recommend`, `/api/copilot`, and `/api/recommend/status`.
- AI calls are server-side through `lib/llmClient.ts`.
- Deterministic fallback already exists.
- `.env.example` previously set `LLM_ENABLED=true`, which conflicts with deterministic-safe defaults.
- No auth layer was found.
- No persistence layer was found.
- No route split for `/demo` and `/app` was found.
- Test runner exists, but test file coverage must be verified in repo.

## Must verify before implementation

- Current branch and clean working tree.
- Node runtime supported by Vercel today.
- Current Vercel Hobby limits.
- Whether `distDir: "dist"` is required for any active deploy target.
- Whether `scripts/prepare-sites-dist.mjs` is still needed.
- Whether any tests have been added since the prior inspection.
