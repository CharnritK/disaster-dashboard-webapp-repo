# Vercel Free/Hobby Readiness

Status: locally verified, deployment not performed

## Current Checks

- Vercel Node.js runtime docs list `24.x` as the default supported Node version, with `22.x` and `20.x` also available. The repo uses Node `24.15.0` locally.
- Vercel environment variable docs support project/team scoped variables and sensitive server-side values.
- Vercel Hobby function-duration docs vary by function mode and Fluid Compute context, so this repo does not hard-code custom function duration settings.

## Repo Configuration

- Local and Codex Sites builds keep `distDir: "dist"` and run `scripts/prepare-sites-dist.mjs`.
- When `VERCEL=1` or `VERCEL=true`, `next.config.ts` leaves Next.js on the standard output path and the Codex Sites post-build script exits without changing output.

## Deployment Boundary

Codex must not deploy to production, edit production environment variables, or run production smoke tests with live credentials. Preview deployment should verify:

- `LLM_ENABLED=false` by default.
- AI routes fall back without provider keys.
- `/api/recommend/status` returns only safe public status.
- Uploaded rows remain session-only and are not persisted.
