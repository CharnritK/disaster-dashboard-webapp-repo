# Feature Specification: Decision-Context Data Quality

**Feature Branch**: `001-decision-context-data-quality`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Improve data quality by starting from the decision question, action, data required, and decision-maker before judging uploaded data."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select Decision Template First (Priority: P1)

A response analyst starts by selecting the `Response prioritization` use-case template. The template pre-fills a compact decision brief and suggested data collection template so they can proceed immediately or adjust the fields before uploading or loading sample data.

**Why this priority**: Data quality is only meaningful relative to the decision being made. This is the smallest change that corrects the product frame.

**Independent Test**: A fresh session starts with a valid response-prioritization template brief and a populated suggested collection-template field list; if required brief fields are cleared, upload/profile/recommendation progression is disabled until they are restored. The decision context is available to deterministic and AI recommendation code as minimized metadata.

**Acceptance Scenarios**:

1. **Given** the app is opened fresh, **When** the `Response prioritization` template is selected by default, **Then** the decision question, action, decision-maker, geography, timeframe, and evidence needs are pre-filled and the analyst can continue to data.
2. **Given** the response-prioritization brief is present, **When** the clarify/template page renders, **Then** it shows a suggested data collection template with field names, evidence needs, types, examples, required/optional status, and caveats.
3. **Given** the analyst edits required evidence selections, **When** evidence needs change, **Then** the suggested collection-template fields update deterministically.
4. **Given** the analyst edits the template brief and clears required fields, **When** they try to continue, **Then** upload/profile/recommendation progression is disabled with clear missing-field guidance.
5. **Given** the analyst accepts or adjusts the template brief, **When** they load sample or uploaded data, **Then** the workflow continues using the brief as session-only context.

---

### User Story 2 - Assess Decision Readiness (Priority: P1)

After data is profiled or prepared, the analyst sees whether the data is `ready`, `review_needed`, or `decision_unsafe` for response prioritization.

**Why this priority**: The current checks detect issues but do not explain whether the data can safely support ranking places/groups by need, coverage, severity, and response gap.

**Independent Test**: Given a dataset missing required response-prioritization evidence, deterministic readiness checks produce quality findings with decision area, evidence need, caveat, and soft-gate status.

**Acceptance Scenarios**:

1. **Given** a response-prioritization brief requiring affected population and response-gap evidence, **When** a dataset lacks those fields, **Then** readiness is `review_needed` or `decision_unsafe` and names the missing evidence.
2. **Given** joined data has weak join completeness or severe missingness on required fields, **When** validation runs, **Then** readiness is `decision_unsafe` but dashboard generation remains available with caveats.

---

### User Story 3 - Carry Caveats Into Outputs (Priority: P2)

The generated dashboard, insights, and exports preserve decision-readiness caveats wherever risky fields or unsafe outputs may influence action.

**Why this priority**: Warnings that only appear on the validation screen are easy to lose when users export or present the dashboard.

**Independent Test**: A risky field used in a chart produces a visible chart caveat and the PDF/export summary includes readiness status plus caveats.

**Acceptance Scenarios**:

1. **Given** a chart uses a field with a quality caveat, **When** the dashboard is generated, **Then** the chart rationale or caveat text warns that the field is not decision-ready.
2. **Given** readiness is not `ready`, **When** the user exports the report, **Then** the export includes the readiness status, caveats, and review acknowledgement language.

### Edge Cases

- If no use-case template beyond response prioritization exists, default to `Response prioritization`, pre-fill the brief, and do not expose empty choices.
- If AI is disabled or unavailable, deterministic readiness still works.
- If the recommendation request is too large, decision context is truncated before submission and deterministic fallback remains valid.
- If data lacks all required evidence, the workflow remains soft-gated: no hard block, but outputs are clearly unsafe for decision use.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST start with a selected use-case template and a session-only decision brief before upload/sample loading can lead to profiling or recommendations.
- **FR-002**: System MUST support the `Response prioritization` template with pre-filled defaults and required evidence for geography/admin area, timeframe/date, severity/need, affected population or denominator, and response-gap/capacity.
- **FR-003**: System MUST compute deterministic decision-readiness status values: `ready`, `review_needed`, and `decision_unsafe`.
- **FR-004**: System MUST extend quality checks with decision impact metadata: decision area, evidence need, and caveat text.
- **FR-005**: System MUST preserve soft gating: users can continue to dashboard generation even when readiness is unsafe.
- **FR-006**: System MUST carry readiness caveats into dashboard insights, chart recommendations, PDF report export, and transformation/review context.
- **FR-007**: System MUST send only minimized decision context and profile metadata to `/api/recommend`; full uploaded rows remain client-side.
- **FR-008**: System MUST preserve existing allowed cleaning transform types and MUST NOT add imputation, row deletion, fuzzy matching, category recoding, or deduplication as automatic cleaning behavior.
- **FR-009**: System MUST populate a suggested data collection template from the selected decision brief and required evidence without calling AI or storing user data.

### Key Entities

- **UseCaseTemplate**: The supported decision pattern. V1 has `response_prioritization` only.
- **DecisionBrief**: Session-only user context containing question, action, decision-maker, geography, timeframe, and required evidence.
- **SuggestedDataCollectionTemplate**: Deterministic field list generated from the selected template and brief, including field names, types, examples, evidence needs, required/optional status, and caveats.
- **DecisionReadinessResult**: Deterministic summary containing readiness status, counts, covered/missing evidence, and caveats.
- **QualityCheckResult**: Existing quality finding extended with decision impact metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh session starts with a valid response-prioritization template brief and can proceed unless the user clears required decision brief fields.
- **SC-002**: Existing sample datasets produce `ready` or `review_needed` for response prioritization without requiring AI.
- **SC-003**: A dataset missing affected population and response-gap fields produces readiness findings naming both missing evidence needs.
- **SC-004**: Weak join completeness or severe missingness on required fields marks the output `decision_unsafe` while keeping dashboard generation available.
- **SC-005**: Recommendation request parsing sanitizes and truncates decision context without exposing full row data.
- **SC-006**: The clarify/template page shows a populated suggested collection template and updates field recommendations when evidence needs are changed.

## Assumptions

- V1 prioritizes only `Response prioritization`.
- Gating is soft, not hard, after the brief is complete.
- AI may explain context and tailor wording, but deterministic readiness owns status and severity.
- No persistence, authentication, background jobs, new storage, remote browser calls, package-manager changes, or expanded cleaning behavior are in scope.
