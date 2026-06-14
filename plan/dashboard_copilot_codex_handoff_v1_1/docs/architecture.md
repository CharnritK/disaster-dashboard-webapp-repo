# Product Architecture

## Product target

Controlled authenticated AI beta with session-only uploaded data.

## Public demo architecture

- Route: `/demo`.
- No login required.
- Synthetic/sample data only.
- Deterministic mode only.
- AI controls may be shown only as disabled CTA copy.
- No uploaded rows, files, prepared rows, or exports are persisted.

## Authenticated app architecture

- Routes under `/app/**` require login.
- Uploads remain in browser/session state.
- All AI calls stay server-side through app API routes.
- Persistent storage is metadata-only:
  - users/auth metadata;
  - ai_usage_daily;
  - ai_events;
  - feedback;
  - custom_templates;
  - template_versions;
  - non-sensitive eval metadata.

## AI entitlement architecture

- Entitlement service exists before provider calls.
- Keep in-memory/test adapter as the deterministic fallback and test path.
- Auth abstraction lets route tests use a test identity while configured
  preview/staging environments use Supabase Auth.
- Check entitlement before every `/api/recommend` and `/api/copilot` AI attempt.
- If denied, return deterministic fallback and preserve workflow continuation.

## Usage ledger architecture

- Count an AI assist when a provider call is attempted.
- Use atomic reserve before the provider call.
- Do not increment usage for deterministic denial/fallback before provider call.
- Record `attempted_provider_call` and `succeeded` separately.
- Store only non-sensitive metadata in `ai_events`.

See `docs/quota_accounting_policy.md`.

## Supabase architecture

Approved and implemented for preview/staging validation:

- use Supabase Auth as identity provider;
- map app user profiles to Supabase `auth.users`;
- use Supabase Postgres for metadata tables;
- add RLS policies for user-owned tables;
- keep service-role key server-only;
- do not run production migrations.

See `docs/security_supabase_rls.md`.

## Feedback/eval architecture

- Capture thumbs up/down, comment, and allowed tags.
- Store only non-sensitive context:
  - template id;
  - template version id;
  - AI mode;
  - model;
  - prompt version;
  - readiness status;
  - dashboard recommendation ids;
  - export action;
  - fallback reason.
- Do not store datasets, rows, full prompts, or exported files.

## Template architecture

- Reviewed templates are official/domain-approved.
- User custom templates are draft/private and untrusted until reviewed.
- AI may advise but must not certify safety.

## Workspace IA architecture

Implemented routes:

- `/demo`
- `/login`
- `/app`
- `/app/templates`
- `/app/templates/new`
- `/app/data`
- `/app/prepare`
- `/app/readiness`
- `/app/dashboard`
- `/app/export`
- `/app/usage`
- `/app/feedback`
- `/admin`

Layout:

- Top bar: template, readiness, AI usage, export.
- Left rail: filters, evidence fields, chart list.
- Center: selected dashboard view.
- Right rail: AI coach, caveats, chart rationale, next actions.
- Mobile: tabs or bottom sheets.

Route split happened after entitlement/auth foundations were established.
Future IA changes must preserve browser/session-only uploaded data and avoid
bundling unrelated auth, DB, or AI-provider changes into the same patch.
