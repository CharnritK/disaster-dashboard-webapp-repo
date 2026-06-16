# Tutorial Video Production QA

This file records the red-team / blue-team production review for the tutorial
video package. It is evidence tracking, not a substitute for real viewer tests.

## Current Production Target

The production target is now a three-cut tutorial series:

| Composition | Duration | Render |
| --- | ---: | --- |
| `FragmentedDataPainpoint` | 37s | `out/fragmented-data-painpoint.mp4` |
| `PublicDemoUserFlow` | 67s | `out/public-demo-user-flow.mp4` |
| `TrustRiskUserFlow` | 46s | `out/trust-risk-user-flow.mp4` |

The series uses generated imagery only for the first seven seconds of
`FragmentedDataPainpoint`. All tutorial proof after that is actual app UI with
frame-driven cursor travel, click pulses, target rings, screenshot pan/zoom,
progress indicators, and OpenAI-generated narration.

The production storyboard, capture source, motion plan, sound plan, and release
gates live in `storyboard-capture-plan.md`.

## Coherence Pass Updates

The 2026-06-15 coherence pass tightened the three-cut package:

- About page titles now use Part 1 / Part 2 / Part 3 naming.
- Remotion scene labels now match the three-part series.
- The simulated browser chrome now reads `Dashboard Copilot /demo` instead of a
  localhost URL for public-facing polish.
- Trust/risk copy was revised to sound like product guidance, not internal QA
  commentary.
- `storyboard-capture-plan.md` now records screen, motion, sound, capture
  source, and QA gates for every scene.
- Voiceover MP3s, MP4 renders, and About page poster files were regenerated
  after the source copy changes.

## Pre-Generation Material Review

The 2026-06-15 pre-generation review added `pre-generation-brief.md` as the
single source for the next render pass. It keeps the package in a pre-production
discipline:

- use one generated image only for the Part 1 opener;
- keep Parts 2 and 3 entirely app-footage driven;
- verify capture, motion, narration, transcript, and trust-boundary alignment
  before spending another render or speech-generation cycle;
- treat the current package as internally render-ready, not externally
  market-tested, until the viewer pilots in `evaluation-rubric.md` pass.
- use `PublicDemoUserFlow` as the lead tutorial asset when only one video can be
  shown, because it is the clearest end-to-end product proof.
- keep the older `DashboardCopilotTutorial` composition internal unless it gets
  a fresh public-release storyboard and pilot threshold.

## 2026-06-16 Latest UI Regeneration

The latest app changes affected dashboard/chart/export and risky-sample
surfaces, so the tutorial source captures and three public tutorial cuts were
refreshed.

- Added `npm run capture` in `tutorial-video/package.json`.
- Added `scripts/capture-demo-screens.mjs` to replay `/demo` through local
  Edge/Chrome CDP and overwrite `public/captures/*.png`.
- Recaptured 12 product screens as full-page screenshots and wrote
  `public/captures/capture-manifest.json` with image dimensions and measured
  button/target rectangles.
- Updated the risky path to match the current UI:
  `Use risky quality sample` -> `Profile data` -> `Harmonize data` ->
  `Prepare dataset` -> `Not safe for action yet`.
- Regenerated posters and MP4s for `FragmentedDataPainpoint`,
  `PublicDemoUserFlow`, and `TrustRiskUserFlow`.
- Copied refreshed MP4s and posters to `public/tutorial/`.
- Did not regenerate voiceover MP3s; narration and transcripts did not change.

## 2026-06-16 Motion Repair Pass

The user explicitly rejected earlier renders for misclicks, weak top-to-bottom
transitions, and missing highlights. The latest source addresses those issues:

- `FragmentedDataPainpoint` now uses real before/click/after pairs:
  `02-upload` -> `03-fragmented-data`, `05-harmonize-review` ->
  `06-validation-readiness`, and `08-export-handoff` ->
  `09-handoff-summary`.
- `PublicDemoUserFlow` now shows the full causal chain:
  template -> upload -> fragmented files -> profile -> evidence coverage ->
  harmonize -> join review -> readiness -> dashboard -> export -> handoff.
- Long dashboard and workflow pages use full-page captures, measured target
  rectangles, and pan/zoom from top content to bottom action buttons.
- Click pulses now peak at the click frame instead of being visible before the
  click.
