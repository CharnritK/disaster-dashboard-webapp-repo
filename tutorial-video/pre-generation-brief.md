# Tutorial Pre-Generation Brief

Use this brief before generating new voiceover, stills, posters, or MP4s. Its
job is to keep the tutorial package focused on the best material rather than
polishing every possible scene.

## Recommendation

Keep the current three-part series. Do not merge it into one long tutorial and
do not add more generated imagery for the next generation pass.

The best next cut is:

1. Part 1: prove the pain of fragmented evidence in 37 seconds.
2. Part 2: show the exact reproducible public demo path in 67 seconds.
3. Part 3: show what happens when data is not ready in 46 seconds.

This split works because each video has one job, one audience, and one trust
claim. A single long tutorial would force emotional context, product operation,
and governance into one overloaded story.

Lead with Part 2 when only one tutorial asset can be shown. It is the strongest
product proof because the viewer sees the deterministic `/demo` path end to end:
template, bundled synthetic sample, profiling, harmonization, readiness,
dashboard, and handoff.

## Product Truths To Protect

- Public `/demo` is deterministic, sample-driven, and requires no account, API
  key, anonymous AI, or sensitive data.
- Dashboard Copilot supports review and handoff. It does not approve
  operational action.
- Evidence coverage, join review, readiness, caveats, and transformation
  history must remain visible.
- Uploaded rows stay in the browser session. Controlled-beta persistence is
  limited to approved metadata.
- AI is optional, gated, advisory, and not required for public demo continuity.

## Cut Or Defer

- Do not add more generated disaster or emotional images for the next
  generation pass.
- Do not add background music unless a later muted/sound-on test proves it
  improves comprehension without emotional manipulation.
- Keep `DashboardCopilotTutorial` internal unless it gets a fresh storyboard,
  capture plan, transcript, pilot threshold, and About-page placement decision.
- Keep analyst deep dive and technical architecture explainer as future modules
  until they are actually storyboarded, rendered, embedded, and pilot-tested.
- Do not call the package market-tested or broadly publish-ready until viewer
  pilots pass.

## Material Strategy

Use real app material wherever the viewer needs trust.

| Material type | Use now | Avoid now |
| --- | --- | --- |
| Generated image | Only the opening 7 seconds of Part 1 | Extra emotional interstitials, disaster-drama visuals, fake field scenes |
| App screenshot | Every product proof scene | Stale UI, dev overlays, localhost chrome in public-facing cuts |
| Cursor motion | One clear action or read target per scene | Decorative wandering, multiple clicks per scene |
| Voiceover | Calm, field-aware narration that names uncertainty | Promotional hype, urgency music, claims of approval |
| On-screen copy | Short claim plus visible proof | Dense explanations that compete with screenshots |

## Generation-Ready Scene Pack

### Part 1: Why Trust Breaks Before The Chart

Composition: `FragmentedDataPainpoint`
Target: 37 seconds
Audience: executives, judges, domain partners
Job: make fragmented-data pain felt, then prove the app gives a reviewable path.

| Scene | Source | Motion | Voice point | Keep | Cut |
| --- | --- | --- | --- | --- | --- |
| Problem pressure | `generated/emotional-01-night-ops.png` | Slow scale only | Trust is the hard part | Human pressure, non-graphic tone | More generated disaster imagery |
| Fragmented sample | `captures/02-upload.png` -> `captures/03-fragmented-data.png` | Cursor clicks real sample button, then result state | Show fragmentation first | Synthetic bundled files | Upload implication |
| Evidence profile | `captures/04-profile-evidence.png` | Pan/ring evidence coverage | Make uncertainty visible | Missingness, roles, coverage | Claiming confidence too early |
| Join review | `captures/05-harmonize-review.png` -> `captures/06-validation-readiness.png` | Cursor accepts recommendation, then readiness appears | Review before combine | Join key, row-preserving cleaning | Imputation/deletion/fuzzy match claims |
| Human handoff | `captures/08-export-handoff.png` -> `captures/09-handoff-summary.png` | Cursor clicks handoff action, then summary appears | Human-owned action | Caveats and transformation history | "Decision approved" language |

### Part 2: Run The Public Demo

Composition: `PublicDemoUserFlow`
Target: 67 seconds
Audience: first-time users
Job: let a viewer reproduce the public demo without hidden setup.

