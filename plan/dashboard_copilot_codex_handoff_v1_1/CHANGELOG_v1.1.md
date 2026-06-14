# Changelog v1.1

## Why this revision exists

v1.1 hardens the Codex handoff for safer one-shot `/goal` usage.

## Changes

- Removed duplicate `/goal` risk from `GOAL_FULL_BUILD.md`.
- Added explicit approval flags for provider implementation, schema files, production deployment, production migrations, AI provider/model changes, and data-retention automation.
- Added a preflight instruction requiring Codex to read the handoff package files before editing code.
- Reordered the implementation sequence so entitlement and quota foundations come before provider integration.
- Added Supabase-specific RLS, `auth.users` mapping, and server-only DB rules.
- Resolved quota semantics: count provider attempts using atomic reserve, not only successful responses.
- Added prompt/model version tracking requirements.
- Added a milestone checkpoint after T010 before provider SDK installation, large route split, AI coach, or internal dashboard work.
- Updated backlog, task cards, QA, and manifest references.

## Remaining assumptions

- Current Vercel runtime/function constraints must still be verified against official docs before hard-coding deployment settings.
- Supabase Auth and Supabase Postgres are still defaults, but implementation is controlled by explicit approval flags.
- No production deployment, production migrations, credentials, or external writes are approved by this handoff.
