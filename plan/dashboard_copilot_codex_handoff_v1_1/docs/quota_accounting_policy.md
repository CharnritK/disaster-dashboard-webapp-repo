# Quota Accounting Policy v1.1

## Policy

Count an AI assist when the server attempts a provider call, not only when a provider response succeeds.

## Flow

1. Build deterministic fallback first.
2. Check auth and entitlement.
3. If denial occurs before provider call, return deterministic fallback and record an event without incrementing usage.
4. Immediately before provider call, reserve usage atomically.
5. Record `ai_event.attempted_provider_call=true`.
6. Call provider server-side.
7. Mark event complete with `succeeded=true` or `succeeded=false` and fallback reason.

## Do not increment usage for pre-provider fallback

- `unauthenticated`
- `not_entitled`
- `quota_exceeded`
- `ai_disabled`
- `missing_api_key`
- `invalid_request`
- `request_too_large`

## Required fields

- `ai_usage_daily.used_count`
- `ai_usage_daily.daily_limit`
- `ai_events.attempted_provider_call`
- `ai_events.succeeded`
- `ai_events.fallback_reason`
- `ai_events.prompt_version`

## Tests

- usage reserves before provider call;
- over-quota request does not call provider;
- pre-provider fallback does not increment usage;
- provider timeout is counted as an attempted provider call;
- retry is counted only if a new provider call is attempted.
