# Logical Sub-Agent / Workstream Plan

These are Codex workstreams, not autonomous workers unless the execution environment supports that.

## 1. Repo Cartographer

Mission:

Map the repo and protect the baseline.

Allowed actions:

- inspect files
- update build/runtime docs
- run validation commands
- document findings

Forbidden actions:

- auth implementation
- DB provider changes
- deployment

Required inputs:

- repo checkout
- package manager
- current branch

Output:

- repo map
- baseline command output
- config risk notes

Test expectations:

- `npm run lint`
- `npm run test`
- `npm run build`

Review gate:

- reviewer: senior engineer
- scope: runtime/build config
- pass condition: baseline commands pass
- fallback: revert config-only changes

## 2. Vercel Deployment Auditor

Mission:

Check Vercel Free/Hobby compatibility.

Allowed actions:

- verify official docs
- update deployment docs
- propose `vercel.json`
- adjust safe config

Forbidden actions:

- production deploy
- production env changes
- paid feature assumptions

Required inputs:

- current Vercel docs
- repo build output
- target plan

Output:

- Vercel readiness report
- deployment checklist
- config changes if approved

Test expectations:

- preview-safe build
- safe status endpoint checks

Review gate:

- reviewer: deployment owner
- scope: runtime, build, env, function limits
- pass condition: official docs support assumptions
- fallback: keep deployment settings as draft

## 3. Product Contract Editor

Mission:

Keep docs aligned with governed AI beta.

Allowed actions:

- edit README/docs
- define boundaries
- add review gates
- update env examples

Forbidden actions:

- code feature implementation
- provider SDK installation

Required inputs:

- product contract
- allowed/forbidden persistence list

Output:

- product contract docs
- persistence boundary docs
- governance docs

Test expectations:

- docs lint if available
- no secrets in docs

Review gate:

- reviewer: product owner
- scope: contract, data boundaries, release posture
- pass condition: docs match approved contract
- fallback: mark docs provisional

## 4. Auth & Entitlement Engineer

Mission:

Implement login and AI access control.

Allowed actions:

- add auth integration after approval
- protect routes
- implement session helpers
- gate AI routes

Forbidden actions:

- storing uploaded rows
- exposing provider secrets
- adding orgs, billing, SSO

Required inputs:

- approved auth provider
- entitlement service interface
- DB adapter or memory adapter

Output:

- auth routes/helpers
- protected app routes
- AI route gating

Test expectations:

- authenticated route tests
- unauthenticated fallback tests
- session helper tests

Review gate:

- reviewer: security/privacy reviewer
- scope: auth flow, cookies, secrets, route protection
- pass condition: no key exposure and auth gates pass
- fallback: disable AI mode and keep deterministic workflow

## 5. Persistence Engineer

Mission:

Provide metadata-only persistence.

Allowed actions:

- implement DB adapter
- create schema drafts
- add test adapters

Forbidden actions:

- running production migrations
- storing rows/files/reports
- handling credentials

Required inputs:

- approved DB provider
- data model draft
- local/test DB config

Output:

- adapter
- schema/migrations
- tests

Test expectations:

- CRUD metadata tests
- no-row-persistence tests
- transaction/upsert tests

Review gate:

- reviewer: data/privacy owner
- scope: schema and migration safety
- pass condition: allowed tables only
- fallback: memory adapter only

## 6. AI Governance Engineer

Mission:

Track AI usage and fallback behavior.

Allowed actions:

- implement usage ledger
- record events
- add quota fallback
- build admin metadata dashboard

Forbidden actions:

- changing provider models without approval
- storing full prompts
- weakening deterministic fallback

Required inputs:

- entitlement service
- DB adapter
- AI route code

Output:

- usage ledger
- event logs
- fallback reasons
- usage dashboard

Test expectations:

- quota tests
- fallback tests
- metadata tests

Review gate:

- reviewer: product plus privacy owner
- scope: event metadata and fallback behavior
- pass condition: no row-like values stored
- fallback: disable event logging except counts

## 7. Eval & Feedback Engineer

Mission:

Capture user eval signals safely.

Allowed actions:

- add feedback API
- add feedback UI
- validate tags/comments

Forbidden actions:

- storing screenshots/files
- storing sensitive comments without warning
- building public analytics

Required inputs:

- feedback tags
- auth session
- DB adapter

Output:

- feedback form
- feedback API
- tests

Test expectations:

- tag validation
- auth guard
- metadata-only storage

Review gate:

- reviewer: product owner
- scope: feedback copy and metadata
- pass condition: tags and privacy copy are correct
- fallback: local-only feedback UI disabled

## 8. Template Builder Engineer

Mission:

Add custom and reviewed template architecture.

Allowed actions:

- template APIs
- template forms
- version validation

Forbidden actions:

- certifying safety via AI
- publishing user drafts
- storing example row data

Required inputs:

- template schema
- auth session
- DB adapter

Output:

- template CRUD
- template builder
- version tests

Test expectations:

- ownership tests
- version tests
- validation tests

Review gate:

- reviewer: domain/product owner
- scope: template fields and safety language
- pass condition: AI advice not certification
- fallback: reviewed templates only

## 9. Workspace IA Engineer

Mission:

Split the workflow into operational routes.

Allowed actions:

- create route groups
- extract components
- add app shell
- add usage meter

Forbidden actions:

- mixing route split with auth core PR
- storing workflow rows server-side

Required inputs:

- current workflow components
- auth guard
- usage API

Output:

- route-based workspace
- mobile layout

Test expectations:

- manual full workflow
- route guard tests
- mobile sanity check

Review gate:

- reviewer: UX/product owner
- scope: route flow and mobile behavior
- pass condition: workflow is not one stacked page
- fallback: keep monolith with shell wrapper

## 10. AI Coach Engineer

Mission:

Add right-rail coach hints.

Allowed actions:

- deterministic coach
- quota-aware AI augmentation
- caveat rendering

Forbidden actions:

- autonomous decisions
- readiness override
- raw row requests

Required inputs:

- step context
- entitlement service
- coach requirements

Output:

- coach rail
- hint engine
- tests

Test expectations:

- deterministic hints
- quota-denied behavior
- no row payload tests

Review gate:

- reviewer: safety/product owner
- scope: coach claims and caveats
- pass condition: deterministic readiness remains authoritative
- fallback: deterministic coach only

## 11. QA/Test Engineer

Mission:

Maintain confidence across the build.

Allowed actions:

- add tests
- add smoke scripts
- write checklists
- run commands

Forbidden actions:

- claiming tests passed without output
- production deployment

Required inputs:

- code changes
- test commands
- smoke environment

Output:

- test suite
- smoke checklist
- release readiness notes

Test expectations:

- lint/test/build
- route tests
- manual checks

Review gate:

- reviewer: engineering lead
- scope: test coverage and command output
- pass condition: required checks pass
- fallback: block merge

## 12. Security/Privacy Reviewer

Mission:

Enforce privacy and safe AI boundaries.

Allowed actions:

- audit code
- add privacy tests
- review env exposure
- block unsafe changes

Forbidden actions:

- handling credentials
- approving unsupported data retention

Required inputs:

- changed files
- schema diff
- route behavior

Output:

- privacy review notes
- required fixes
- release gate decision

Test expectations:

- no secret exposure
- no uploaded row persistence
- no full prompt storage

Review gate:

- reviewer: security/privacy owner
- scope: secrets, persistence, AI payloads, logs
- pass condition: contract preserved
- fallback: disable AI and persistence features
