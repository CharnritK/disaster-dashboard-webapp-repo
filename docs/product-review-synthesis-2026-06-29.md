# Dashboard Copilot — Product Review Synthesis & Codex Roadmap

**Date:** 2026-06-29
**Inputs:** 3 independent digital-product inspections — Claude (source + server-rendered fetch), Gemini (local build + browser subagent, 178/178 tests passing), GPT‑5.5 Pro (public first-screen only, access-limited).
**Purpose:** One artifact that (1) distills the essence of each review, (2) triangulates them into prioritized findings, (3) combines them into a tiered roadmap, (4) breaks the roadmap into self-contained tasks for **Codex (GPT‑5.5 xhigh) + subagents**, and (5) specifies **unit tests in detail** per task against the existing Vitest harness.

> Method: thematic analysis + source triangulation. A finding's **confidence** rises with the number of independent reviewers that reached it *and* whether it was verified in source. Every code reference below was re-verified against the repo on 2026-06-29 (paths corrected where reviewers guessed).

---

## 0. Reviewer-vs-source corrections (read first)

Reviewers cited paths from memory; the real paths/facts are:

| Claim in reviews | Verified reality | Impact on tasks |
|---|---|---|
| `config.ts:11` `MAX_UPLOAD_SIZE_MB` default 1 | ✅ `lib/config.ts:11-15` — default **1**, env-overridable, min 0.1 | Task **D1** valid |
| Step‑5 label "Dataset" ambiguous | ✅ `components/WorkflowComponents.tsx:71` — `validate: "Dataset"` (step id is `validate`) | Task **A4** valid, trivial |
| `WorkflowComponents.tsx:4210` LandingHero | Component exists in same file (line nums drift) | Task **A1** valid |
| Demo can't upload / `forceDeterministic` | ✅ `components/DashboardCopilotApp.tsx:88,93,98-99,751,756` — `onFiles={demoMode ? undefined : addFiles}`, `sampleOnly={demoMode}` | Preserve; Task **B5** test |
| Feedback off in demo `enabled={aiApiAvailable}` | ✅ `components/DashboardCopilotApp.tsx:819` | Task **C2** valid |
| Login dead form "Supabase Auth is not configured" | ✅ `app/login/page.tsx:58,85`; redirect reason `auth_not_configured` at `lib/supabase/middleware.ts:16` | Task **C1** valid |
| Gemini: **admin emails hardcoded** in `lib/adminMetrics.ts` | ❌ **Outdated** — `lib/adminMetrics/index.ts:10-16` already reads `env.ADMIN_EMAILS` | Task **F3** = env→DB allowlist (a *prod hardening*, not a bug fix) |
| Readiness statuses | ✅ `ready` / `review_needed` / `decision_unsafe` in `lib/decisionContext.ts:723-724,789,867`; export uses them in `lib/workflowExport.ts:40`, `lib/copilotHandoff.ts:75-76,205-206` | Task **B1/B2** valid |
| Tests: `npm run test` → `vitest run`, node env, `tests/**/*.test.ts` | ✅ `package.json`, `vitest.config.ts` (env `node`, `fileParallelism:false`) | All test specs below target this harness |

**Harness note that drives test design:** Vitest runs in the **`node`** environment (no jsdom). So tasks that change pure logic/constants/API handlers get *unit* tests directly; tasks that change DOM behavior (focus trap, tablist keys, rendered copy) either (a) extract logic into pure helpers that can be unit-tested in node, or (b) require a **new jsdom test project** — called out explicitly in Task **D0**.

---

## 1. Essence of each review

### 1.1 Claude — "Strong enough for controlled beta with fixes"
- **Verdict:** Public `/demo` is safe to share *today*; safety is **engineered, not disclaimed** (no upload surface in demo, deterministic, audit-grade exports). Blockers to a *clean* beta are framing/trust polish, not safety failures.
- **Strongest signal:** The product's moat is *how it handles bad data* — evidence-coverage → readiness gating → caveated, "review not for action" exports. AI is correctly subordinate to deterministic checks.
- **Sharpest weaknesses:** (1) bare hero / no orientation; (2) **dead sign-in form** shown to users; (3) **no feedback/analytics loop** in demo (flying blind in the learning phase); (4) **readiness gate is acknowledge-to-proceed, not hard-stop** — a confident export from `decision_unsafe` data is "the core hazard"; (5) a11y unverified live (focus trap, tablist keys, contrast); (6) **1 MB** upload cap unrealistic for real 3W/HDX files.
- **Distinctive contributions:** the "engineered safety" framing; the hard-gate + watermark recommendation; 5 concrete copy rewrites; "should NOT build yet" list (no connectors / real-time / multi-user / action automation).

