# Prompt 1 — Repo Baseline and Vercel Compatibility Audit

Use this prompt if you want Codex to perform only Phase 0.

## Copy-ready prompt

You are Codex working in `CharnritK/disaster-dashboard-webapp-repo`.

Goal: baseline the repo and make the build configuration safe for Vercel-oriented work.

Tasks:

1. Inspect the repo and confirm actual paths for:
   - `package.json`
   - `.tool-versions`
   - `.env.example`
   - `next.config.ts`
   - `scripts/prepare-sites-dist.mjs`
   - `app/page.tsx`
   - `app/api/recommend/route.ts`
   - `app/api/copilot/route.ts`
2. Run:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
3. Report actual outputs.
4. Check current official Vercel docs for supported Node versions and Hobby function limits.
5. If docs cannot be checked:
   - mark `VERIFY_CURRENT_DOCS`;
   - continue only local changes that do not depend on Vercel limits;
   - do not hard-code runtime or function duration settings.
6. Update Node/runtime configuration only after verification.
7. Make `distDir` conditional so Vercel can use default Next output.
8. Make `scripts/prepare-sites-dist.mjs` conditional for Codex/static output only.
9. Fix `.env.example` so AI is disabled by default.
10. Add a baseline Vitest test if no tests exist.

Do not implement auth, DB, provider SDKs, or UI.

Stop before merging deployment-specific config if current Vercel docs cannot be checked.