- Read-only scenes use early spotlights instead of fake clicks.
- Trust/risk order was corrected so the export boundary (`08`) appears before
  handoff caveats (`09`), avoiding a backwards state jump.
- Fresh proof stills were rendered under
  `out/qa/fresh-2026-06-16/`: 13 click stills, 6 transition/result stills, and
  4 spotlight stills.
- Representative stills were visually inspected for real target alignment:
  `public-01-template-click`, `public-03-profile-click`,
  `public-07-export-click`, `public-07-export-result`,
  `public-08-handoff-result`, `trust-02-prepare-click`,
  `trust-03-evidence-spotlight`, `trust-04-export-boundary-spotlight`,
  `trust-05-handoff-caveats-spotlight`, and `pain-01-fragmented-click`.

Current public asset sizes after this pass:

| File | Size |
| --- | ---: |
| `public/tutorial/fragmented-data-painpoint.mp4` | 19.8 MB |
| `public/tutorial/public-demo-user-flow.mp4` | 32.6 MB |
| `public/tutorial/trust-risk-user-flow.mp4` | 22.8 MB |
| `public/tutorial/fragmented-data-painpoint-poster.png` | 0.74 MB |
| `public/tutorial/public-demo-user-flow-poster.png` | 0.26 MB |
| `public/tutorial/trust-risk-user-flow-poster.png` | 0.26 MB |

## Browser-Verified User Path

Verified against the in-app browser at `http://localhost:3002/demo`:

`Use template and continue` -> `Use fragmented demo data needs + population +
capacity` -> `Profile data` -> `Harmonize data` -> `Accept recommendation` ->
`Generate dashboard` -> `Export dashboard` -> `Generate handoff summary`.

Observed live headings and states included:

- `Review Data Profiling`
- `Evidence coverage`
- `Review before combining files`
- `Review the Leading Join Recommendation`
- `Ready for review`
- `Dashboard signals`
- `Export Dashboard Assets`
- `Deterministic fallback`
- `No raw uploaded rows were sent to the copilot route`

Automated capture was refreshed against the same local demo target with:

```bash
npm --prefix tutorial-video run capture
```

## Red-Team Findings Addressed

1. Risky public upload wording in the walkthrough composition.
   - Fix: public-demo copy directs viewers to bundled synthetic samples and
     warns against sensitive or live operational uploads.

2. Overbroad persistence wording.
   - Fix: trust/risk copy distinguishes session-only uploaded rows from
     controlled-beta metadata-only persistence.

3. Missing fragmented-data proof moment in the opener.
   - Fix: opener now moves from one emotional generated image into
     `captures/03-fragmented-data.png`, then product proof.

4. Missing real user motion.
   - Fix: added `MotionScreenshotScene` with browser chrome, animated cursor,
     click pulse, target ring, screenshot pan/zoom, checklist, and progress.

5. Click targets landing on empty screenshot space.
   - Fix: cursor, target ring, and click pulse now share the same transformed
     screenshot plane; per-scene target coordinates were retuned against
     rendered click-frame stills.

6. Storyline too long.
   - Fix: split into three tutorial cuts: emotional hook, public demo user flow,
     and trust/risk user flow.

7. Accessibility evidence incomplete.
   - Fix: all three current cuts now have transcripts in `transcripts/`; no
     critical meaning depends on audio.

8. Silent cuts did not meet the narrated tutorial request.
   - Fix: `npm run speech` generates MP3 voiceover tracks through OpenAI
     `POST /v1/audio/speech`; Remotion includes those tracks in each current
     production composition.

## Production Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| No false product claim | Pass | Copy says review support, not approval; "ready for review" is framed as a checkpoint. |
| No sensitive-data exposure | Pass | Uses bundled synthetic captures and non-readable generated opener. |
| Trust boundary explicit | Pass | Trust/risk video states session-only rows, metadata-only beta storage, deterministic authority. |
| Workflow reproducible | Pass | Browser replay confirmed the actual `/demo` click path and headings. |
| No dev artifacts | Pass | Fresh posters show neutral `Dashboard Copilot /demo` chrome with no dev overlay. |
| Accessibility baseline | Pass | Narration, on-screen text, and transcripts for all three current cuts. |
| Ethical visual tone | Pass | One respectful, non-graphic generated opener; no disaster sensationalism. |
| External viewer pilot | Not run | Required before broad external publication, not required for internal render handoff. |

