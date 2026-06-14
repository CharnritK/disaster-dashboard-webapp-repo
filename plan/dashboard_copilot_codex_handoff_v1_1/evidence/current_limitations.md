# Current Limitations and Assumptions

## Limitations

- Original package preparation had no web search; later implementation passes
  checked current provider docs where needed for preview/staging decisions.
- Current Vercel docs must still be checked before changing runtime or function
  duration assumptions.
- Provider choices are approved defaults and implemented for preview/staging;
  production configuration remains review-gated.
- The package began as a handoff and now also contains implementation evidence.
- The package does not include credentials, API keys, or production environment values.

## Assumptions

- The product direction is approved: controlled authenticated AI beta with session-only uploaded data.
- Supabase Auth and Supabase Postgres are acceptable default providers only if the user keeps the approval block unchanged.
- Daily quota starts at 20 AI assists per user per day.
- The app will deploy to Vercel Free/Hobby.
- Background workers, queues, WebSockets, durable workflows, and long-lived server memory are out of scope.

## Readiness

`IMPLEMENTATION_COMPLETE_STAGING_AUTH_VERIFIED`

If the approval block is changed, future provider, production, migration, or
allowlist work must stop for renewed review.
