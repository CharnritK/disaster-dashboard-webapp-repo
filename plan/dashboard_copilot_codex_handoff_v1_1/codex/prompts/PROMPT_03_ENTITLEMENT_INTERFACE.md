# Prompt 3 — Usage Entitlement Service Interface + Tests, No DB Yet

Use this as a smaller first implementation prompt if the full `/goal` is too large.

## Objective

Create the foundation for tracking AI usage without connecting to Supabase or any real database.

## Constraints

- No provider SDK installation.
- No DB connection.
- No route changes yet unless tests require a tiny interface export.
- No uploaded row persistence.
- No full prompt persistence.
- Use Asia/Bangkok date bucketing.
- Count provider attempts through future atomic reserve semantics.

## Task

1. Create an entitlement module, such as `lib/entitlement.ts` or a repo-consistent path.
2. Export these logical functions or equivalent typed service methods:
   - `checkAiEntitlement(userId: string, taskType: string, date: Date, quota = 20)`
   - `reserveAiUsage(userId: string, date: Date, taskType: string, quota = 20)`
   - `recordAiEvent(event)`
   - `markAiEventComplete(eventId, outcome)`
   - optional read helper: `getDailyUsage(userId: string, date: Date)`
3. Use an in-memory map keyed by `userId + YYYY-MM-DD` in Asia/Bangkok timezone.
4. Treat `reserveAiUsage` as the future atomic operation that counts a provider attempt.
5. Do not increment for pre-provider deterministic fallback cases:
   - `unauthenticated`
   - `not_entitled`
   - `quota_exceeded`
   - `ai_disabled`
   - `missing_api_key`
   - `invalid_request`
   - `request_too_large`
6. Add typed deny/fallback reasons.
7. Write Vitest tests for:
   - first usage on new day
   - daily reserve/increment
   - quota exceeded
   - crossing midnight Asia/Bangkok resets usage
   - reserve does not exceed quota
   - event records include `attempted_provider_call` and `succeeded`

## Commands

```bash
npm run lint
npm run test
npm run build
```

## Acceptance criteria

- Entitlement module compiles.
- Tests pass.
- Date bucketing is tested.
- No DB or provider dependency is introduced.
- No raw uploaded data or full prompts can be stored by the service.