### 1.2 Gemini — "Strong enough for controlled beta with fixes" (verified interactively)
- **Verdict:** Local build is robust; **browser subagent completed the full flow on good *and* risky paths**; **178/178 tests pass**. Risky sample correctly flags negative `affected_population` (−45) and missing capacity, sets "Not safe for action yet", and **export buttons stay disabled until the acknowledgement checkbox is checked**.
- **Distinctive contributions (only Gemini, because it ran the app):**
  - Confirmed **export gating works** (checkbox-blocked downloads) — nuances Claude's "soft gate" concern: downloads *are* blocked, but *dashboard generation* upstream is not hard-stopped.
  - **Humanitarian-standards gap:** no **P‑code / COD** vocabulary in geography mapping → real join failures (e.g., `MDG01`, "Port-au-Prince" vs "Port au Prince").
  - **Stepper back-nav disabled** during first run (violates user-control heuristic).
  - Manual **column remapping** is rigid; no override when auto-detect is wrong.
  - **Lighthouse a11y 96/100**, but dark-mode **focus-ring contrast** is weak.
  - Concrete copy rewrites incl. "deterministic mode" jargon, "Upload files" → session-only label, Step‑5 → "Validate".

### 1.3 GPT‑5.5 Pro — "Inconclusive due to access limits"
- **Verdict:** Could only inspect the **public first screen** (no interactive flow, no devtools, no protected-route test). Explicitly says: do **not** treat as beta/prod-ready from this inspection.
- **Value despite limits:** independent confirmation of the *first-screen posture* (AI Off, 7-step flow, decision-first, "review packet / does not authorize operational action"). Grounds comments in **NN/g heuristics**, **WCAG 2.2**, and **OCHA humanitarian data responsibility**.
- **Distinctive contributions:** strongest push for a **"Run 3‑minute sample walkthrough" CTA + progressive disclosure** (dense first screen); insistence that **synthetic-sample-only** boundary be *visible* near upload/examples; "candidate dashboard" (not "answer") language; the methodological reminder that **claims must be verified live** (privacy/session-only, a11y) before production.

---

## 2. Triangulated findings (frequency × impact × confidence)

Frequency = # of the 3 reviews that raised it. Confidence = High (≥2 reviews **and/or** verified in source), Med, Low.