| Scene | Source | Motion | Voice point | Keep | Cut |
| --- | --- | --- | --- | --- | --- |
| Template | `captures/01-template.png` -> `captures/02-upload.png` | Scroll/click continuation, then upload step | Start with decision | Owner, geography, timeframe, evidence | Chart-first framing |
| Fragmented sample | `captures/02-upload.png` -> `captures/03-fragmented-data.png` | Click real sample button, then loaded files | Use bundled synthetic files | No account/API key | Real upload emphasis |
| Profile | `captures/03-fragmented-data.png` -> `captures/04-profile-evidence.png` | Top-to-bottom pan and click Profile data | Quality visible early | Field roles and coverage | Dense table scanning |
| Harmonize | `captures/04-profile-evidence.png` -> `captures/05-harmonize-review.png` | Top-to-bottom pan and click Harmonize data | Review join first | Join reason, cleaning actions | Hidden automation |
| Readiness | `captures/05-harmonize-review.png` -> `captures/06-validation-readiness.png` | Click Accept recommendation | Review checkpoint | Ready for review language | Operational approval |
| Dashboard | `captures/06-validation-readiness.png` -> `captures/07-dashboard.png` | Click Generate dashboard | Chart keeps context | Source notes and caveats | Chart as verdict |
| Export | `captures/07-dashboard.png` -> `captures/08-export-handoff.png` | Pan through dashboard and click Export dashboard | Move from dashboard to export | Real export action | Static dashboard ending |
| Handoff | `captures/08-export-handoff.png` -> `captures/09-handoff-summary.png` | Click handoff summary | Context survives export | Handoff package | Download-only ending |

### Part 3: When Data Is Not Ready

Composition: `TrustRiskUserFlow`
Target: 46 seconds
Audience: safety/privacy reviewers, domain partners, cautious users
Job: prove the product keeps risk visible.

| Scene | Source | Motion | Voice point | Keep | Cut |
| --- | --- | --- | --- | --- | --- |
| Risk quality | `captures/10-risk-quality.png` -> `captures/10-risk-prepare.png` | Click Harmonize data | Bad inputs stay visible | Invalid values and missing evidence | Sanitized happy path |
| Blockers | `captures/10-risk-prepare.png` -> `captures/11-risk-readiness.png` | Click Prepare dataset, then blocker spotlight | Stops must stay uncomfortable | Negative counts, invalid percentages | Softening blockers |
| Evidence before advice | `captures/04-profile-evidence.png` | Read evidence map | Validation before advice | AI optional framing | AI as authority |
| Session boundary | `captures/08-export-handoff.png` | Read boundary | Session-only rows | Metadata-only beta storage | Persistence ambiguity |
| Handoff caveats | `captures/09-handoff-summary.png` | Read caveats | Risk stays in package | Assumptions/source notes | Clean final summary |

## Capture And Motion Checklist

Before generating:

1. Reopen `/demo` and confirm the visible UI still matches each capture.
2. Run `npm --prefix tutorial-video run capture` when dashboard, export,
   chart, readiness, or workflow UI changed.
3. Confirm every cursor target lands on a visible button, warning, caveat, or
   evidence area after pan/zoom using `capture-manifest.json`.
4. Generate click-frame, transition, and spotlight stills before rendering full
   MP4s.
5. Reject any scene where the screenshot needs narration to make sense.
6. If dashboard, export, chart, readiness, or workflow code changed since the
   last render, refresh the affected captures before generating.

## Audio Checklist

Before generating speech:

1. Confirm `scripts/generate-openai-speech.mjs` matches the transcript files.
2. Keep the voice calm, field-aware, and non-promotional.
3. Avoid background music in the current public series.
4. Regenerate MP3 only when narration changes.
5. After MP3 generation, verify each final MP4 has audio and correct duration.

## Go / No-Go Gate

Proceed to video generation only if all checks are true:

- Each part still has one audience, one job, and one CTA.
- No added scene depends on generated imagery for product proof.
- No claim implies operational approval, prediction, raw-data storage, or
  anonymous AI.
- All source captures are current and synthetic/sample-safe.
- Transcripts match narration and on-screen copy.
- A reviewer can understand the muted preview.
- The About page exposes either captions, transcript links, or enough on-screen
  copy for accessibility review.

Do not use broad external publication language until the viewer pilots in
`evaluation-rubric.md` pass.

## Next Generation Commands

Run only after the go/no-go gate passes:

```bash
npm --prefix tutorial-video run capture
npm --prefix tutorial-video run speech
npm --prefix tutorial-video run still:painpoint
npm --prefix tutorial-video run still:userflow
npm --prefix tutorial-video run still:trust
npm --prefix tutorial-video run render:painpoint
npm --prefix tutorial-video run render:userflow
npm --prefix tutorial-video run render:trust
```

Then copy the final MP4s and posters into `public/tutorial/`, update
`production-qa.md`, and smoke test `/about`.
