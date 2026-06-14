# Controlled-Beta Decisions

Date: 2026-06-14

Verdict: `APPROVED_WITH_PREVIEW_AND_STAGING_LIMITS`

The user approved the controlled-beta decision posture below. This is approval
to configure and validate the beta path safely. It is not approval to mutate
production, run production migrations, open public signup, add anonymous AI, or
automate retention deletion.

## D1 - Preview Deployment Path

Decision: approved preview-only first.

Implication: use a preview deployment for external validation. Do not deploy
production until auth, DB, and deterministic fallback smoke tests pass.

## D2 - Real Supabase Project

Decision: approved Supabase Auth and Supabase Postgres.

Implication: use magic-link login, protected `/app/**` routes, metadata-only
storage, and RLS review. Credentials and project values must still be supplied
outside version control.

## D3 - Database Migration Timing

Decision: approved review-first migration timing.

Implication: review `db/schema.sql` and `db/rls.sql`, then apply them only to a
preview or staging database. Production migrations remain blocked.

## D4 - Beta And Admin Allowlists

Decision: approved narrow access.

Implication: use named beta emails and named admins. Keep
`AI_BETA_ALLOW_ALL_AUTHENTICATED=false`. Do not enable open self-serve signup.

## D5 - Daily AI Quota

Decision: approved early-beta quota of `AI_DAILY_QUOTA=20`.

Implication: keep quota copy, usage reservations, and fallback behavior aligned
to 20 attempted provider calls per user per day unless real beta usage changes
the decision.

## D6 - Public Demo Behavior

Decision: approved deterministic sample-only demo.

Implication: keep `/demo` public, deterministic, sample-only, and free of
anonymous AI. Arbitrary upload controls and anonymous provider calls remain out
of scope for the public demo.

## D7 - Retention Policy

Decision: approved manual retention documentation now.

Implication: document retention posture, but do not automate deletion until
legal/product review approves ownership, service-role boundaries, logs, and
rollback.

## Current Follow-Up Decisions

The preview/staging path has now been configured and user-confirmed for the
approved beta/admin email. The following decisions remain intentionally blocked:

- Production deployment target and timing.
- Production Supabase project configuration, redirect URLs, and migrations.
- Any additional beta or admin allowlist entries.
- Any change to `AI_DAILY_QUOTA=20`.
- Any change to deterministic sample-only `/demo` behavior.
- Any retention automation.
