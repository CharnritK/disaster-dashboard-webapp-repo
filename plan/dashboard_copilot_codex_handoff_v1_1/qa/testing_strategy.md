# Testing Strategy

## Existing commands

Run after each meaningful step:

```bash
npm run lint
npm run test
npm run build
```

Report actual output. Do not claim tests passed unless they were run.

## Unit tests

Add/update tests for:

- Asia/Bangkok quota date bucketing;
- atomic `reserveAiUsage` behavior;
- daily usage increment;
- quota exceeded fallback;
- authenticated vs unauthenticated AI route behavior;
- deterministic fallback still works;
- no uploaded row persistence;
- no full prompt persistence;
- feedback tag validation;
- template version validation;
- model/prompt version event capture;
- service-role key never imported into client modules.

## API route tests

Add route-handler tests for:

- `/api/recommend` unauthenticated with `useLlm=true`;
- `/api/recommend` authenticated under quota;
- `/api/recommend` authenticated over quota;
- `/api/recommend` invalid request body;
- `/api/recommend` missing provider API key;
- `/api/copilot` authenticated under quota;
- `/api/copilot` over quota;
- `/api/copilot` invalid request body;
- `/api/copilot` missing provider API key.

Expected behavior:

- provider attempts are counted only when an external call is attempted;
- deterministic fallback continues on denial/failure;
- fallback reasons are visible and safe.

## Supabase/RLS checks if provider is implemented

Add tests or policy checks for:

- user cannot read another user's `ai_usage_daily` rows;
- user cannot update another user's `custom_templates`;
- normal user cannot edit reviewed `template_versions`;
- `ai_events` writes are server-controlled;
- service-role key helpers are server-only.

## UI/manual checks

- `/demo` no login, deterministic only.
- `/app` login required for AI mode.
- Usage meter displays `used / limit`.
- Quota exceeded warning displays and workflow continues.
- Feedback capture appears after dashboard/export.
- Anonymous AI mode is hidden or disabled with CTA, according to approved behavior.
- Mobile layout does not become one giant stacked page.

## Deployment smoke checks

Before any production deployment decision:

- fresh preview deploy builds;
- env vars are present;
- AI disabled by default;
- status endpoint returns safe public status only;
- no server logs print secrets;
- AI route fallback works without provider key;
- uploaded rows are not written to DB.

Production deployment is not approved by this handoff.
