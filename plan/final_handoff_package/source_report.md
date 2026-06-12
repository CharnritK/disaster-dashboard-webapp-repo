# Executive Summary

The `disaster‑dashboard‑webapp` repository is a prototype for humanitarian decision support.  It helps practitioners (humanitarian analysts or disaster coordinators) transform fragmented needs assessments and baseline data into a transparent dashboard and a decision handoff packet.  Users upload CSV/XLSX files or choose sample data, profile the datasets for completeness and potential join keys, select a decision template, harmonize and join datasets, review quality checks and AI‑assisted recommendations, generate visual summaries and evidence‑coverage charts, and export a PDF/CSV handoff.  The tool emphasises human control: it shows caveats and limitations, requires human review before readiness decisions, and offers a deterministic fallback when AI is disabled or unavailable.  Inputs are small, non‑sensitive tabular datasets; outputs are dashboard charts, quality assessments, and a narrative handoff packet.  The system explicitly prohibits automatically approving operational decisions and forbids sending full uploaded rows to language models.  The biggest current limitation is that only a narrow set of decision templates and data transformations are supported, and there is no persistent storage or user accounts.  The next build step should focus on tightening safety gates and expanding test coverage while keeping the workflow narrow and session‑only.

# Current State

## 2.1 Product purpose

The README states that the project is a “recommendation‑first prototype for turning humanitarian and disaster response data into transparent dashboards”【495908327147395†L0-L7】.  It is intended to help practitioners analyse fragmented assessment and baseline data and generate a decision‑support dashboard and export package.  The `digital‑public‑good guide` reiterates that the tool supports evidence‑based decisions by guiding users through uploading, profiling, harmonising and visualising data【870537224859351†L31-L43】.  It emphasises that AI is optional and must never be presented as final authority【870537224859351†L275-L286】.

## 2.2 Primary user and workflow

**Primary user:** humanitarian analyst or disaster‑response decision maker.

**Current workflow:** The showcase script and UI components describe an eight‑step process:

1. **Select decision template.**  The decision brief step asks users to select a template (e.g., “Targeting cash‑transfer assistance”), input the question, scope and timeframe, and view a map of decisions【979493473549063†L540-L639】.
2. **Upload datasets or load samples.**  Users can upload CSV/XLSX files up to `MAX_UPLOAD_SIZE_MB` specified in `lib/config.ts`【462202322016731†L0-L31】; the UI warns against uploading sensitive data【979493473549063†L540-L639】.  Sample datasets (e.g., needs assessment, population baseline) are provided in `public/samples`【245105960618369†L0-L9】.
3. **Profile datasets.**  The `profileDataset` function computes row counts, potential join and metric fields, missing values, and descriptive statistics【547079202420314†L68-L132】.  Users review evidence‑coverage maps and quality panels in the `ProfileStep` component.
4. **Request recommendations.**  The app calls the `/api/recommend` route, which rate‑limits requests, parses the workflow context, generates deterministic fallback join and cleaning recommendations, and optionally calls an LLM provider for structured recommendations【608848569309702†L24-L119】.  The fallback includes recommended path, join plans and cleaning suggestions.
5. **Harmonize and join.**  The `harmonization.ts` module applies deterministic join recommendations to merge datasets【94858448378138†L75-L152】; users can adjust join keys and review quality indicators.
6. **Validate readiness.**  The `validation.ts` module checks for duplicates, missing values, type inconsistencies, incomplete joins and outliers【126946022174373†L5-L70】.  Readiness results are represented by `DecisionReadinessResult` with statuses `ready`, `review_needed` or `decision_unsafe`【255302827140699†L48-L61】.
7. **Generate dashboard.**  Deterministic dashboard recommendations and insights are generated via `dashboardRecommendations.ts` and `dashboardInsights.ts`【311199446549166†L17-L56】【517223684016413†L51-L118】.  Visualisations follow policies enforced by `vizPolicy` and `vizSpecValidator` (tested in `dataPipeline.test.ts`).
8. **Export handoff.**  Users can export a CSV (neutralising formulas)【872279692765675†L0-L14】 and a PDF with charts, metadata and quality summary【738272690855951†L0-L196】.  The `workflowExport.ts` module builds a decision handoff packet summarising readiness, datasets, join plan, quality issues, transformations and limitations【32940210372911†L34-L45】.  An optional copilot route summarises the handoff in natural language but defaults to a deterministic fallback when AI is disabled【949011173729498†L18-L78】.

**Input path:** small CSV/XLSX files or provided samples; full rows of uploaded data never leave the browser.

**Output path:** interactive dashboard, PDF/CSV export, and an optional AI‑generated narrative summary.  All outputs include caveats and require human review.

**Decision supported:** targeted assistance (cash transfer) or similar humanitarian allocations.

**Review/approval point:** after the readiness check, the app marks decisions as `review_needed` or `decision_unsafe` and emphasises human review【255302827140699†L48-L61】.  The export includes caveats and limitations【32940210372911†L34-L45】.

**What should not be automated:** approval of decisions, live data pipelines, user authentication, and storage are explicitly out of scope【870537224859351†L84-L93】.  The app must never send full uploaded rows to AI models【870537224859351†L84-L93】.

## 2.3 Application architecture

