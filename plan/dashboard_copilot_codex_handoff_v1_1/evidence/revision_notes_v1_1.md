# Revision Notes v1.1

This package revises the original Dashboard Copilot Codex handoff according to the latest challenger recommendations.

## Changes applied

1. Removed duplicate `/goal` line from `codex/prompts/GOAL_FULL_BUILD.md`.
2. Added package-reading preflight to the main goal prompt.
3. Replaced implicit provider approval with explicit approval flags.
4. Reordered the build sequence so entitlement and route gating come before provider integration.
5. Added Supabase-specific requirements:
   - `auth.users` identity mapping
   - no custom password storage
   - RLS policy draft
   - server-only DB client rules
   - service-role key browser isolation
6. Defined quota semantics:
   - count provider attempts
   - reserve usage atomically before provider call
   - track `attempted_provider_call` and `succeeded` separately
   - do not increment for pre-provider deterministic fallback
7. Added prompt/model version tracking expectations.
8. Added a milestone checkpoint after T010 before provider SDK installation, large route split, AI coach, or internal dashboard work.
9. Updated backlog, backlog JSON, task cards, QA strategy, review gates, and manifest to v1.1.

## Known limits

- Current Vercel documentation was not live-verified in this packaging environment.
- No repository files were modified.
- No tests were run.
- No deployment was attempted.
- No DB migrations were run.
