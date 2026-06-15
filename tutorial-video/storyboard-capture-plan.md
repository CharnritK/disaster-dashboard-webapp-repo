# Tutorial Storyboard And Capture Plan

This is the production map for the current three-part tutorial series. Use it
before recapturing screens, retuning cursor motion, changing narration, or
publishing a new cut.

The series job is:

1. Make the pain of fragmented data concrete.
2. Show the public demo path a first-time user can reproduce.
3. Prove the product keeps risk, caveats, AI, and privacy boundaries visible.

Generated imagery is allowed only when it does work that real app footage
cannot do. In the current series, that means the first seven seconds of Part 1
only. All product proof should use current app screenshots or direct browser
capture.

The additional generated stills in `public/generated/` are alternates. They are
not part of the current public release unless a future storyboard explicitly
promotes them.

## Capture Rules

- Capture safe app states only: bundled synthetic samples, risky sample, or
  non-readable generated imagery.
- Keep `/demo` deterministic and AI off for the public tutorial path.
- Use a 1920 x 1080 desktop capture target. The Remotion compositions render at
  1920 x 1080, so screenshots should be framed for that aspect ratio.
- Keep browser/app chrome visible enough to prove this is the real product, but
  use Remotion pan/zoom so the active decision area is readable.
- Public-facing video chrome should use a neutral label such as
  `Dashboard Copilot /demo`; avoid visible localhost labels unless the cut is
  explicitly internal.
- Capture after the relevant user action has completed. Avoid loading spinners
  unless the scene is explicitly about waiting.
- Do not show dev overlays, console panes, localhost errors, credentials,
  personal data, live incident details, or real operational coordinates.
- Keep filenames stable under `tutorial-video/public/captures/` so Remotion
  scenes remain deterministic.

## Motion Rules

- Simulate real use: cursor starts away from the target, travels once, then
  clicks or reads the visible target.
- Use one primary motion per scene: click, read, hover, pan, or zoom.
- Cursor, target ring, and click pulse must share the same screenshot transform.
- Pan/zoom should clarify the active area, not create cinematic movement for
  its own sake.
- Avoid rapid cuts. A viewer should understand the screen if paused at any
  random moment.

## Sound Rules

- Voice tone: calm, field-aware, direct, no hype.
- Music: optional only as a very quiet bed for Part 1; do not use manipulative
  disaster-drama scoring.
- Do not use background music in the current public series unless a future
  review decides it materially improves comprehension. Narration should stay
  dominant.
- Each scene needs an on-screen equivalent for the voiceover point. No critical
  meaning should be audio-only.
- Regenerate `public/voiceover/*.mp3` whenever narration in
  `scripts/generate-openai-speech.mjs` changes.
- Update `transcripts/*.md` in the same change as narration or on-screen copy.

## Part 1: Why Trust Breaks Before The Chart

Composition: `FragmentedDataPainpoint`
Audience: executives, judges, domain partners
Target duration: 30-45 seconds
Job: make fragmented-data pain felt, then prove the app path is real.

| Time | Scene | Capture source | Screen proof | Motion | Sound and copy | QA gate |
| --- | --- | --- | --- | --- | --- | --- |
| 0-7s | Problem pressure | `generated/emotional-01-night-ops.png` | Respectful, non-graphic analyst pressure moment | Slow image scale, no cursor | "The hardest part is knowing whether the chart can be trusted." | Generated image is respectful, not sensational. |
| 7-14s | Fragmented sample | `captures/03-fragmented-data.png` | Bundled fragmented synthetic sample buttons and parsed previews | Cursor clicks fragmented sample path | "Show the fragmentation before solving it." | No real upload path is implied; no sensitive data shown. |
| 14-22s | Evidence profile | `captures/04-profile-evidence.png` | Dataset profiles and evidence coverage | Pan to evidence coverage; target ring on evidence area | "Make uncertainty visible early." | Viewer can see profiling before recommendation. |
| 22-30s | Reviewable join | `captures/05-harmonize-review.png` | Join key, join reason, safe cleaning text | Cursor clicks accept recommendation | "Do not silently combine fragile data." | Row-preserving and explainable language is visible. |
| 30-37s | Human handoff | `captures/09-handoff-summary.png` | Handoff summary and deterministic fallback note | Cursor clicks handoff summary | "Clearer evidence. Human-owned action." | Final line does not imply operational approval. |

Part 1 CTA: continue to Part 2 or run the public demo.

## Part 2: Run The Public Demo

Composition: `PublicDemoUserFlow`
Audience: first-time users
Target duration: 60-90 seconds
Job: show the exact deterministic `/demo` path without account, API key, AI, or
sensitive data.

