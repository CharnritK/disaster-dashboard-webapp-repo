# Disaster Dashboard Webapp – Target‑State Roadmap & Build Specification

## 1. Objective & Context

**Objective:** reach the target state described in the existing report (see `report.md`), turning the prototype into a robust, human‑centred decision‑support tool for humanitarian analysts.  Maintain session‑only operation, strict privacy boundaries, deterministic fallbacks and human review gates.

**Audience:** product owner, front‑end developers, back‑end developers, UX designers, testers, and Codex sub‑agents (automated coding assistants).  The roadmap is structured to allow independent task execution by sub‑agents while ensuring coherent integration.

## 2. High‑Level Goals

| Goal | Description | Success Criteria | Stakeholders | Review Gate |
|---|---|---|---|---|
| **G1. Accessible & Transparent Workflow** | Create a clear, step‑by‑step interface that guides non‑technical analysts from data upload to handoff export, emphasising caveats and human review. | Analysts can complete the workflow using sample data without confusion; UI includes tooltips and warnings; PDF exports meet accessibility standards. | Analyst, UX designer | UX review by humanitarian analyst; accessibility audit |
| **G2. Improved Data Validation** | Extend quality checks to include range and category validation; clearly surface issues before decisions. | Validation flags negative/out‑of‑range values and invalid categories; readiness statuses adjust accordingly; tests cover new checks. | Back‑end developer, tester | Code review; test suite passes; product owner signs off |
| **G3. Enhanced Documentation & Sample Assets** | Consolidate documentation into a single user guide; provide additional synthetic datasets and a new decision template. | User guide covers installation, workflow, privacy, and extension; at least one new decision template (service capacity) with sample data; codex handoff tasks updated. | Technical writer, sample data creator | Product owner approves documentation; new template passes tests |
| **G4. Accessibility & UX Enhancements** | Improve PDF exports and UI components for screen readers; add alt text to charts and accessible labels to controls. | PDF exports include alt text; UI passes basic axe-core accessibility tests; visually impaired testers can interpret outputs. | Front‑end developer, UX designer | Accessibility test report; human reviewer approval |
| **G5. Codex‑Ready Modularization** | Split improvements into discrete, context‑bounded tasks so that Codex sub‑agents can implement them efficiently. | Each task references only necessary files; acceptance criteria and tests defined; tasks do not overlap context; codex agents can execute independently. | Product owner, Codex integration lead | Code review; test suite passes; integration smoke test |

## 3. Analyst / Non‑Technical User Considerations

- **Ease of Use:** The interface should guide users through each step with plain‑language instructions.  Provide inline help (e.g., “Why join datasets?”) and warnings about sensitive data.  Avoid technical jargon.
- **Decision Templates:** Focus on one primary template (cash‑transfer assistance) and add one secondary template (service capacity allocation).  Each template should provide a short description and specify required evidence fields.  Avoid exposing complex configuration.
- **Data Input:** Allow drag‑and‑drop of CSV/XLSX files; clearly indicate supported formats and file size limit (from `lib/config.ts`).  Offer sample datasets for quick trials.
- **Evidence Coverage & Quality:** Present evidence coverage as a simple checklist or progress bar.  Surface quality issues (duplicates, missing values, out‑of‑range values) with concise messages.  Do not expose raw statistical metrics unless necessary.
- **Review Gate:** After readiness checks, require the user to confirm they understand caveats and that a human supervisor must approve the decision.  Provide a summary page summarising the evidence, quality issues and caveats before allowing export.

## 4. Front‑End Specification

1. **User Interface Structure**
   - Maintain the step‑based workflow (decision brief, upload, profile, harmonise, validate, dashboard, export).  Use a side or top navigation indicator to show progress.
   - Integrate tooltips and info modals using accessible components.  Provide examples and warnings in context.
2. **Component Enhancements**
   - Update `WorkflowComponents.tsx` to handle new validation messages and range/category warnings; ensure messages are visually distinct and screen‑reader compatible.
   - Add alt text to charts in `exportPdf.ts` and ARIA labels to interactive elements.  Use chart titles and axis labels to generate alt descriptions.
   - Ensure modals and alerts are keyboard navigable and labelled appropriately.
3. **Responsiveness & Layout**
   - Ensure layout adapts to different screen sizes without breaking the step flow.  Use CSS grid/flexbox and test across devices.
4. **Accessibility Testing**
   - Integrate axe-core checks into the development process.  Write a Playwright test that runs axe on the built site and reports violations.  Set thresholds (no critical violations) to pass.

## 5. Back‑End Specification

1. **Validation Enhancements (G2)**
   - Extend `lib/validation.ts` to include numeric range validation (e.g., counts cannot be negative; percentages between 0–100) and category whitelists for fields like severity or priority.  Define configurable allowed values or accept lists from templates.
   - Update `types/quality.ts` to accommodate new `checkType` values and descriptions.
   - Provide user feedback through front‑end components, including severity levels (warning vs error).
2. **New Decision Template (Service Capacity)**
   - Modify `lib/decisionContext.ts` to add a new `UseCaseTemplate` entry (e.g., `service_capacity_allocation`) with description, question prompt and evidence fields (number of health facilities, evacuation centers, staff capacity, etc.).
   - Add corresponding enumeration in `types/decision.ts`.
   - Provide sample datasets (e.g., `demo_service_capacity.csv` in `public/samples`) and update documentation.
   - Adjust `profiling.ts` and `evidence coverage` logic to support new fields.