- **Framework:** Next.js (React, TypeScript).  `package.json` lists `next` and `react` dependencies【416350828965194†L5-L24】.
- **Runtime assumptions:** Node 26.1.0 (`.tool-versions`), Next.js 15, `vite`/Vitest for tests.  Serverless functions (`app/api/...`) enforce `POST` with JSON and `no-store` caching.
- **Main entry points:** `app/page.tsx` orchestrates the entire workflow: state management, file parsing, AI calls, join operations and UI transitions.
- **Major UI components:** `components/WorkflowComponents.tsx` defines step indicators, notice banners, upload forms, profile panels, harmonization controls, quality panels, dashboard view and export actions【979493473549063†L540-L639】.
- **Major library modules:** `lib/fileParsers.ts` (CSV/XLSX parsing, type/size checks); `lib/profiling.ts` (dataset profiling); `lib/harmonization.ts` (join operations); `lib/cleaningTransforms.ts` (allowed transforms and recommendations); `lib/validation.ts` (quality checks); `lib/dashboardRecommendations.ts` and `lib/dashboardInsights.ts` (chart recommendations and insights); `lib/recommendationSchema.ts` (context parsing and sanitisation); `lib/llmClient.ts` (LLM calls and fallback handling); `lib/copilotHandoff.ts` (handoff summary and sanitisation); `lib/apiSecurity.ts` (rate limiting); `lib/exportCsv.ts` and `lib/exportPdf.ts` (exports); `lib/workflowExport.ts` (handoff packet).  Many modules emphasise deterministic fallback and limit AI exposure.
- **API routes:** `/api/recommend` for structured recommendations【608848569309702†L24-L119】; `/api/copilot` for narrative handoff summaries【949011173729498†L18-L78】; `/api/recommend/status` to report AI configuration【366292618864720†L0-L13】.
- **Export flow:** The `exportCsv` module escapes formulas before saving【872279692765675†L0-L14】.  The `exportPdf` module uses `html2canvas` and `jsPDF` to generate a PDF with metadata and a quality summary【738272690855951†L0-L196】.
- **Sample data flow:** Datasets in `public/samples` and `data/samples` provide synthetic needs assessments, population baselines, quality risk examples, and service capacity metrics【245105960618369†L0-L9】【691031487461172†L0-L4】.
- **Configuration files:** `lib/config.ts` defines maximum upload size, supported file types and workflow steps【462202322016731†L0-L31】.  `.env.example` lists environment variables for enabling AI, setting rate limits and timeouts【495908327147395†L40-L71】.
- **Test structure:** `tests/dataPipeline.test.ts` uses Vitest to test parsing, profiling, join recommendations, quality checks, fallback vs AI recommendations, sanitisation, visualization policy enforcement and export language【547079202420314†L68-L132】.

## 2.4 Data flow

1. **Template selection:** Users choose a decision template; the app sets `decisionBrief` with fields from `types/decision.ts` and fetches a suggested data collection template from `decisionContext.ts`【309457591376847†L15-L27】.
2. **Upload/sample data:** The `fileParsers` module parses CSV/XLSX files, enforcing type and size limits and rejecting unsupported files【858432995900895†L64-L112】.  Sample datasets are loaded directly from the browser.
3. **Parsing & profiling:** For each dataset, `profiling.ts` counts rows, identifies potential join fields and metrics, computes missing counts and descriptive stats【21096817986601†L14-L44】.  Profiles are stored client‑side.
4. **Evidence coverage:** `decisionContext.ts` compares dataset columns to the decision’s evidence fields and computes coverage, missing metrics and duplication flags.
5. **Harmonization/join recommendation:** The recommendation API returns join plans, cleaning recommendations and quality concerns.  `applyJoinRecommendation` merges datasets using `harmonization.ts`【94858448378138†L75-L152】, and `cleaningTransforms.ts` enumerates allowed transforms and suggests them【729825134052315†L0-L9】【729825134052315†L24-L97】.
6. **Cleaning/preparation:** Users can rename fields, apply transforms (trim, uppercase, parse numbers/dates, etc.), remove duplicates and filter values.  The transformation log is stored session‑locally and included in the export.
7. **Readiness check:** `validation.ts` performs quality checks (duplicates, missing values, join completeness, type inconsistencies, outliers), returning `QualityCheckResult` objects【126946022174373†L5-L70】.  The readiness status is computed with `DecisionReadinessResult`【255302827140699†L48-L61】.
8. **Dashboard recommendation & insight generation:** `dashboardRecommendations.ts` produces chart recommendations based on field types and metrics【311199446549166†L17-L56】.  `dashboardInsights.ts` computes summary facts (row count, population share, etc.)【517223684016413†L51-L118】.  Visualisations follow a policy that restricts chart types and sorting (tested by `dataPipeline.test.ts`).
9. **Export/handoff:** `exportCsv` and `exportPdf` build CSV and PDF outputs.  `workflowExport.ts` builds the final handoff packet summarising readiness, transformations and caveats【32940210372911†L34-L45】.  The `copilot` API optionally synthesises a narrative summary but ensures no raw rows are sent and merges with fallback【949011173729498†L18-L78】.

Client‑side state is stored within the React component.  Data does not persist on the server; server routes only handle AI calls and export generation.  Raw uploaded rows remain client‑side; only minimal context (metadata counts and field names) is sent to server/AI【870537224859351†L84-L93】.

## 2.5 AI usage

AI is optional and used for two purposes:

- **Structured recommendations:** The `/api/recommend` route may call `requestStructuredRecommendations` in `lib/llmClient.ts` to obtain join plans, cleaning suggestions and dashboard recommendations.  When AI is disabled or fails, deterministic fallback recommendations are returned【608848569309702†L24-L119】.  The `recommendationSchema` sanitises AI responses and enforces limits (e.g., maximum number of charts, character lengths)【622449867211030†L16-L35】【622449867211030†L77-L123】.

