# Dashboard Copilot — Design System

Design system for **Dashboard Copilot**, a recommendation-first web app by [DataKind](https://www.datakind.org/) that turns humanitarian and disaster-response datasets (CSV/XLSX) into transparent, reviewable dashboards. The product is a single guided workflow: **Template → Upload → Profile → Harmonize → Dataset → Dashboard → Export**, with an AI on/off toggle and deterministic fallbacks. Nothing is hidden: joins, cleaning transforms, quality caveats, and transformation logs stay visible so analysts can review what changed before sharing.

**Sources**
- Local codebase: `disaster-dashboard-webapp-repo` (Next.js 15, React, single global stylesheet `app/styles.css`, all UI in `components/WorkflowComponents.tsx`)
- Public repo: https://github.com/datakind/disaster-dashboard-webapp-repo (Apache-2.0)
- Two surfaces: the **workflow app** (`/`) and the **about page** (`/about`)

---

## CONTENT FUNDAMENTALS

- **Voice: calm operational honesty.** The app talks like a careful analyst, never a salesperson. It explains what it did, what it could not do, and what the user should check. Example warning copy: *"AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard recommendations remain available."*
- **Plain, complete sentences** in helper text and rationale. No exclamation marks. No emoji, ever.
- **Casing:** Step headings are Title Case (*"Upload Data"*, *"Review Data Profiling"*, *"Export Dashboard Assets"*). Buttons, labels, and chips are sentence case (*"Use sample data"*, *"Accept recommendation"*, *"Profile data"*). Eyebrows are visually uppercased via CSS (*"Step 2"*, *"Evidence coverage"*, *"Recommended"*).
- **Address:** imperative second person for actions (*"Add data to begin"*, *"Review brief before loading data"*); the system describes itself in passive/neutral voice (*"No blocking quality issues were found."*).
- **Caveats are first-class content.** Risk notes, "Why:" rationale boxes, "Next action" prompts, and acknowledgement checkboxes (*"I reviewed the decision-readiness caveats before exporting."*) are part of the product's personality.
- **Data terms are typographically marked:** column and dataset names render as inline code chips (`need_severity_score`), with human display labels alongside.
- **Numbers:** counts are pluralized precisely (*"5 rows"*, *"1 chart"*), percentages as *"46% missing, 82% confidence"*. Labels like *"none detected"*, *"Not estimated"*, *"Not mapped yet"* for empty values.
- **Safety framing** around data: *"Do not upload sensitive personal, medical, financial, or restricted data."*

## VISUAL FOUNDATIONS

- **Vibe:** a quiet, paper-like analyst's worksheet. Warm off-whites, hairline borders, one deep teal accent. Feels closer to a printed briefing pack than a SaaS dashboard.
- **Signature background:** faint 72px **graph-paper grid** (two 1px line gradients) over a warm fade from `#fbfbf8` to `#f5f6f2`. Content sits on white/near-white cards above it.
- **Color:** warm neutral ramp (`--ink #171717`, `--muted #5f656d`, lines `#deded8/#c9cbc3`, surfaces `#fff/#fbfbf8/#f5f6f2`). One brand accent: deep teal `--accent #235f58` (recommendation cards, completed steps, "next action" buttons). Semantic trio: info blue `#2d5be3`, warning amber `#a56315`, error red `#b42318` — each with its own soft bg + border tint pair. Saturated color is rationed; most of the page is neutral.
- **Severity is encoded as a 4–5px left border** on tiles (blue = info/default, teal = good/low, amber = medium/review, red = high/blocking). This is the app's strongest visual convention.
- **Type:** a single family, **Rethink Sans** (variable 400–800). Hierarchy via size + unusually heavy intermediate weights (650, 720, 760, 780, 820). Headings at weight 720, letter-spacing 0. Body 15px/1.5. Eyebrows: 0.75rem, weight 800, uppercase, teal. Monospace only for inline code chips.
- **Radii:** 8px on everything (cards, buttons, inputs, notices); 999px pills for chips/steps/toggles; 7px for chart bars nested in 8px tracks; 5px inline code.
- **Borders over shadows:** every surface has a 1px border. Shadows are huge-radius, very low alpha (`0 18px 45px rgba(23,23,23,.07)`) on main panels; flat cards get only a hairline `0 1px 0` shadow.
- **Cards:** white bg, 1px `--line` border, 8px radius, 18px padding. Main workflow panel: `rgba(255,255,255,.86)` at 28px padding with the big soft shadow. Several surfaces use slight white transparency (`.54–.94`) over the grid background.
- **Buttons:** 40px min-height, weight 600, white with strong border (default); ink-filled (primary); teal-filled (`next-action` for workflow advancement). Hover lifts `translateY(-1px)` + slightly darker border; active returns to 0. Disabled = opacity .45.
- **Forms:** labels are 0.86rem muted text stacked 6–7px above the control; inputs/selects are white, `--line-strong` border, 40px tall. Selects draw their own chevron with two CSS triangles.
- **Focus:** `2px solid rgba(45,91,227,.28)` outline, offset 2px — blue even on teal components.
- **Motion:** one easing `cubic-bezier(0.2, 0.8, 0.2, 1)` everywhere. 160–180ms hovers; 220–260ms entrance fades with 4–8px vertical rise (`panelIn`, `contentIn`); chart bars grow with `scaleX` 520ms from the left; loading dot pulses an expanding ring. Honors `prefers-reduced-motion`.
- **Sticky header:** translucent warm white + 18px backdrop blur, hairline bottom border; tints blue while loading.
- **Charts:** colorblind-safe palette led by `#005ab5` blue with `#d55e00` orange as the universal hover/highlight color. Plots sit on `--panel` with 1px border; dashed gridlines; tooltips are ink-black rounded chips. Bars show values inside the bar.
- **Tables:** hairline row borders only (no vertical rules), `--panel` sticky header, muted 0.86rem cells, hover row tint `#fafaf6`, wrapped in a bordered rounded `table-wrap`.
- **Accordions:** native `<details>` with a typographic `+` / `−` marker on the right — no icon glyphs.
- **Imagery:** none. No photos, no illustrations. The data is the imagery.

## ICONOGRAPHY

- **There is essentially no icon system — this is deliberate.** The UI is text-first; the only icons are:
  - `assets/logo.svg` — the app favicon: white bar-chart glyph on a teal (`#0f766e`) rounded square. Note: the favicon teal is *not* `--accent`; keep it as-is.
  - Typographic/unicode glyphs: `+` / `−` accordion markers, CSS-drawn select chevrons, CSS counter circles for numbered steps, a CSS-drawn pulsing dot for loading.
- **No icon font, no SVG icon set, no emoji.** Pills with short uppercase text (CSV, JSON, PNG, PDF, "Required", "Needs review") do the job icons would do elsewhere. When designing new surfaces, prefer a labeled pill or a left-border severity color over adding icons.

---

## Index

| Path | What |
|---|---|
| `styles.css` | Global CSS entry — `@import`s every token file below |
| `tokens/colors.css` | Full palette + semantic aliases |
| `tokens/typography.css` | Type sizes, variable-font weights, leading |
| `tokens/spacing.css` | Radius, spacing, layout, control heights |
| `tokens/effects.css` | Shadows, motion, keyframes, graph-paper background |
| `tokens/base.css` | Body reset with brand background |
| `tokens/fonts.css` | Rethink Sans (Google Fonts) |
| `assets/logo.svg` | App mark (bar chart on teal square) |
| `guidelines/*.html` | Foundation specimen cards (Design System tab) |
| `components/actions/` | `Button`, `ToggleSwitch` |
| `components/forms/` | `Field`, `SelectField`, `TextAreaField`, `CheckboxRow` |
| `components/navigation/` | `AppHeader`, `Stepper` |
| `components/feedback/` | `Notice`, `LoadingBanner`, `Pill`, `SeverityCallout`, `EmptyState`, `Tooltip` |
| `components/surfaces/` | `Card`, `SectionHeading`, `RecommendationCard`, `Accordion`, `Modal` |
| `components/data/` | `Metric`, `BarChart`, `DataTable`, `InlineCode` |
| `ui_kits/dashboard-copilot/` | Interactive click-through of the workflow app |
| `SKILL.md` | Agent skill entry point |

**Caveats:** Rethink Sans is loaded from Google Fonts (no binaries in the repo — same family the app uses via `next/font`). The repo contains no logo wordmark beyond the favicon; the header brand is plain text.
