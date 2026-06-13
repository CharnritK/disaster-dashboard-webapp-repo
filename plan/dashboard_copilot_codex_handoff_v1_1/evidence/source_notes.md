# Source and Evidence Notes

## Evidence status

- Repo file paths and current behavior are from prior repository inspection in this conversation.
- Vercel plan/runtime facts are marked `VERIFY_CURRENT_DOCS`.
- No tests were run while preparing this package.
- No code was changed while preparing this package.
- No deployment was attempted.

## Claims Codex must not treat as verified

- Exact Vercel Hobby timeouts.
- Exact current Node versions supported by Vercel.
- Exact current free-tier limits for any DB provider.
- Availability of Supabase, Neon, or any provider in the user's region.
- Production environment variable values.

## Validation commands

Codex should run these before and after relevant changes:

```bash
npm run lint
npm run test
npm run build
```

Codex should report actual command output, not just success claims.