- **Narrative copilot summary:** The `/api/copilot` route may call `requestDecisionHandoffSummary`, providing a narrative of readiness and repair actions.  `copilotHandoff.ts` sanitises AI output and merges it with deterministic fallback; raw uploaded rows are never sent【895793204348803†L20-L68】【895793204348803†L75-L113】.

Data sent to AI includes only aggregated metadata: decision brief fields, dataset profiles (counts, field names), join plan and quality summary.  Full rows or sensitive information are explicitly excluded【870537224859351†L84-L93】.  Deterministic fallback always returns if AI fails, times out, or returns invalid output.  Rate limiting prevents abuse【356247010359305†L16-L56】; environment variables control `LLM_ENABLED`, `LLM_PROVIDER`, `LLM_TIMEOUT_MS`, etc.【495908327147395†L40-L71】.

## 2.6 Safety and governance

The repository emphasises privacy and safety:

- **Privacy boundaries:** Users are warned not to upload sensitive data【979493473549063†L540-L639】.  Full uploaded rows never leave the browser; only metadata is sent to server/AI【870537224859351†L84-L93】.
- **Session‑only operation:** There is no authentication, persistence or background jobs.  Data is stored in memory and lost on refresh.
- **API key handling:** LLM API keys are read from environment variables on the server; clients never send or see keys.  The `/api/recommend/status` route reveals only whether AI is enabled and key presence【366292618864720†L0-L13】.
- **Rate limits:** `apiSecurity.ts` implements per‑client IP hashing and request count limits with configurable window and maximum requests【356247010359305†L16-L56】.  Exceeding the limit returns `429`.
- **Upload limits:** `lib/config.ts` sets `MAX_UPLOAD_SIZE_MB` and supported types【462202322016731†L0-L31】.
- **Formula injection protection:** `exportCsv` escapes any cell that begins with `=`, `+`, `-` or `@` to prevent spreadsheet injections【872279692765675†L0-L14】.
- **Human review gates:** The decision readiness result states whether a decision is `ready`, `review_needed` or `decision_unsafe`【255302827140699†L48-L61】, and the workflow emphasises caveats and human approval.  The export includes a review notice and limitations【32940210372911†L34-L45】.
- **Visualization safety:** The `vizPolicy` and `vizSpecValidator` ensure charts follow specified policy (e.g., no misleading sorts); tests enforce this.

## 2.7 Testing and quality gates

- **Test framework:** Vitest with `jsdom` environment.  Only one test file `tests/dataPipeline.test.ts` but it is comprehensive.  It tests parsing and profiling (row count, join/metric detection, missing values), join recommendations, cleaning transforms, quality checks, AI fallback and sanitisation, viz spec policy and export language【547079202420314†L68-L132】.
- **Coverage:** The tests cover critical pipeline logic and fallback behaviour; they verify that invalid AI responses are ignored and deterministic results prevail.  They also test formula neutralization in exports and ensure charts comply with spec.  There is no automated testing for the React UI, accessibility or cross‑browser behaviour.  Only one dataset is used; more diverse data would improve coverage.
- **Lint/build status:** `npm run lint` uses ESLint and Prettier; `npm run test` runs Vitest; `npm run build` builds a static site.  Build and test commands are expected to pass.  There is no CI configuration within the repository (CI may be external).

## 2.8 Documentation state

- **README:** Provides project description, installation commands (`npm ci`, `npm run dev`), environment variables, and lists sample data and docs【495908327147395†L0-L7】【495908327147395†L59-L65】.  It warns that the prototype is session‑only and emphasises deterministic fallback and safety【495908327147395†L71-L79】【495908327147395†L82-L89】.
- **Digital public good guide:** Detailed plain‑English guide explaining the decision‑first workflow, AI usage, in‑scope/out‑of‑scope features, technical details, cleaning transformations, privacy boundaries and extension checklist【870537224859351†L31-L43】【870537224859351†L84-L93】【870537224859351†L192-L205】【870537224859351†L224-L234】【870537224859351†L275-L286】.
- **Codex starter prompts:** Suggest tasks for extending the project (adding new decision templates, creating sample data, improving export handoff, etc.)【430566924010026†L5-L78】.
- **Showcase script:** Offers a 3‑minute demo path emphasising key messages (decision‑first, evidence coverage, human review, caveats)【44833350277835†L9-L33】.
- **Copilot docs and context:** `codex_handoff/README.md` instructs how to use codex handoff packages, lists expected results, and enumerates review gates (lint, test, build, smoke test, secrets scan, human approval)【68440333120112†L21-L31】【68440333120112†L49-L57】.
- **Others:** Comments in `types` and `lib` modules provide inline documentation.  There is no high‑level architecture diagram or user manual beyond the digital guide.  Documentation is consistent with the code and emphasises privacy and fallback.

# 3. Target State Inferred From Docs

## 3.1 Product target state

Based on the README and digital guide, the intended product is a decision‑support dashboard that enables humanitarian analysts to evaluate whether a cash‑transfer assistance decision is supported by sufficient evidence and to summarise the decision context for handoff.  The target system remains session‑only and intentionally narrow: it supports a small set of decision templates, uses synthetic or public data, and emphasises human review.  It should generate deterministic dashboard recommendations and provide optional AI suggestions for harmonisation and narrative summaries, but these must never override the deterministic fallback【870537224859351†L84-L93】【870537224859351†L275-L286】.  There is no plan for persistent storage, user accounts, live pipelines or operational approval【870537224859351†L84-L93】.  The target state is therefore a polished prototype focusing on transparency, safety and reproducibility rather than a production platform.

## 3.2 Workflow target state

A v1/vNext workflow derived from the docs would look like this:

