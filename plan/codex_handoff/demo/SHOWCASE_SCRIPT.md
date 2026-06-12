# Tomorrow Showcase Script

> Archive notice: this showcase script belongs to the historical handoff package, not current project guidance. Use `docs/showcase-script.md` for the active demo path.

## 0:00–0:30 — Problem
Disaster-response teams receive fragmented files from NGOs, government teams, and service partners. The challenge is not only making a dashboard; it is knowing which files cover which decision evidence, whether they can be combined, and whether the final view is safe to use.

## 0:30–1:00 — Decision template
Show Response prioritization.
Say: "Instead of starting with a blank upload screen, this starts with the decision: which districts should receive first response?"

## 1:00–1:30 — Suggested collection template
Show suggested fields and CSV download.
Say: "If the analyst does not have clean data yet, the tool tells them what to collect."

## 1:30–2:15 — Fragmented data
Load fragmented demo data.
Say: "Here we have needs data, government population data, and service capacity data. They use different geographic identifier names."

## 2:15–3:00 — Evidence Coverage Map
Show coverage.
Say: "The app translates columns into decision evidence. It tells the user which file and column covers geography, need severity, affected population, response gap, and capacity."

## 3:00–3:45 — Harmonize
Click harmonize, show join/combine suggestion, accept.
Say: "The app recommends how to combine files, but the user reviews before merging."

## 3:45–4:30 — Readiness and dashboard
Show decision readiness and generate dashboard.
Say: "The dashboard is generated with caveats, not as an automatic decision."

## 4:30–5:00 — Export
Export handoff log.
Say: "The analyst can hand off evidence coverage, join review, quality caveats, and transformation history — not just a chart."

## Fallback if AI fails
Turn AI off and say: "This demo is deterministic. AI can assist, but evidence coverage, joins, readiness, caveats, and exports work without it."

## Risky sample optional
Load risky sample only if asked how bad data is handled.
Say: "The workflow stays usable, but clearly marks the output as not safe for action yet."
