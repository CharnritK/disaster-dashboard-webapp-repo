# Database Drafts

These SQL files are review artifacts for the approved Supabase Auth + Supabase
Postgres path. They are not production migrations.

- `schema.sql` defines metadata-only tables.
- `rls.sql` defines Data API grants and Row Level Security policies.

Rules:

- Do not run these against production without explicit migration approval.
- Do not store uploaded rows, prepared rows, exported files, screenshots, full prompts, full model responses, provider secrets, or operational incident details.
- Keep usage and AI event writes server-controlled through service-role code or a reviewed RPC.
- Keep Supabase secret/service-role keys out of client components and browser bundles.
- Review Supabase Data API grants and RLS together; grants decide whether a role can reach an object, and RLS decides which rows are visible.
