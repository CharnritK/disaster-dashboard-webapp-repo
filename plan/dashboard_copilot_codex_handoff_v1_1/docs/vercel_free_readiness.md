# Vercel Free/Hobby Readiness

## Status

`PREVIEW_VERIFIED_PRODUCTION_BLOCKED`.

The branch-scoped Vercel Preview has been configured for staging validation and
smoked successfully. Keep `VERIFY_CURRENT_DOCS` before hard-coding new
deployment settings, function-duration assumptions, or production runtime
claims.

## Known repo risks from prior inspection

| issue | severity | repo evidence to verify | recommended fix | stop condition |
|---|---|---|---|---|
| Node runtime mismatch | Medium | `.tool-versions` pins Node 24.15.0 and `package.json` declares `24.x` | Re-check Vercel docs before changing runtime; current preview build succeeded on Node 24.x | Stop before changing runtime if docs unavailable |
| Custom `distDir` | Low | `next.config.ts` uses `distDir: "dist"` only outside Vercel | Preserve default `.next` on Vercel and Codex Sites `dist` locally | Stop if changing output breaks local or preview build |
| Static post-build script | Low | `scripts/prepare-sites-dist.mjs` exits during Vercel builds | Keep platform guard so Vercel preserves API routes | Stop if Vercel build would lose API routes |
| LLM timeout | Medium | AI task timeouts may exceed Hobby limits | Verify current function duration; reduce timeouts if needed | Stop if docs cannot be checked |
| Persistence | Medium | Metadata-only DB layer exists and staging Supabase has schema/RLS applied | Continue staging DB validation; no row storage | Stop before production migration without approval |

## If docs cannot be checked

Codex may continue local product work that does not depend on Vercel limits:

- env/docs cleanup;
- entitlement interface;
- in-memory quota tests;
- deterministic fallback route tests;
- metadata schema drafts;
- feedback/tag validation tests.

Codex must not:

- hard-code Node runtime;
- set final function duration values;
- claim production deploy readiness;
- create production deployment settings.