| # | Finding | Freq | Impact | Confidence | Verified anchor |
|---|---|---|---|---|---|
| F1 | **Hard-gate `decision_unsafe`** before dashboard generation + watermark "REVIEW ONLY" on PNG/PDF. Today only *export downloads* are checkbox-gated; generation is not blocked. | 2 (Claude, GPT) | **High** (core hazard) | High | `decisionContext.ts:867`, `workflowExport.ts:40`, `copilotHandoff.ts:205` |
| F2 | **Dead sign-in form** when auth unconfigured — disable + reword. | 2 (Claude, Gemini) | High (trust) | High | `app/login/page.tsx:58,85` |
| F3 | **No feedback/analytics loop in demo** (`enabled={aiApiAvailable}` ⇒ off); guest feedback 401s. | 2 (Claude, Gemini) | High (can't learn) | High | `DashboardCopilotApp.tsx:819` |
| F4 | **Bare hero / dense first screen** — add value prop + "controlled beta · synthetic sample data · not operational" strip + "Run sample" CTA + progressive disclosure. | 3 | High (activation) | High | `WorkflowComponents.tsx` LandingHero |
| F5 | **Step‑5 label "Dataset"** ambiguous → "Validate"/"Readiness". | 3 | Med (clarity) | High | `WorkflowComponents.tsx:71` |
| F6 | **AI copy conflict** — "turn on AI-assisted workflow" while toggle is Unavailable; hide inert toggle in demo, fix helper copy. | 3 | Med (looks broken) | High | `DashboardCopilotApp.tsx:1017`, `WorkflowComponents.tsx` |
| F7 | **A11y live-verify**: modal focus trap, APG tablist keyboard, dark-mode focus-ring contrast, axe pass, async `aria-live`. | 3 | High (public-sector) | Med→High | a11y inferred; Lighthouse 96 (Gemini) |
| F8 | **Upload cap 1 MB** unrealistic → raise (10–25 MB) + progress + row/col counts pre-commit (authed). | 2 (Claude, GPT) | High (authed) | High | `lib/config.ts:13` |
| F9 | **Session-only / synthetic-sample-only not restated in-flow** — persistent chip + near-upload copy. | 3 | Med (data responsibility) | High | demo copy gap |
| F10 | **"deterministic" jargon** in user copy → plain language. | 2 (Gemini, GPT) | Med | High | Step‑1 helper copy |
| F11 | **Step‑2 mismatch in demo**: titled "Upload Data" + "don't upload sensitive data" note, but no upload exists → retitle "Choose sample data", drop note. | 2 (Claude, Gemini) | Med | High | `UploadStep` demo branch |
| F12 | **P‑code / COD vocabulary** missing in geography hints/examples → join failures. | 1 (Gemini, strong) | High (domain) | Med | `lib/locationFields.ts`, geography hints |
| F13 | **Stepper back-nav disabled** on first run → allow clicking completed steps. | 1 (Gemini) | Med (control) | Med | `WorkflowComponents.tsx` stepper |
| F14 | **Manual column remap** missing when auto-detect is wrong. | 1 (Gemini) | Med | Med | profiling/mapping UI |
| F15 | **Join trust**: show matched/unmatched counts + unmatched-rows preview + reversibility before commit. | 3 | Med→High | Med | `lib/harmonization.ts`, recommend step |
| F16 | **Export hardening**: watermark, reviewer/sign-off fields, CSV audit-header metadata, "review artifact only" pre-export confirm. | 3 | Med | Med | `lib/workflowExport.ts`, `lib/exportCsv.ts`, `lib/exportPng.ts`, `lib/exportPdf.ts` |
| F17 | **Production gates**: configure auth, close `/progress` D1–D8, finalize retention, env→DB admin allowlist, privacy persistence tests. | 3 | High | High | `app/progress/page.tsx`, `docs/data-retention.md`, `tests/privacy-no-row-persistence.test.ts` |
| F18 | **`?error=auth_not_configured`** raw query param surfaced — intercept on login page with a clear block. | 1 (Gemini) | Low | High | `lib/supabase/middleware.ts:16`, `app/login/page.tsx` |
| F19 | **Local PII pre-scan** (regex for emails/phones in headers/values) before profiling, warn-only. | 1 (Gemini) | Med | Med | `lib/profiling.ts` / upload path |
| F20 | **Optional polish**: profile histograms/outlier tooltip, export thumbnail, district-name normalizer, richer error/retry, "How this works" guide. | 3 | Low→Med | Med | various |

**Priority matrix**

- **High freq + High impact (do first):** F4, F7, F15, F17 (+F1, F2, F3 at freq 2 but High impact/confidence).
- **High freq + Med impact:** F5, F6, F9, F16.
- **Low freq + High impact (segment-critical):** F1, F8, F12.
- **Low freq + Low/Med impact (note, schedule):** F13, F14, F18, F19, F20, F10, F11.

**Where reviews disagreed (signal, not noise):**
- *Soft vs hard gate.* Claude (source-only) read the readiness gate as too soft; Gemini (ran it) saw **export downloads are blocked** by the checkbox. Reconciliation: **downloads are gated; generation is not** → F1 closes the remaining gap (block/annotate generation + watermark artifacts), not "add a gate that doesn't exist."
- *Admin allowlist.* Gemini reported hardcoded emails; source shows **env-list** already. F3/F17 reframes this as **env→DB** hardening for prod scalability, not a security bug.
- *Beta readiness.* Gemini = ready-with-fixes (it completed the flow); GPT = inconclusive (couldn't). Reconciliation: flow **works**; the gap is the **learning loop + a11y proof + auth config**, which is exactly the controlled-beta tier below.

---

## 3. Combined roadmap (4 gates)

Each item maps to findings (F#) and to a task (§4). "Gate" = the milestone it unblocks.

### Gate 1 — Before sharing the demo widely (days)
- **A1** Hero value prop + persistent "controlled beta · synthetic sample data · not for operational action" strip *(F4)*
- **A2** "Run the 3‑minute sample walkthrough" CTA + progressive disclosure of dense caveats *(F4)*
- **A3** Fix AI copy conflict; hide inert AI toggle in demo, keep explanatory CTA *(F6)*
- **A4** Rename Step‑5 stepper label "Dataset" → "Validate" *(F5)*
- **A5** Step‑2 demo retitle "Choose sample data" + drop upload-only note; de-jargon "deterministic" *(F10, F11)*
- **A6** Persistent "Session-only · nothing is stored" chip + synthetic-sample-only copy near samples *(F9)*

### Gate 2 — Before controlled beta (1–2 weeks)
- **B1** Hard-gate `decision_unsafe`: per-blocker acknowledgement *before dashboard generation* *(F1)*
- **B2** Watermark PNG/PDF "REVIEW ONLY — UNSAFE EVIDENCE" when not `ready` *(F1, F16)*
- **C1** Disable + reword sign-in form when auth unconfigured; intercept `auth_not_configured` query *(F2, F18)*
- **C2** Demo feedback path + privacy-safe analytics (step reached, sample chosen, export type) *(F3)*
- **D0–D3** Accessibility pass: jsdom test project, modal focus trap, APG tablist keys, focus-ring contrast, async `aria-live` *(F7)*
- **E1** Join trust: matched/unmatched counts + unmatched-rows preview + reversibility *(F15)*
- **E2** Stepper back-nav to completed steps *(F13)*
- **E3** P‑code / COD vocabulary in geography hints + examples *(F12)*

### Gate 3 — Before production (weeks)
- **F1t** Configure Supabase auth; verify migrations; close `/progress` D1–D8; finalize retention policy *(F17)*
- **D1u** Raise upload cap (env default 10–25 MB) + parse progress + row/col counts pre-commit + client-side size check *(F8)*
- **F3** env→DB admin allowlist *(F17)*
- **F4t** Privacy/session-only persistence tests (no raw rows/files/prompts) hardened + documented *(F17)*
- **F5t** Privacy-preserving production analytics for completion/drop-off/errors *(F3 prod)*

### Gate 4 — Optional polish (opportunistic)
- **G1** Manual column remap override *(F14)*
- **G2** Local PII pre-scan (warn-only) *(F19)*
- **G3** Profile histograms + "how outliers were flagged" tooltip *(F20)*
- **G4** Export thumbnail preview + reviewer/sign-off fields + CSV audit-header metadata *(F16, F20)*
- **G5** District-name normalizer (deterministic, offline) *(F20)*
- **G6** Richer per-file error/retry states + "How this works" mini-guide *(F20)*

**Explicitly do NOT build yet** (all three reviews converge): live/operational data connectors, real-time feeds, multi-user collaboration, "recommended action" automation, more chart customization. These increase the "implies operational approval" risk the product exists to avoid.

---

## 4. Workable tasks for Codex (GPT‑5.5 xhigh) + subagents

**Orchestration model** (mirrors `plan/archive/.../codex_handoff/agents/`): a top-level **Orchestrator** dispatches to specialized subagents, each owning a workstream. Run subagents in parallel where "Deps" is empty; serialize where noted. Every task is self-contained: scope, files, change, acceptance, tests, effort, deps, gate.

**Subagents**
- **AGENT_UX_COPY** → A1–A6 (framing, copy, IA)
- **AGENT_SAFETY** → B1–B2 (hard gate, watermark)
- **AGENT_FEATURE** → C1–C2, E1–E3 (auth UX, feedback/analytics, join/domain)
- **AGENT_A11Y** → D0–D3 (test harness + keyboard/contrast)
- **AGENT_RELEASE** → F1t–F5t, D1u (auth/migrations/retention/limits)
- **AGENT_TEST_AUTHOR** → cross-cutting: authors/maintains the test specs in §5, owns coverage gates
- **AGENT_POLISH** → G1–G6

Effort key: **S** ≤0.5d · **M** 0.5–2d · **L** 2–5d.

> Global definition of done (every task): `npm run lint` clean (`tsc --noEmit`), `npm run test` green, no new raw-row persistence, demo stays upload-free & deterministic, and the task's specific tests (below) pass.

### Workstream A — Demo framing & copy (AGENT_UX_COPY)

- **A1 — Hero value prop + beta/safety strip.** *(F4, Gate 1, S)*
  Files: `components/WorkflowComponents.tsx` (LandingHero), `app/styles.css`.
  Change: add one-line value prop + persistent strip "Controlled beta · synthetic sample data · not for operational action" rendered on every demo step (not just hero). Extract strip text to an exported constant `DEMO_SAFETY_STRIP` for testability.
  Acceptance: strip visible on steps 1–7 in demo; absent in workspace mode. Deps: none.

- **A2 — Sample walkthrough CTA + progressive disclosure.** *(F4, Gate 1, M)*
  Files: `components/WorkflowComponents.tsx`.
  Change: primary "Run the 3‑minute sample walkthrough" CTA above dense content; collapse advanced caveats/source-freshness/asks into an `<details>`-style accordion (default collapsed). Keep semantics (heading order, single `<h1>`). Deps: none.

- **A3 — Resolve AI affordance conflict.** *(F6, Gate 1, S)*
  Files: `components/DashboardCopilotApp.tsx`, `components/WorkflowComponents.tsx`.
  Change: in `demoMode`, hide the inert AI toggle; keep one explanatory CTA ("Sign in to use AI-assisted workflow"). Rewrite helper copy so it no longer instructs users to enable an unavailable toggle. Extract messages to constants. Deps: none.

- **A4 — Rename Step‑5 label.** *(F5, Gate 1, S)*
  Files: `components/WorkflowComponents.tsx:71` — `validate: "Dataset"` → `validate: "Validate"`. (Keep the step **id** `validate` from `lib/config.ts` unchanged.)
  Acceptance: stepper shows "Validate"; no other label regressions. Deps: none.

- **A5 — Step‑2 demo copy + de-jargon.** *(F10, F11, Gate 1, S)*
  Files: `components/WorkflowComponents.tsx` (UploadStep demo branch), Step‑1 helper copy.
  Change: when `sampleOnly`/`demoMode`, title "Choose sample data" and remove the "don't upload sensitive data" note (no upload exists). Replace "Defaults are ready to run in deterministic mode" → "Use the template as-is for the guided flow without AI." Deps: A3 (shared copy constants).

- **A6 — Session-only chip + synthetic-sample copy.** *(F9, Gate 1, S)*
  Files: `components/WorkflowComponents.tsx`, `app/styles.css`.
  Change: persistent "Session-only · nothing is stored" chip in demo; "Synthetic sample data only" near sample selectors and the CSV template download. Deps: A1.

### Workstream B — Trust & safety hard-gating (AGENT_SAFETY)

- **B1 — Hard-gate dashboard generation on `decision_unsafe`.** *(F1, Gate 2, M)*
  Files: `components/WorkflowComponents.tsx` (validate→dashboard transition), `lib/decisionContext.ts` (expose a pure `getBlockingReasons(readiness)` helper), possibly `components/DashboardCopilotApp.tsx` (`canNavigateToStep`).
  Change: when `readiness.status === "decision_unsafe"`, require **per-blocker** acknowledgement before generation proceeds; "Proceed With Dashboard Generation" → "Dashboard is review-only: unresolved evidence gaps remain" + per-blocker checklist. Generation allowed only after all blockers acknowledged; the acknowledgement set flows into the export packet. Deps: none. **Design the gate as a pure function so it is node-unit-testable.**

- **B2 — Watermark review-only artifacts.** *(F1, F16, Gate 2, M)*
  Files: `lib/exportPng.ts`, `lib/exportPdf.ts`, `lib/workflowExport.ts` (`reviewNotice`/`reviewRequired`), `lib/copilotHandoff.ts`.
  Change: when status ≠ `ready`, stamp PNG/PDF with "REVIEW ONLY — UNSAFE EVIDENCE" (or "REVIEW ONLY" for `review_needed`); ensure packet `limitations[]`/`reviewNotice` reflect the gate. Extract a pure `watermarkLabelForStatus(status)` helper. Deps: B1.

### Workstream C — Auth UX & learning loop (AGENT_FEATURE)

- **C1 — Fix unconfigured sign-in form + query interception.** *(F2, F18, Gate 2, S)*
  Files: `app/login/page.tsx` (lines ~58, ~85), `lib/auth/signInErrors.ts`.
  Change: when auth unconfigured, **disable** the email input + button and replace copy: "Sign-in isn't available in this preview. Explore the public demo — no account needed." Intercept `?error=auth_not_configured` and render a clear, friendly block (not a raw param). Add privacy microcopy where email is requested: "We use your email only to send a sign-in link." Deps: none.

- **C2 — Demo feedback + privacy-safe analytics.** *(F3, Gate 2, M)*
  Files: `components/FeedbackForm.tsx`, `components/DashboardCopilotApp.tsx:819`, new `lib/analytics/events.ts`, optionally `app/api/feedback/route.ts`.
  Change: provide a guest-safe 1‑question demo feedback prompt (no auth 401), and a privacy-safe event emitter capturing **metadata only**: `step_reached`, `sample_chosen`, `export_type` — **never** row values/PII. Default to a no-op sink unless a provider env is set. Deps: none. **Hard requirement:** payload schema must exclude raw rows (enforced by test, see §5 C2).

### Workstream D — Accessibility (AGENT_A11Y)

- **D0 — Add jsdom Vitest project for component a11y tests.** *(F7 enabler, Gate 2, M)*
  Files: `vitest.config.ts` (add a second project with `environment: "jsdom"`, scoped to `tests/dom/**/*.test.ts`), `package.json` (devDeps: `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe`), new `tests/dom/setup.ts`.
  Acceptance: `npm run test` runs both node and jsdom projects; existing node tests untouched. Deps: none. **This unblocks D1–D3, B1/B2 UI assertions, and A1–A6 rendered-copy tests.**

- **D1 — Modal focus trap.** *(F7, Gate 2, M)* Files: decision-map dialog in `components/WorkflowComponents.tsx`. Change: trap Tab/Shift+Tab within the dialog; restore focus to the trigger on close; keep Esc-to-close. Deps: D0.

- **D2 — APG tablist keyboard pattern (mobile tabs).** *(F7, Gate 2, M)* Files: mobile tab system in `components/WorkflowComponents.tsx`. Change: roving `tabindex`, Left/Right/Home/End arrow handling, `aria-selected`. Deps: D0.

- **D3 — Focus-ring contrast + async `aria-live`.** *(F7, Gate 2, S)* Files: `app/styles.css` (thicker/higher-contrast focus ring in dark mode), validation-summary container (`aria-live="polite"`). Deps: D0.

### Workstream E — Join trust & domain fit (AGENT_FEATURE)

- **E1 — Join transparency + unmatched preview.** *(F15, Gate 2, M)* Files: `lib/harmonization.ts`, `lib/deterministicJoinRecommendations.ts`, recommend step in `components/WorkflowComponents.tsx`. Change: surface matched/unmatched counts and a sample of unmatched keys *before* commit; keep reversibility/"Adjust join" prominent. Add pure `summarizeJoinMatch(left,right,keys)` helper. Deps: none.

- **E2 — Stepper back-navigation.** *(F13, Gate 2, S)* Files: stepper in `components/WorkflowComponents.tsx`. Change: allow clicking any **completed** step; keep forward steps gated by `canNavigateToStep`. Deps: none.

- **E3 — P‑code / COD vocabulary.** *(F12, Gate 2, S)* Files: `lib/locationFields.ts`, geography hints/examples + CSV templates. Change: add P‑code recognition hints and examples (e.g., Admin1 `MDG01`); placeholder/help text referencing COD standards. Deps: none.

### Workstream F — Production gating (AGENT_RELEASE)

- **D1u — Raise upload cap + ingestion UX.** *(F8, Gate 3, M)* Files: `lib/config.ts:11-15` (default 10–25 MB via `MAX_UPLOAD_SIZE_MB`), upload UI (`components/WorkflowComponents.tsx`), `lib/fileParsers.ts`. Change: raise default; client-side size pre-check on drop; parse progress; show row/col counts pre-commit. Deps: none.
- **F1t — Auth config + migrations + D1–D8 + retention.** *(F17, Gate 3, L)* Files: env/`docs/decisions/auth-provider.md`, `db/**`, `app/progress/page.tsx`, `docs/data-retention.md`. Mostly ops + content; verify migrations on staging. Deps: none.
- **F3 — env→DB admin allowlist.** *(F17, Gate 3, M)* Files: `lib/adminMetrics/index.ts:10-16`, `lib/db/metadataAdapter.ts`, `db/**`. Change: read allowlist from a metadata table (fallback to `env.ADMIN_EMAILS`). Deps: F1t.
- **F4t — Privacy persistence hardening.** *(F17, Gate 3, M)* Files: extend `tests/privacy-no-row-persistence.test.ts`, `tests/db-schema-boundary.test.ts`; `docs/data-retention.md`. Deps: F1t.
- **F5t — Production analytics (privacy-preserving).** *(F3 prod, Gate 3, M)* Files: `lib/analytics/events.ts` (prod sink), env wiring. Deps: C2.

### Workstream G — Optional polish (AGENT_POLISH)
G1 column remap override (`lib/profiling.ts` + UI) · G2 local PII pre-scan warn-only (`lib/profiling.ts`) · G3 profile histograms + outlier tooltip · G4 export thumbnail + reviewer/sign-off + CSV audit header (`lib/exportCsv.ts`, `lib/workflowExport.ts`) · G5 deterministic district-name normalizer (`lib/locationFields.ts`) · G6 richer error/retry + "How this works".

---

## 5. Unit tests in detail

Harness: **Vitest** (`npm run test` → `vitest run`). Existing tests live in `tests/*.test.ts` (node env). New DOM tests live in `tests/dom/*.test.ts` (jsdom project from **D0**). Prefer extracting pure helpers so logic is node-testable; reserve jsdom for genuine rendering/keyboard behavior.

### A — framing & copy
**`tests/demo-framing.test.ts` (node)** — for constants extracted in A1/A3/A5/A6:
- exports `DEMO_SAFETY_STRIP` containing "controlled beta", "synthetic sample data", "not for operational action".
- demo copy constants contain **no** "deterministic" in user-facing strings (A5); contain "Choose sample data" not "Upload Data" for the demo branch.
- `STEP_LABELS.validate === "Validate"` (A4) and labels cover every `WORKFLOW_STEPS` id (no missing/extra keys).

**`tests/dom/demo-framing.dom.test.ts` (jsdom)** — render `DashboardCopilotApp forceDeterministic`:
- safety strip present on initial render and after advancing a step (A1).
- AI toggle **not** rendered in demo; explanatory CTA **is** (A3).
- session-only chip present; "Synthetic sample data only" appears near sample selectors (A6).
- walkthrough CTA present; advanced caveats inside a collapsed disclosure by default (A2).

### B — hard gate & watermark
**`tests/readiness-gate.test.ts` (node)** — pure helpers:
- `getBlockingReasons(readiness)` returns the full blocker list for `decision_unsafe`, `[]` for `ready`.
- gate predicate: generation **blocked** until every blocker id is acknowledged; **allowed** when all acknowledged or status `ready`.
- `review_needed` → not hard-blocked but flagged review-only.
- `watermarkLabelForStatus`: `decision_unsafe`→"REVIEW ONLY — UNSAFE EVIDENCE", `review_needed`→"REVIEW ONLY", `ready`→`null`.
- packet builder (`buildDecisionHandoffPacket`) sets `reviewRequired:true` and includes acknowledged-blocker ids when not `ready`.

**`tests/export-watermark.test.ts` (node)** — for `lib/exportPng.ts`/`exportPdf.ts` watermark layer: given a fake render target, assert the watermark text node/draw call is invoked for non-`ready` statuses and omitted for `ready`. (Mock `html-to-image`/`jspdf` boundaries; assert inputs, not pixels.)

**`tests/dom/dashboard-gate.dom.test.ts` (jsdom)** — risky sample path: heading reads "Dashboard is review-only…", generate action disabled until each blocker checkbox is checked; after acknowledgement, generation enabled. (Mirrors Gemini's manual risky-sample test.)

### C — auth UX & analytics
**`tests/dom/login-unconfigured.dom.test.ts` (jsdom)** — render `app/login/page` with auth unconfigured: email input + submit **disabled**; preview copy shown; **no** "Send sign-in link" active button; `?error=auth_not_configured` renders a friendly block, not the raw token.

**`tests/analytics-events.test.ts` (node)** — `lib/analytics/events.ts`:
- emits only allowed metadata keys (`step_reached`,`sample_chosen`,`export_type`) — **snapshot the payload shape**.
- a deep-scan assertion rejects any value that looks like a data row/PII (reuse the matcher style from `tests/privacy-no-row-persistence.test.ts`).
- default sink is a **no-op** when no provider env set (no network).

**`tests/feedback-api.test.ts` (extend, node)** — guest/demo feedback submission returns 2xx (no 401) and persists **metadata only**; reject payloads containing row-shaped data.

### D — accessibility
**`tests/dom/focus-trap.dom.test.ts` (jsdom, user-event)** — open decision-map dialog: Tab cycles within dialog, Shift+Tab wraps backward, Esc closes, focus returns to trigger (D1).
**`tests/dom/tablist-keys.dom.test.ts` (jsdom)** — mobile tablist: ArrowRight/Left move selection with roving `tabindex`; Home/End jump to first/last; `aria-selected` tracks (D2).
**`tests/dom/a11y-axe.dom.test.ts` (jsdom, vitest-axe)** — run `axe` on demo step 1 and the dashboard step; assert **no violations**; assert validation summary container has `aria-live="polite"` (D3). (Contrast ratio for the focus ring is verified by an axe color-contrast rule where computable; otherwise documented as a manual check in `qa/checklist.md`.)

### E — join & domain
**`tests/join-summary.test.ts` (node)** — `summarizeJoinMatch`: correct matched/unmatched counts for left/inner/outer; returns a bounded sample of unmatched keys; deterministic ordering (E1).
**`tests/dom/stepper-nav.dom.test.ts` (jsdom)** — completed steps are clickable and navigate back; not-yet-reached steps remain disabled (E2).
**`tests/location-fields.test.ts` (extend, node)** — P‑code patterns (e.g., `MDG01`) recognized as admin codes; hints/examples include COD references (E3).

### F — production
**`tests/config.test.ts` (extend, node)** — `MAX_UPLOAD_SIZE_MB` honors env override; new default ≥10; `MAX_UPLOAD_SIZE_BYTES` derives correctly; sub-min values clamp to 0.1 (D1u).
**`tests/admin-metrics.test.ts` (extend, node)** — `isAdminUser` resolves from the DB allowlist when present and falls back to `env.ADMIN_EMAILS`; case-insensitive; empty/whitespace handled (F3).
**`tests/privacy-no-row-persistence.test.ts` + `tests/db-schema-boundary.test.ts` (extend, node)** — assert no raw rows/files/prompts persist across the new analytics + admin-allowlist code paths (F4t).
**`tests/upload-validation.test.ts` (new, node)** — pure size-check helper rejects > cap, accepts ≤ cap, reports human-readable limit (D1u client pre-check).

### Cross-cutting (AGENT_TEST_AUTHOR)
- **Regression guard (node):** assert the demo path renders **no file input** and stays deterministic — `onFiles` undefined + `sampleOnly` true in `demoMode` (locks in the engineered-safety property all three reviews praised). Extend `tests/dom` or assert via the props contract.
- Keep `npm run test` green at every task boundary; new jsdom project must not slow node suite (separate project).
- Coverage intent: every new **pure helper** (gate, watermark label, join summary, analytics schema, size check) has direct node tests; every new **interactive behavior** has a jsdom test.

---

## 6. Suggested execution order for Codex

1. **D0** (jsdom harness) + **A4** (label) — unblock everything, land a trivial win.
2. Parallel: **A1–A3, A5–A6** (UX_COPY) · **C1** (FEATURE) · **E2/E3** (FEATURE) — all Gate‑1/independent.
3. **B1 → B2** (SAFETY, serialized) with **AGENT_TEST_AUTHOR** writing `tests/readiness-gate.test.ts` first (red→green).
4. **C2** (feedback/analytics) + **D1–D3** (a11y) in parallel.
5. **E1** (join trust).
6. Gate‑3: **D1u, F1t → F3 → F4t, F5t** (RELEASE).
7. Gate‑4 polish (POLISH) opportunistically.

**Demo can ship after step 2; controlled beta after steps 3–5 + a11y green; production after Gate‑3.** Keep AI deterministic-only until server-side entitlement + quota, the guardrail panel, and the B1 hard-gate are all live.
