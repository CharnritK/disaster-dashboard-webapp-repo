# Supabase Preview Branch Gate

Date: 2026-06-14

## Intent

Create a data-less Supabase preview branch for DB-backed controlled-beta
validation before any production migration.

## Result

Blocked by Supabase plan gate. The current organization is on the Free plan.
The Supabase Branching page showed:

- current selected branch: `main Production`;
- no existing preview branches;
- persistent branches require upgrade;
- preview branch dialog displayed `Upgrade to unlock branching`;
- final `Create branch` button stayed disabled after entering
  `dashboard-copilot-preview`.

No Supabase branch was created. No SQL migration was run. No production database
mutation was performed.

## Safe Prep Completed

- `db/schema.sql` now guards the `custom_templates_latest_version_fk`
  constraint for repeat-safe preview setup.
- `db/verify_metadata_preview.sql` now provides read-only verification queries
  for post-migration table, RLS, grant, and RPC checks.
- Local verification passed:
  - `npm run lint`
  - `npm run test`

## Recommended Decision

Do not migrate the current `main Production` Supabase branch.

Choose one:

1. Upgrade Supabase to unlock branching, then create a data-less preview branch.
2. Create a separate staging Supabase project and wire only Vercel Preview to it.
3. Keep preview deployments memory-backed until a staging database exists.

Option 2 is the best short-term path if the goal is external validation without
changing the billing plan.