1. **User** selects the cash‑transfer assistance template.
2. **Upload** one needs assessment CSV and one population baseline CSV (provided as samples).  Provide optional synthetic quality‑risk sample to test edge cases.
3. **Profile** datasets; view evidence coverage map and quality panel.  Accept or adjust join recommendations (deterministic suggestions suffice).  Apply minimal cleaning transforms (trim whitespace, parse numbers).
4. **Validate readiness** using quality checks; only proceed if readiness is `review_needed` (should always require human review).  The tool must never automatically mark a decision as ready for implementation.
5. **Generate dashboard** with recommended charts (bar charts for needs vs population share; no pie charts or misleading sorts), and summarise insights.
6. **Export handoff** as PDF and CSV; include caveats, quality summary, transformation log and recommendations.  Optionally call copilot to generate narrative summary; AI suggestions should be merged with fallback, and raw data must not be sent.
7. **Review/safety gate:** A human approves or rejects the decision.  The system should not allow final submission; it only provides evidence and context.
8. **Test cases:** The workflow should be tested with good data, missing evidence, invalid AI responses, oversized upload, unsupported file type, and ensure no sensitive information is sent.

## 3.3 Technical target state

The target architecture should continue using Next.js, React and TypeScript.  Key goals:

- **Keep deterministic logic in `lib/`**; AI calls remain optional and server‑side only.  Do not embed API calls in client components.  Ensure `recommendationSchema` and `copilotHandoff` sanitise AI responses, enforcing length limits and permissible fields【622449867211030†L16-L35】【895793204348803†L75-L113】.
- **Preserve session‑only operation:** No database, auth or persistence.  All data remains in browser; serverless routes only handle AI calls, rate limiting and export generation【870537224859351†L84-L93】.
- **Maintain deterministic fallback:** When AI fails, times out or is disabled, fallback join plans, cleaning recommendations, dashboard recommendations and copilot narratives must be returned【898959525671636†L128-L195】.
- **Tests:** Use Vitest to cover deterministic logic.  Add tests for new templates, transforms, and visualisation policies.  Avoid end‑to‑end UI tests unless necessary; rely on manual smoke tests.

## 3.4 Documentation target state

Docs should include:

- **Current state report:** summarises existing implementation (this document).
- **Target state report:** describes intended scope, workflow and safety posture (this section).
- **Practitioner demo guide:** step‑by‑step instructions to follow the workflow; may reuse the showcase script.
- **Safety/privacy note:** explains what data is allowed, why AI is optional, and outlines privacy boundaries.
- **Test evidence:** summarises test cases and results.
- **Codex handoff tasks:** enumerated tasks for adding features or fixing bugs【430566924010026†L5-L78】.
- **Known limitations:** list out‑of‑scope features (no auth, no persistence, etc.).
- **Next‑step recommendation:** highlight the most impactful improvements.

## 3.5 Safety target state

The safety posture for vNext should continue to enforce:

- **Human review required** for any decision; readiness statuses remain `review_needed` or `decision_unsafe`【255302827140699†L48-L61】.
- **Visible caveats** in dashboard, summary and exports; AI narratives must emphasise limitations【32940210372911†L34-L45】.
- **AI cannot determine final readiness**; deterministic logic remains authoritative【870537224859351†L275-L286】.
- **No raw rows sent to LLM**; only aggregated metadata and summaries【870537224859351†L84-L93】.
- **No automatic operational approval, no hidden persistence, no live pipelines**【870537224859351†L84-L93】.
- **Rate limits and timeouts** remain configured; environment variables define AI provider and model.
- **Extend cleaning transform list cautiously**; maintain whitelist of safe operations.

# 4. Gap Analysis