## Render Evidence

Latest 2026-06-16 commands run successfully:

```bash
node --check tutorial-video/scripts/capture-demo-screens.mjs
npm --prefix tutorial-video run lint
npm --prefix tutorial-video run capture
npm --prefix tutorial-video run still:painpoint
npm --prefix tutorial-video run still:userflow
npm --prefix tutorial-video run still:trust
npm --prefix tutorial-video run render:painpoint
npm --prefix tutorial-video run render:userflow
npm --prefix tutorial-video run render:trust
npm run lint
npm run test
npm run build
```

Notes:

- `npx remotion still` was not used for the latest QA still pack because `npx`
  attempted a network registry lookup in restricted mode. The local
  `tutorial-video/node_modules/.bin/remotion.cmd` binary was used instead.
- Remotion still/render, root Vitest, and root build required local child
  process spawning on Windows and were run with the required escalation after
  sandbox `spawn EPERM` failures.
- `npm run test` passed after escalation: 20 files, 160 tests.
- `npm run build` passed after clearing stale `.next`; final packaged output is
  under `dist/`.
- The build still reports the existing Supabase Edge Runtime warning from
  `lib/supabase/middleware.ts`.

Latest rendered files:

| File | Size |
| --- | ---: |
| `out/fragmented-data-painpoint.mp4` | 19.8 MB |
| `out/public-demo-user-flow.mp4` | 32.6 MB |
| `out/trust-risk-user-flow.mp4` | 22.8 MB |

Generated voiceover files:

| File | Size |
| --- | ---: |
| `public/voiceover/fragmented-data-painpoint.mp3` | 0.47 MB |
| `public/voiceover/public-demo-user-flow.mp3` | 0.51 MB |
| `public/voiceover/trust-risk-user-flow.mp3` | 0.45 MB |

`ffprobe` is not installed on this machine. Duration targets are controlled by
composition frame counts at 30 fps: 37s, 67s, and 46s.

About-page smoke:

- `http://localhost:3016/about` returned 200 after dev-server warmup.
- Browser DOM smoke found `videoCount=3`, the three expected Part 1 / Part 2 /
  Part 3 titles, the three revised MP4 source URLs, the three revised poster
  URLs, and no `/tutorial/dashboard-copilot-tutorial.mp4` source.
- HEAD checks for all three MP4s and all three posters returned 200 with
  `video/mp4` or `image/png` content types.
- The final packaged `dist/server/app/about.html` and `.rsc` reference all
  three revised video names and do not reference the old single tutorial.

## Internal Scoring

Current internal render-readiness score: **97/100**.

Note: this score is the main-agent internal QA score after addressing the
earlier red-team and blue-team blockers. A second async sub-agent review was
requested after the final renders but did not return within the wait window and
was closed, so this is not an independent final reviewer score.

| Category | Points | Score | Evidence |
| --- | ---: | ---: | --- |
| Audience fit and job-to-be-done | 10 | 10 | Each cut has one audience and one job. |
| Story arc | 15 | 14 | Strong pain -> proof -> handoff arc; technical deep dive remains separate. |
| Instructional usability | 15 | 15 | Browser-verified path and exact button labels. |
| Trust and product truth | 15 | 15 | Review-only, deterministic fallback, session boundary, metadata-only persistence. |
| Cognitive load | 10 | 9 | One idea per scene; some screenshot details are intentionally small. |
| Emotional credibility | 10 | 9 | Respectful opener; no graphic or pity framing. |
| Accessibility | 10 | 10 | Narration, on-screen text, and transcripts; no audio-only meaning. |
| Production quality | 8 | 8 | Clean renders, readable stills, stable frame-driven motion. |
| Conversion and handoff | 7 | 7 | Viewer sees how to run demo and inspect/export handoff. |
| Total | 100 | 97 | Internal render-ready handoff; external pilot still required for broad publication. |

## Remaining Publication Gate

Before broad external publication, run the pilot tests from
`evaluation-rubric.md`:

1. Five cold viewers for `FragmentedDataPainpoint`.
2. Five first-time users for `PublicDemoUserFlow`.
3. Three safety/privacy reviewers for `TrustRiskUserFlow`.

Do not claim market-tested tutorial performance until those pilots pass.