3. **Export & Copilot Enhancements**
   - Amend `lib/exportPdf.ts` to insert alt text for each chart based on chart titles and axes; ensure alt text is included in the PDF’s accessibility tags.
   - Surface fallback reasons in API responses (e.g., add `fallbackReason` to JSON); update UI to display a message when AI fallback occurs.
   - Keep `llmClient.ts` logic unchanged except for logging fallback reasons; do not expand AI scope.
4. **Configuration & Security**
   - Leave session‑only operation and serverless architecture intact.  Do not introduce new persistent services.  Maintain rate limiting in `lib/apiSecurity.ts`.
   - Add tests to ensure no raw data is sent to AI; monitor network payloads during development.

## 6. Scaling & Performance Considerations

- **In‑Browser Processing:** The app runs entirely client‑side except for AI calls and PDF generation.  To handle larger datasets within memory constraints, consider streaming CSV parsing and limiting dataset sizes (already enforced via `MAX_UPLOAD_SIZE_MB`).
- **Responsive Rendering:** Chart rendering and PDF creation should remain performant with datasets up to ~5,000 rows.  Use memoisation and virtualization for large tables.  Perform performance profiling with sample data.
- **Sub‑agent Execution:** When dividing work among codex sub‑agents, ensure each task modifies a small portion of the codebase.  Use targeted GitHub PRs and run incremental tests.  Avoid global refactors that risk large context windows.

## 7. Testing & Validation Plan

| Area | Test/Validation Description | Tools & Methods | Acceptance Threshold |
|---|---|---|---|
| **Validation Logic** | Unit tests covering range and category checks; ensure invalid values are flagged and reflected in readiness. | Vitest; synthetic datasets for negative/invalid values. | All new tests pass; existing tests unaffected. |
| **Decision Template** | Tests verifying evidence coverage and profiling for the new service capacity template; ensure UI displays correct fields. | Vitest; sample datasets; manual UI check. | Evidence coverage map shows missing/completed fields; export includes correct fields. |
| **Accessibility** | Automated axe-core scans on built site; PDF accessibility audit; manual screen reader test. | Playwright with axe; PDF accessibility checker. | No critical violations; alt text present; content navigable via keyboard. |
| **AI Fallback Transparency** | Simulate AI failure; ensure UI displays fallback reason and deterministic recommendations. | Unit tests; manual simulation by disabling LLM. | Fallback message appears; no crash; deterministic recommendations used. |
| **Handoff Package Integrity** | Check that exported PDFs and CSVs contain caveats, assumptions, quality summary and no hidden data or formulas. | Manual inspection; code review of `exportCsv.ts` and `exportPdf.ts`. | All exports show caveats and review notice; formulas neutralised. |
| **UI Smoke Test** | End‑to‑end test to upload sample data, accept recommendations, run validation and export. | Playwright; sample datasets. | Test completes without error; key UI elements present; export generated. |

## 8. Review Gates & Governance

| Gate | Reviewer | Scope | Pass Condition | Fallback |
|---|---|---|---|---|
| **Data Validation Implementation** | Back‑end lead | New validation functions and tests | All unit tests pass; code reviewed for security and performance | Block release until issues resolved |
| **New Template & Samples** | Product owner, analyst | New decision template, evidence fields, sample data | Template matches humanitarian scenario; sample data synthetic and safe; documentation updated | Rework template or sample data |
| **Accessibility & UI** | UX designer, accessibility specialist | Alt text, labels, navigation, PDF accessibility | No critical accessibility issues; UX flows approved by analyst | Fix accessibility defects, revise UI |
| **Documentation** | Technical writer, product owner | Consolidated user guide and codex handoff docs | Guide complete, accurate, and aligned with current state; codex tasks updated | Revise guide; remove outdated sections |
| **Final Readiness** | Product owner, QA lead | Integrated build, smoke tests, manual review | All acceptance criteria met; review gates passed; no high‑risk issues outstanding | Delay release until defects addressed |

## 9. Codex Sub‑Agent Task Structure

To maximise performance and manage context size, break tasks into discrete modules for codex sub‑agents:

1. **Validation Enhancements Module**: Modify `lib/validation.ts` and `types/quality.ts` to add range and category checks; update tests.  Provide only these files plus the relevant test fixture; exclude unrelated components to reduce context.
2. **Accessibility Module**: Edit `lib/exportPdf.ts` and related UI components to insert alt text; update accessibility tests.  Provide the PDF export file and a minimal UI component excerpt.
3. **Documentation & Samples Module**: Create a new user guide in `docs/`, integrate existing content, update `README.md`; add sample datasets.  Provide documentation files only.
4. **Decision Template Module**: Update decision context and types to add the service capacity template; adjust UI enumeration; add sample dataset file.  Provide decision-related files only.
5. **UI Smoke Test Module**: Set up Playwright test infrastructure and create `tests/ui-smoke.spec.ts`; adjust `package.json` scripts.  Provide only test files and config.

Each module should include clear objectives, required files, constraints, acceptance criteria and validation commands, similar to those outlined in the codex tasks section of the report.  Sub‑agents must not access unrelated files; maintainers should orchestrate integration after modules complete.

## 10. Conclusion & Next Actions

This roadmap defines a scoped path to bring the disaster dashboard prototype closer to its target state while preserving privacy, determinism and human oversight.  The focus areas—workflow clarity, data validation, accessibility, documentation, and modular task structure—address the primary gaps identified in the current state report.  By following this plan, the team can deliver a robust humanitarian decision‑support tool and prepare for a safe, codex‑enabled handoff.

**Immediate next actions:**

1. Approve the roadmap and assign modules to developers and codex sub‑agents.
2. Prepare synthetic sample data for the new template and validation tests.
3. Draft the consolidated user guide and update codex handoff documentation.
4. Schedule accessibility review and integration testing after modules are delivered.