| Area | Current State | Target State | Gap | Severity | Evidence | Recommended Action | Test/Validation Needed |
|---|---|---|---|---|---|---|---|
| **Practitioner workflow clarity** | Workflow exists across multiple components, but documentation is dispersed.  Only one decision template is provided. | A clear, single workflow with step‑by‑step instructions and a dedicated demo story. | UI may confuse first‑time users; decision mapping step could be misused; no central demo guide. | Medium | Showcase script【44833350277835†L9-L33】 and digital guide【870537224859351†L31-L43】. | Write a practitioner demo guide consolidating workflow; limit templates to one story; add help tooltips in UI. | Manual testing with new users to validate clarity. |
| **Decision template coverage** | Only cash‑transfer assistance template with hard‑coded evidence fields【309457591376847†L15-L27】. | Possibly additional templates (e.g., service capacity planning) as per codex prompts. | Very limited templates; cannot adapt to other use cases. | Low | `decisionContext.ts` shows one template【309457591376847†L15-L27】. | Add one or two additional templates as separate tasks; ensure evidence fields align with sample data. | Add tests for each new template; verify profiling and evidence coverage. |
| **Sample datasets** | A few synthetic samples (needs assessment, population baseline, quality risk, service capacity)【245105960618369†L0-L9】【691031487461172†L0-L4】. | Enough sample data to illustrate all templates, with clear documentation. | Some samples have limited columns; more diversity needed; no dataset for cross‑sector decisions. | Low | Sample CSV lines【245105960618369†L0-L9】【691031487461172†L0-L4】. | Create additional synthetic datasets covering different scenarios (e.g., infrastructure damage, service capacity). | Test new datasets for profiling, join and visualization coverage. |
| **Data quality/readiness checks** | `validation.ts` covers duplicates, missing values, join completeness, type inconsistency, outliers【126946022174373†L5-L70】. | Additional checks like range validation, category whitelists, geospatial coverage. | Coverage is good but could be expanded; no geospatial boundary checks. | Medium | Tests in `dataPipeline.test.ts` verify current checks【547079202420314†L68-L132】. | Add range and category validation functions; integrate geospatial boundary coverage using synthetic geojson; extend tests. | New tests verifying out‑of‑range values and invalid categories. |
| **AI fallback and validation** | Deterministic fallback always returned when AI fails; `recommendationSchema` and `copilotHandoff` sanitise responses【898959525671636†L128-L195】【895793204348803†L75-L113】. | Maintain fallback and strengthen detection of adversarial content; log fallback reasons for audit. | AI error handling is robust, but there is no auditing or user feedback on why fallback occurred. | Low | `llmClient.ts` fallback reasons【898959525671636†L128-L195】. | Surface fallback reason to users (without technical jargon); log for developers; add tests for invalid AI content. | Test injecting adversarial AI output and verify sanitisation; manual review of logs. |
| **Export/handoff package** | PDF and CSV exports include charts, metadata, quality summary and transformation log【738272690855951†L0-L196】; narrative summary optional【949011173729498†L18-L78】. | Ensure exports are self‑contained, accessible (alt text for charts), and include review notice and assumptions. | PDF may not include alt text or accessible elements; narrative summary may overstep by implying readiness. | Medium | `exportPdf.ts` content【738272690855951†L0-L196】; handoff packet description【32940210372911†L34-L45】. | Add alt text for charts and tables; ensure narrative summary emphasises review; include version and timestamp; check PDF accessibility. | Manual review of PDF exports; run accessibility tools. |
| **Visualization rules** | `vizPolicy` and `vizSpecValidator` enforce chart types and sorting; tests verify compliance (though code base64 encoded). | Ensure these policies remain transparent and documented; allow users to override with caution. | Current policy is opaque; users cannot see why a chart is recommended or not. | Low | Tests confirm enforcement; documentation minimal. | Document visualization policy in the guide; provide explanation when charts are disabled. | Add tests for user‑provided charts and error messages. |
| **Privacy and server‑side boundaries** | Data remains client‑side; only aggregated metadata is sent to server/AI【870537224859351†L84-L93】. | Maintain this boundary; ensure new features (e.g., geospatial overlays) do not leak sensitive info. | Potential risk if future expansions inadvertently send raw data. | High | Privacy guidance【870537224859351†L84-L93】. | Review any new API routes or features for data exposure; add automated checks for row‑level data. | Security test verifying no raw rows in network requests. |
| **Accessibility and UI testing** | No automated UI or accessibility testing; manual guidelines only. | Add smoke tests and a few accessibility checks (e.g., ARIA labels). | Without tests, UI regressions and accessibility issues may go unnoticed. | Medium | Not directly tested in repository. | Incorporate testing library (e.g., Playwright) for smoke tests; use axe-core for accessibility scanning. | Run automated tests on build; manual screen reader test. |
| **Documentation** | Good guides exist (digital public good guide, starter prompts, showcase script) but fragmented. | Consolidate docs into a single handbook; update regularly with limitations and privacy. | Lack of central place for practitioners; some docs might drift out of sync. | Low | Many docs referenced. | Combine README and guide into a single “user manual”; ensure codex handoff docs reflect current code; update extension checklist. | Review docs for consistency after changes. |
| **Demo readiness** | Works locally but not packaged for quick offline use; no container or site generator. | Provide compiled static site and a guided demo flow; include data. | Without packaging, new users may struggle to run demo; may run into Node version issues. | Low | README instructions【495908327147395†L59-L65】. | Provide a zipped build of the demo site; create a script to load sample data; update codex handoff with instructions. | Test running site in different OS; ensure sample data loads. |
| **Reuse as a digital public good** | The digital guide emphasises open‑source reuse and extension【870537224859351†L192-L205】. | Provide clear license, contribution guidelines, and extension checklist. | The repository is MIT‑licensed but there is no contributing guide; extension checklist exists in guide. | Low | Public good guide. | Add `CONTRIBUTING.md`; list extension steps (decision templates, transforms). | Manual review. |

# 5. Recommended Target Scope

## Recommended vNext

- **User:** Humanitarian analyst evaluating cash‑transfer assistance for a set of districts.
- **Workflow:** The user uploads two small synthetic datasets (needs assessment and population baseline), profiles them, reviews deterministic join and cleaning recommendations, performs a simple join, validates readiness, generates recommended charts and insights, and exports a PDF/CSV handoff with narrative summary.  The user then reviews the evidence and caveats before passing to a supervisor.
- **Input:** CSV or XLSX files containing non‑sensitive needs assessment data (district, priority need, severity, response gap, etc.) and population data (district, population counts).  Files should be <10 MB and follow sample column conventions.  Additional optional dataset for quality risk (to test negative/outlier values).
- **Output:** Dashboard with bar charts comparing needs severity to population share; quality summary highlighting missing values or outliers; readiness status always `review_needed`; PDF and CSV export containing charts, metadata, transformation log, and caveats; optional narrative summary emphasising limitations.
- **Decision:** Whether to target cash‑transfer assistance to districts with high severity and response gaps relative to population.  The tool helps to identify priority districts but defers approval to human judgement.
- **Safety gate:** Always require human review before acting; no automatic submission or approval.  Narrative summary includes explicit caveats; readiness status never `ready` without review.
- **What to mock:** For demonstration, AI calls can be mocked or disabled by setting `LLM_ENABLED=false`.  Use the deterministic fallback.  Geospatial overlays may be simulated using synthetic boundaries.  Do not include real personal data.
- **What to build:** Additional cleaning transforms (e.g., range validation, category whitelists), alt text for charts, geospatial boundary coverage; improved documentation; additional test cases.  Possibly add one more decision template (e.g., service capacity allocation) with corresponding sample data.
- **What not to build:** Do not implement user accounts, persistent storage, live data ingestion, automatic approval, or direct communications (emails/alerts).  Do not connect to external data sources.  Do not send raw data to LLMs.  Avoid expanding into a generic BI platform.