| Time | Scene | Capture source | Screen proof | Motion | Sound and copy | QA gate |
| --- | --- | --- | --- | --- | --- | --- |
| 0-9s | Decision template | `captures/01-template.png` | Decision question, owner, geography, timeframe, evidence signals | Cursor reads decision map area | "Start with the decision, not the chart." | The workflow starts with decision context, not charts. |
| 9-18s | Load fragmented sample | `captures/03-fragmented-data.png` | Synthetic fragmented sample and data-source caution | Cursor clicks fragmented sample button | "Load realistic fragmented evidence." | Public path is reproducible without upload. |
| 18-28s | Profile evidence | `captures/04-profile-evidence.png` | Field roles, missingness, evidence coverage | Pan to evidence coverage | "Make data quality visible early." | Evidence coverage is readable enough at pause. |
| 28-38s | Review join | `captures/05-harmonize-review.png` | Join recommendation, join key, cleaning actions | Cursor clicks accept recommendation | "Review the join before combining files." | No hidden deletion, imputation, fuzzy matching, or recoding. |
| 38-47s | Readiness checkpoint | `captures/06-validation-readiness.png` | Ready for review and generate dashboard action | Cursor clicks generate dashboard | "Use readiness as a review checkpoint." | Copy says review, not approval. |
| 47-57s | Dashboard | `captures/07-dashboard.png` | Dashboard signals, source notes, caveats | Pan to dashboard signals and export step | "Generate a dashboard that keeps caveats visible." | Source/caveat language remains attached. |
| 57-67s | Handoff | `captures/09-handoff-summary.png` | Handoff summary and review assets | Cursor clicks handoff summary | "Package the decision handoff without losing context." | Viewer knows the final decision stays with the team. |

Part 2 CTA: open `/demo` and reproduce the path.

## Part 3: When Data Is Not Ready

Composition: `TrustRiskUserFlow`
Audience: safety/privacy reviewers, cautious users, domain partners
Target duration: 40-70 seconds
Job: show the failure path and privacy boundary without softening it.

| Time | Scene | Capture source | Screen proof | Motion | Sound and copy | QA gate |
| --- | --- | --- | --- | --- | --- | --- |
| 0-9s | Risky sample quality | `captures/10-risk-quality.png` | Risky sample profile, duplicate indicator, missing evidence | Cursor/read target on risk indicator | "Show when the data is not safe yet." | Bad inputs are visible, not hidden. |
| 9-19s | Readiness blockers | `captures/11-risk-readiness.png` | Not safe for action yet, blockers, invalid values | Pan to blockers; target ring on blocker area | "Let blockers stay uncomfortable." | Stop conditions are not visually minimized. |
| 19-28s | Evidence before advice | `captures/04-profile-evidence.png` | Evidence coverage before recommendations | Cursor reads evidence map | "Evidence comes before advice." | AI is optional/advisory; deterministic validation is authoritative. |
| 28-37s | Handoff caveats | `captures/09-handoff-summary.png` | Handoff narrative, caveats, assumptions, fallback | Pan to narrative and caveat area | "Keep the risk in the package." | Caveats survive export/handoff. |
| 37-46s | Session boundary | `captures/08-export-handoff.png` | Export package boundary and no raw row persistence claim | Cursor reads export boundary | "Close with the session boundary." | Session-only rows and metadata-only beta storage are explicit. |

Part 3 CTA: review the boundary before beta use.

## Collection Plan

Use this sequence when updating captures:

1. Start the app locally and open `/demo`.
2. Confirm AI is off and the public deterministic path is visible.
3. Replay the public demo path:
   `Use template and continue` -> `Use fragmented demo data needs + population
   + capacity` -> `Profile data` -> `Harmonize data` ->
   `Accept recommendation` -> `Generate dashboard` -> `Export dashboard` ->
   `Generate handoff summary`.
4. Capture the stable post-action state for each required screen.
5. Replay the risky sample path and capture quality/readiness blockers.
6. Update Remotion scene config only after the capture names and target areas
   are settled.
7. Generate click-frame stills for each cursor target and inspect that the ring
   lands on the intended UI element.
8. Regenerate narration only when the script changes.
9. Render all three cuts and copy the MP4s/posters to `public/tutorial/`.
10. Update transcripts, `production-qa.md`, and About page titles in the same
    change.

## Release Decision Gates

Do not publish wider than internal review unless all gates pass.

| Gate | Pass condition |
| --- | --- |
| Storyboard | Audience, job, claim, CTA, and trust boundary are clear for each part. |
| Capture | Every product scene maps to a current real app state. |
| Motion | Cursor and target rings match the active UI element after pan/zoom. |
| Sound | Narration matches source script and transcripts; no critical audio-only meaning. |
| Trust | No claim of operational approval, prediction, raw-data persistence, or anonymous AI. |
| Accessibility | Transcript exists, text is readable at 1080p and mobile preview, silent preview works. |
| Viewer pilot | Required participant thresholds in `evaluation-rubric.md` pass before broad publication. |

## Known Open Decision

The current public series is three parts. Analyst deep dive and technical
architecture explainer remain useful future modules, but they should not be
presented as part of the current public tutorial release until they are actually
storyboarded, rendered, embedded, and pilot-tested.
