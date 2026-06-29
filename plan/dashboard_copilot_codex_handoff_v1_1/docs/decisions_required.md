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
production until auth, DB, and deterministic fallback smoke tests pass and
explicit production approval is granted.

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

## Form-Aware Disaster Intake Decisions

2026-06-28 update: the session-only Decision Repair Layer, deterministic Next
Best Action Coach, and protected-workflow repair UI slice are implemented
locally. This update does not expand the persistence boundary or change the
blocked decisions below.

The 2026-06-21 form-aware disaster intake roadmap is approved only as local
planning until implementation is explicitly started. The 2026-06-21
product-standout local implementation goal starts the first safe implementation
slice: deterministic, session-only form/export detection and mapping over the
existing dataset workflow. The following remain blocked without separate
explicit approval:

- Persisted form-family registry tables or reusable user mapping storage.
- Production migrations, production deployment, production environment changes,
  or admin reporting expansion.
- Form upload or arbitrary form entry in the public `/demo` route.
- AI interpretation of schemas/forms or any AI provider/model/quota/SDK change.
- Evidence taxonomy expansion beyond the existing decision needs.
- Labeling external form mappings as official or authoritative.
- Fuzzy matching, imputation, deduplication, row deletion, geocoding, or
  non-row-preserving cleaning to support forms.
- Live KoBo/ODK/Google Forms sync or background intake jobs.

## Decision Assurance Product-Standout Decisions

The local product-standout layer may improve reviewed templates, readiness
summaries, export-only dossier fields, AI fallback explanations, approved
metadata-only learning signals, and protected-app form review UI. The following
remain blocked without separate explicit approval:

- Treating the Evidence Readiness Control Tower as operational command
  authority rather than reviewable decision readiness.
- Expanding the evidence taxonomy beyond the reviewed decision-template needs.
- Persisting control tower state, form mappings, source registers, dossiers,
  exports, prepared rows, or uploaded rows.
- Adding automatic learning, model tuning, or template/playbook mutation from
  beta feedback.
- Expanding admin reports beyond aggregate metadata.
- Claiming AI certification, operational safety, or official external-form
  mappings.