# 6. Build / Documentation Backlog

## P0 — must fix before credible handoff

| Item | User Value | Files Likely Touched | Acceptance Criteria | Validation Command | Risk if Skipped |
|---|---|---|---|---|---|
| **Add alt text and accessibility improvements to PDF export** | Ensures dashboard is accessible to visually impaired reviewers | `lib/exportPdf.ts` | PDF includes alt text for charts; ensure headings and tables are tagged for screen readers | Manual review; run PDF accessibility checker | Exclusion of users; potential public good non‑compliance |
| **Surface fallback reason to users** | Helps users understand why AI suggestions are missing; promotes transparency | `lib/llmClient.ts`, `components/WorkflowComponents.tsx` | UI displays a notice when AI fallback is used, with non‑technical explanation | Run `npm run dev`; trigger LLM failure; confirm message shown | Users may misinterpret missing suggestions as bug |
| **Add range and category validation** | Improves data quality checks; flags impossible values early | `lib/validation.ts`, tests | Quality checks include range (e.g., negative counts) and category whitelist; tests cover new checks | `npm run test` | Wrong data might go unnoticed |
| **Enhance documentation with consolidated user guide** | Guides practitioners through workflow and safety; reduces misuse | `README.md`, `docs/` | A single comprehensive guide covering workflow, safety boundaries, sample data and extension steps | Review new guide; confirm no sensitive information | Users may upload sensitive data or misuse AI |
| **Add smoke test for UI** | Detects high‑level regressions in build/static site | `tests/` (new), maybe `playwright` config | Simple script loads the built site, uploads sample data, walks through steps and asserts key UI elements exist | Run `npx playwright test` or manual; ensure test passes | UI breakages may go unnoticed |

## P1 — high‑leverage next improvements

| Item | User Value | Files Likely Touched | Acceptance Criteria | Validation Command | Risk if Skipped |
|---|---|---|---|---|---|
| **Add one new decision template (e.g., service capacity allocation)** | Allows reuse beyond cash transfers; demonstrates extensibility | `lib/decisionContext.ts`, `types/decision.ts`, sample data | New template available in UI; evidence fields defined; sample data provided; tests added | `npm run test`; manual run with sample data | Limited demonstration of tool’s flexibility |
| **Provide synthetic geojson boundaries and map overlay** | Helps visualise districts; improves evidence coverage mapping | `public/samples/admin_boundaries_synthetic.geojson`, UI map component | Map overlay displays boundaries with data overlay; does not send raw data to server | Manual; confirm no API calls send coordinates | Mapless UI reduces spatial understanding |
| **Implement category whitelist and additional cleaning transforms** | Encourages consistent categories; reduces manual cleaning | `lib/cleaningTransforms.ts`, UI | Users can define allowed values for certain fields; warnings show invalid categories | Manual test; new test case in Vitest | Data quality may suffer |
| **Create CONTRIBUDING.md and update license** | Facilitates open‑source reuse and contributions | Root docs | File exists with guidelines; license explicitly clarified; digital public good checklist referenced | Review file | Contributors may be discouraged or unclear on rules |

## P2 — later enhancements

| Item | User Value | Files Likely Touched | Acceptance Criteria | Validation Command | Risk if Skipped |
|---|---|---|---|---|---|
| **Integrate simple geospatial analytics (e.g., centroid distribution)** | Adds insights about spatial clustering | `lib/dashboardInsights.ts` | Additional insight appears in summary; does not leak coordinates; tests cover calculation | Manual; updated tests | Minimal; not critical |
| **Add localization/i18n support** | Enables non‑English practitioners to use the tool | UI components, translation files | UI text extracted to locale files; at least two languages supported | Manual; test switching locale | May limit adoption in non‑English contexts |
| **Automate codex handoff zip creation** | Simplifies building codex packages for tasks | `scripts/` | Script generates zipped static site with context and tasks; documented in README | Run script; confirm zip includes tasks and context | Manual assembly will continue |

# 7. Codex‑Ready Handoff Tasks

1. **Add Range and Category Validation**
   - **Objective:** Expand quality checks to flag values outside specified numeric ranges and categories.
   - **Context:** Read `lib/validation.ts` and `types/quality.ts` to understand existing checks.  Review tests in `tests/dataPipeline.test.ts` for current coverage.
   - **Files to modify:** `lib/validation.ts`, `types/quality.ts`, possibly UI components to surface messages.  Add new tests in `tests/dataPipeline.test.ts`.
   - **Constraints:** Maintain session‑only operation; do not send raw data to AI; keep tests deterministic.
   - **Fixtures:** Use synthetic dataset with negative counts and invalid categories (e.g., needs severity outside 1–5).  Use existing quality‑risk sample as baseline【92359283574754†L0-L3】.
   - **Acceptance criteria:** New validation functions detect out‑of‑range numeric values and disallowed categories; readiness status downgraded to `review_needed`; new tests pass.
   - **Validation command:** Run `npm run test` and ensure tests pass without regression.
   - **Expected response format:** Provide updated code for `validation.ts`, updated tests, and description of changes.

