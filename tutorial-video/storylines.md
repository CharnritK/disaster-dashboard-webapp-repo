# Dashboard Copilot Tutorial Video Series

This tutorial package is intentionally split into three short videos. One long
story would blur the job: first make the viewer feel the problem, then show the
real user path, then prove the safety boundary.

The tone should be humane, restrained, and credible. Do not show graphic
disaster imagery. The emotional center is the analyst and response team carrying
responsibility under uncertainty.

## Series Spine

- Problem: field teams have partial files, mismatched district names, missing
  evidence, and no shared picture.
- Product promise: start with the decision, align evidence, expose caveats, and
  prepare a review-ready dashboard and handoff.
- Trust boundary: the app supports decisions; it does not approve action.
- Proof: the public demo works deterministically with synthetic sample data; AI
  remains optional and gated.

## Current Registered Compositions

| Composition | Length | Role | Generated imagery |
| --- | ---: | --- | --- |
| `FragmentedDataPainpoint` | 37s | Emotional hook and product proof | One opener only |
| `PublicDemoUserFlow` | 67s | Real public demo walkthrough | None |
| `TrustRiskUserFlow` | 46s | Risk, caveats, and privacy boundary | None |
| `DashboardCopilotTutorial` | 113s | Internal longer business/architecture walkthrough | None |

The production storyboard, capture source, motion plan, sound plan, and release
gates live in `storyboard-capture-plan.md`.

`DashboardCopilotTutorial` is not part of the current public release package.
Do not regenerate it for public use without a fresh storyboard, transcript,
capture plan, and pilot threshold.

## Part 1: Why Trust Breaks Before The Chart

- Composition id: `FragmentedDataPainpoint`
- Length: 37 seconds
- Audience: executives, domain partners, hackathon judges
- Goal: make the viewer feel why fragmented data is painful, then immediately
  prove that the product path is real.
- Opening line: "The hardest part is knowing whether the chart can be trusted."

Scene plan:

1. Human pressure, 0-7s
   Image: `generated/emotional-01-night-ops.png`
   Point: the meeting cannot wait, but the evidence is fragmented.

2. Fragmented sample, 7-14s
   Capture: `captures/03-fragmented-data.png`
   Motion: cursor moves to the synthetic fragmented sample path.

3. Evidence profile, 14-22s
   Capture: `captures/04-profile-evidence.png`
   Point: uncertainty is visible before recommendations.

4. Join review, 22-30s
   Capture: `captures/05-harmonize-review.png`
   Point: combining files stays reviewable and row-preserving.

5. Handoff, 30-37s
   Capture: `captures/09-handoff-summary.png`
   Closing line: "Clearer evidence. Human-owned action."

## Part 2: Run The Public Demo

- Composition id: `PublicDemoUserFlow`
- Length: 67 seconds
- Audience: first-time users
- Goal: show exactly how to run the bundled deterministic demo.
- Opening promise: the viewer can test without account, API key, or sensitive
  data.

Browser-verified click path:

`Use template and continue` -> `Use fragmented demo data needs + population +
capacity` -> `Profile data` -> `Harmonize data` -> `Accept recommendation` ->
`Generate dashboard` -> `Export dashboard` -> `Generate handoff summary`.

Scene plan:

1. Template
   Capture: `01-template.png`
   Point: start with decision question, action owner, geography, timeframe, and
   required evidence.

2. Data load
   Capture: `03-fragmented-data.png`
   Point: use the synthetic fragmented sample, not sensitive operational files.

3. Evidence coverage
   Capture: `04-profile-evidence.png`
   Point: inspect profiles and coverage before trusting recommendations.

4. Join review
   Capture: `05-harmonize-review.png`
   Point: accept only explainable joins and row-preserving cleaning.

5. Readiness
   Capture: `06-validation-readiness.png`
   Point: "Ready for review" is a checkpoint, not operational approval.

6. Dashboard
   Capture: `07-dashboard.png`
   Point: source notes, quality labels, and caveats stay attached.

7. Export and handoff
   Capture: `09-handoff-summary.png`
   Point: generate the handoff summary and export review assets.

## Part 3: When Data Is Not Ready

- Composition id: `TrustRiskUserFlow`
- Length: 46 seconds
- Audience: safety/privacy reviewers, domain partners, cautious users
- Goal: prove the product does not hide risk.
- Opening line: "Show when the data is not safe yet."

Scene plan:

1. Risky sample quality
   Capture: `10-risk-quality.png`
   Point: invalid values and quality issues remain visible.

2. Readiness blockers
   Capture: `11-risk-readiness.png`
   Point: missing capacity evidence, negative counts, invalid percentages, and
   weak coverage are review stops.

3. Evidence before advice
   Capture: `04-profile-evidence.png`
   Point: deterministic validation remains authoritative.

4. Handoff caveats
   Capture: `09-handoff-summary.png`
   Point: caveats and assumptions stay in the handoff.

5. Session boundary
   Capture: `08-export-handoff.png`
   Point: uploaded rows stay in the browser session; controlled-beta
   persistence is metadata-only.

## Remotion Build Notes

- Use `<Img>` and `staticFile()` for generated images and screenshots.
- Drive animation with `useCurrentFrame()` and `interpolate`; do not use CSS
  transitions or CSS animations.
- Use cursor motion, click pulses, and target rings to simulate actual user
  actions.
- Keep captions short enough to read at 1080p and mobile preview sizes.
- Generated imagery supports the hook only; it should not replace product proof.

## Voiceover Direction

Current production cuts include generated narration plus on-screen text. The
voice should sound like a field-aware product guide:

- calm, direct, no hype
- acknowledge pressure and incomplete data
- use "review-ready" instead of "decision-ready" when discussing output
- avoid claiming operational approval
- end each tutorial with the trust line: "The final decision stays with the
  response team."

## Pre-Generation Brief

Before generating new speech, posters, stills, or MP4s, use
`pre-generation-brief.md` as the go/no-go material pack. It states what to keep,
what to cut, what captures to verify, and which claims must remain protected.
