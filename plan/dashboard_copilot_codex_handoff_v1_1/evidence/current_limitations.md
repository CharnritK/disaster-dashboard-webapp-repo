# Current Limitations and Assumptions

## Limitations

- Web search was not available while preparing this package.
- Current Vercel docs must be checked by the implementation agent or a human.
- Provider choices are included as defaults but remain review-gated.
- The package is a handoff, not an implementation.
- The package does not include credentials, API keys, or production environment values.

## Assumptions

- The product direction is approved: controlled authenticated AI beta with session-only uploaded data.
- Supabase Auth and Supabase Postgres are acceptable default providers only if the user keeps the approval block unchanged.
- Daily quota starts at 20 AI assists per user per day.
- The app will deploy to Vercel Free/Hobby.
- Background workers, queues, WebSockets, durable workflows, and long-lived server memory are out of scope.

## Readiness

`READY_WITH_ASSUMPTIONS`

If the approval block is not accepted, the first implementation milestone should stop after provider decision records and in-memory entitlement tests.