2. **Implement Alt Text for PDF Export**
   - **Objective:** Make exported PDF charts accessible to screen readers by adding alt text and table descriptions.
   - **Context:** Review `lib/exportPdf.ts` for current PDF generation logic and `lib/dashboardInsights.ts` for insights text【738272690855951†L0-L196】.
   - **Files to modify:** `lib/exportPdf.ts`, possibly `lib/chartMetrics.ts` to generate labels.
   - **Constraints:** Do not change underlying chart generation; alt text should describe the chart (e.g., “Bar chart showing needs severity per district”).  Use available metadata and chart recommendations.
   - **Acceptance criteria:** Generated PDF includes alt text tags for each chart; alt text derived from chart title and axes.  Manual review or PDF accessibility checker confirms presence.  Existing tests pass.
   - **Validation command:** Build the site (`npm run build`), generate a PDF via UI, and inspect alt tags; run tests.
   - **Expected response format:** Updated code for PDF export and description of alt text generation.

3. **Consolidate User Guide**
   - **Objective:** Merge README and digital public good guide into a single practitioner‑facing manual.
   - **Context:** Read `README.md`, `docs/digital-public-good-guide.md`, `docs/showcase-script.md`, and `codex_handoff/README.md`【870537224859351†L31-L43】【68440333120112†L21-L31】.
   - **Files to create/modify:** Create `docs/user-guide.md` or update `README.md`.  Keep README concise and link to the guide.  Update navigation in `docs`.
   - **Constraints:** Do not remove licensing information; ensure the guide clearly states privacy boundaries and limitations.  Keep language plain and accessible.
   - **Acceptance criteria:** A single user guide exists with all necessary sections (installation, workflow, sample data, safety warnings, troubleshooting).  README references it.  No duplication of outdated text.
   - **Validation command:** Manual review; confirm that all key points from old docs are present; run `npm run lint` to ensure markdown lint passes.
   - **Expected response format:** New or updated Markdown file(s) and explanation of updates.

4. **Add New Decision Template for Service Capacity**
   - **Objective:** Expand the prototype to support a service capacity allocation decision template.
   - **Context:** Examine existing `useCaseTemplates` in `lib/decisionContext.ts`【309457591376847†L15-L27】 and sample data like `demo_service_capacity.csv`【623229342797802†L0-L4】.
   - **Files to modify:** `lib/decisionContext.ts`, `types/decision.ts` (add template enumeration), UI components to list the new template, sample data documentation.
   - **Constraints:** Template should have clearly defined evidence fields (e.g., number of health facilities, evacuation centers, staff capacity).  Do not expand scope beyond one new template.  Must maintain deterministic fallback and safety guidelines.
   - **Acceptance criteria:** The new template appears in the decision dropdown; when selected with appropriate sample data, evidence coverage and readiness logic work; tests added for new template; docs updated to mention the new template.
   - **Validation command:** Run `npm run test` and manually run site selecting new template and sample data.
   - **Expected response format:** Updated code, new tests, and documentation updates.

5. **UI Smoke Test with Playwright**
   - **Objective:** Add an automated smoke test to ensure the main workflow functions after builds.
   - **Context:** The repository currently lacks UI tests.  Use Playwright or similar to run headless tests.  Basic flow: load site, upload sample datasets, accept recommendations, run quality checks, export PDF.
   - **Files to create/modify:** Add `tests/ui-smoke.spec.ts` using Playwright (likely as a separate dev dependency); update `package.json` scripts to run UI tests; add CI instructions.
   - **Constraints:** Keep test quick (<1 minute); run only on built site; do not rely on network calls to AI (disable LLM).  Use provided sample data.
   - **Acceptance criteria:** `npm run test:ui` or similar script runs the smoke test and passes; test fails if UI elements missing or steps break; does not send raw data to server.
   - **Validation command:** Run `npm run test:ui` after building the site.
   - **Expected response format:** New test file, script updates, and description of test steps.

# 8. Test Plan

Below are proposed test cases for the current and target workflow.  Each test can be automated where feasible; others require manual execution.

