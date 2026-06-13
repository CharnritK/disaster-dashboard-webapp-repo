# Vercel Free/Hobby Readiness

## Status

`READY_WITH_ASSUMPTIONS` for local implementation.

`VERIFY_CURRENT_DOCS` before hard-coding deployment settings or claiming Vercel compatibility.

## Known repo risks from prior inspection

| issue | severity | repo evidence to verify | recommended fix | stop condition |
|---|---|---|---|---|
| Node runtime mismatch | High | `.tool-versions` may pin Node 26.1.0 | Verify current Vercel supported Node versions; set supported `engines.node` only after docs check | Stop before hard-coding runtime if docs unavailable |
| Custom `distDir` | Medium | `next.config.ts` may set `distDir: "dist"` | Use default `.next` for Vercel; keep static/Codex build conditional | Stop if changing output breaks local build |
| Static post-build script | Medium | `npm run build` may run `scripts/prepare-sites-dist.mjs` | Guard script with platform env var | Stop if Vercel build would lose API routes |
| LLM timeout | Medium | AI task timeouts may exceed Hobby limits | Verify current function duration; reduce timeouts if needed | Stop if docs cannot be checked |
| Persistence | Medium | No DB layer exists | Use approved external managed Postgres; no row storage | Stop before provider install if not approved |

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
- claim preview deploy readiness;
- create production deployment settings.
