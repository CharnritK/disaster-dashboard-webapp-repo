# Data Retention Draft

This is the controlled-beta manual retention posture. It does not authorize
automation, scheduled deletion, production migrations, or production deletion
jobs.

## Stored Metadata

- User profile metadata: retain while the beta account is active.
- AI usage daily counters: retain for 13 months for quota and audit review.
- AI event metadata: retain for 13 months. Store prompt versions, model names,
  fallback reasons, counts, and route/task identifiers only.
- Feedback metadata: retain for 13 months or until the user requests removal.
- Custom templates and versions: retain while owned by the user or reviewed by
  the product owner.
- Admin aggregate metrics: derived from metadata only.

## Forbidden Retention

Do not store uploaded rows, prepared rows, exported files, screenshots, full
prompts, full model responses, secrets, or operational incident details.

## Automation Gate

No retention automation is approved in v1. A future deletion job requires legal
and product review, plus a separate review of ownership, RLS, service-role
boundaries, logs, and rollback.