| Test Name | Input | Steps | Expected Result | Safety Condition Checked | Relevant Modules | Manual/Automated |
|---|---|---|---|---|---|---|
| **Good Data Flow** | `needs_assessment.csv`【245105960618369†L0-L9】 and `population.csv`【691031487461172†L0-L4】 | Upload both datasets; accept deterministic join; apply trimming transform; run validation; generate dashboard; export. | Readiness status = review_needed; charts show needs vs population; PDF and CSV export succeed; no AI required. | Data never leaves browser; no formulas injected; user sees caveats. | `fileParsers.ts`, `profiling.ts`, `harmonization.ts`, `validation.ts`, `dashboardRecommendations.ts`, `exportPdf.ts` | Automated (Vitest for logic; UI smoke test). |
| **Risky Quality Sample** | `demo_quality_risk.csv` with negative and duplicate values【92359283574754†L0-L3】 | Upload dataset; run profiling and validation. | Quality check flags duplicates, negative values; readiness = decision_unsafe; chart recommendations reflect anomalies; export includes warning. | Negative values flagged; duplicates identified; readiness downgraded. | `validation.ts`, `dashboardInsights.ts` | Automated tests for logic; manual UI check for warnings. |
| **AI Disabled Fallback** | `LLM_ENABLED=false` in `.env`; sample datasets. | Run workflow and request recommendations and copilot summary. | Deterministic fallback used; join plan and narrative summary appear; UI displays fallback message; readiness unaffected. | No AI calls; fallback explanations visible. | `api/recommend`, `api/copilot`, `llmClient.ts` | Automated (Vitest for fallback logic); manual for UI message. |
| **Invalid Model Output Fallback** | Inject invalid response into `llmClient.ts` test harness. | Simulate AI returning unexpected fields; call recommendation API. | Sanitization discards invalid data; fallback used; error logged; UI unaffected. | Prevent malicious AI injection; maintain deterministic flow. | `recommendationSchema.ts`, `copilotHandoff.ts` | Automated (Unit test). |
| **Oversized Upload** | File > `MAX_UPLOAD_SIZE_MB` defined in config【462202322016731†L0-L31】. | Attempt to upload large CSV/XLSX file. | File rejected with error message; no network requests; user can upload smaller file. | Enforces upload limits; prevents memory exhaustion. | `fileParsers.ts`, UI components | Automated (Unit test). |
| **Unsupported File Type** | Upload `.txt` or `.json` file. | Attempt to upload. | File rejected with supported types message; user remains on upload step. | Ensures only CSV/XLSX accepted; avoids unexpected parsing. | `fileParsers.ts` | Automated. |
| **Missing Evidence** | Use datasets missing key evidence fields for the decision template (e.g., no severity column). | Upload dataset; view evidence coverage; attempt to proceed. | Evidence coverage shows missing fields; join recommendation may be impossible; readiness remains `review_needed` or `decision_unsafe`; user warned. | Prevent decisions without sufficient evidence; maintain caution. | `decisionContext.ts`, `profiling.ts` | Manual or automated (Unit test for coverage calculation). |
| **Unsafe Readiness Caveat** | Use dataset with extreme outliers; allow AI suggestions. | AI may suggest `ready` status; check fallback. | Deterministic readiness overrides AI; status remains `review_needed`; copilot summary emphasises caution. | AI cannot override safety; fallback ensures caution. | `llmClient.ts`, `copilotHandoff.ts` | Automated test (simulate AI ready suggestion). |
| **Export Contains Caveats** | Run full workflow and export PDF/CSV. | Open exported files. | Handoff packet contains readiness status, quality summary, caveats and assumptions; PDF includes alt text; CSV neutralises formulas; no hidden data. | Ensures transparency and safe export. | `exportPdf.ts`, `exportCsv.ts`, `workflowExport.ts` | Manual review and automated test for CSV neutralisation. |
| **No Full Row LLM Transmission** | Monitor network requests with AI enabled; upload dataset. | Check requests to `/api/recommend` and `/api/copilot`. | Payload contains only metadata (counts, field names, summary) and no raw rows. | Maintains privacy; prevents sensitive data leakage. | `llmClient.ts`, `recommendationSchema.ts` | Manual network inspection or automated test capturing request payload. |
| **Visualization Policy Enforcement** | Provide dataset with high variance; request dashboard. | Validate that charts adhere to policy (allowed types, sorting). | Charts follow bar/line types; no pie charts; sort by value not alphabetical; policy errors surfaced if violated. | Prevent misleading visualisations. | `vizPolicy.ts`, `vizSpecValidator.ts` | Automated test (existing tests cover, but add new dataset). |

# 9. Risks / Blind Spots

- **Product risks:** The prototype may be misinterpreted as an operational tool, leading to overreliance or bypassing critical human judgement.  Mitigation: repeatedly emphasise that outputs are advisory and require review; avoid labels like “ready” without qualification.

- **Safety risks:** If new features inadvertently send raw data to AI or store it server‑side, privacy boundaries could be breached.  Mitigation: maintain strict data flow rules, code review for any server communication, and automated tests verifying payload contents.

- **Data governance risks:** Users may upload personally identifiable information (PII) or sensitive data despite warnings.  Mitigation: reinforce warnings in UI and docs; consider adding file scanning to detect PII (but remain optional).  Provide sample data to discourage uploading real sensitive data.

- **Technical risks:** Lack of persistent storage and auth means data is lost on page reload; some users may expect state retention.  Mitigation: clearly communicate session‑only nature; consider optional local storage with explicit user consent (but keep out of scope for now).

- **Demo risks:** Without packaging and automated tests, new builds may break due to dependency updates or environment issues.  Mitigation: create pre‑compiled static build with pinned dependencies; run smoke tests regularly.

- **Documentation risks:** Fragmented docs may cause confusion; outdated docs might lead to misuse.  Mitigation: consolidate docs and maintain them with the code.  Include version and update dates.

- **Reuse/public‑good risks:** Without a clear contribution guide, external contributors may not adhere to safety constraints or may propose features that break privacy boundaries.  Mitigation: provide `CONTRIBUTING.md` and extension checklist; ensure maintainers review new PRs carefully.

# 10. Final Recommendation

**Product diagnosis:**  The `disaster‑dashboard‑webapp` is a well‑structured prototype that demonstrates how to turn fragmented humanitarian data into a transparent, recommendation‑first dashboard and handoff package, but it is intentionally narrow, session‑only, and requires human review.

**Target‑state recommendation:**  Maintain the prototype’s decision‑first, privacy‑preserving posture, expand it modestly by adding range/category validations, accessibility features and one more decision template, and consolidate documentation to improve user adoption without expanding into a full BI platform.

**Top 3 next actions:**  (1) Implement alt text and accessibility improvements in the PDF export and UI; (2) Add range/category validations and surface fallback reasons; (3) Consolidate documentation into a single user guide and provide a new decision template with sample data.

**What not to build next:**  Do not add user accounts, persistent storage, live operational pipelines or automated decision approval.  Do not expand into a generic analytics platform or integrate external data sources without rigorous safety review.  Avoid sending raw data to AI providers or scaling beyond session‑only scope until privacy and governance considerations are fully addressed.
