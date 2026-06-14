# QA Checklist

## Required Commands

- `npm run lint`
- `npm run test`
- `npm run build`

## Manual Smoke

- `/demo` loads without auth and stays deterministic.
- `/app` redirects unauthenticated users to `/login`.
- `/login` renders and does not auto-create users.
- `/api/usage` returns 401 without auth.
- Feedback rejects row-like payloads.
- Template drafts reject example rows.
- Admin route denies by default.

## Blockers

- Do not run production migrations.
- Do not deploy production.
- Do not add stored uploaded rows, files, reports, screenshots, full prompts, or
  full model responses.
- Do not split workflow routes if doing so requires row persistence outside
  in-memory React state.
