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
| No dev artifacts | Pass | Reviewed stills show clean `localhost:3002/demo` UI with no dev overlay. |
| Accessibility baseline | Pass | Narration, on-screen text, and transcripts for all three current cuts. |
| Ethical visual tone | Pass | One respectful, non-graphic generated opener; no disaster sensationalism. |
| External viewer pilot | Not run | Required before broad external publication, not required for internal render handoff. |

## Render Evidence

Commands run successfully:

```bash
npm run lint
npm run speech
npm run still:painpoint
npm run still:userflow
npm run still:trust
npx remotion still PublicDemoUserFlow --frame=178 --scale=0.35 out/qa/clicks/public-01-template.png
npx remotion still PublicDemoUserFlow --frame=443 --scale=0.35 out/qa/clicks/public-02-load-sample.png
npx remotion still PublicDemoUserFlow --frame=750 --scale=0.35 out/qa/clicks/public-03-profile.png
npx remotion still PublicDemoUserFlow --frame=1044 --scale=0.35 out/qa/clicks/public-04-harmonize.png
npx remotion still PublicDemoUserFlow --frame=1324 --scale=0.35 out/qa/clicks/public-05-readiness.png
npx remotion still PublicDemoUserFlow --frame=1596 --scale=0.35 out/qa/clicks/public-06-dashboard.png
npx remotion still PublicDemoUserFlow --frame=1908 --scale=0.35 out/qa/clicks/public-07-handoff.png
npx remotion still TrustRiskUserFlow --frame=176 --scale=0.35 out/qa/clicks/trust-01-risk-quality.png
npx remotion still TrustRiskUserFlow --frame=480 --scale=0.35 out/qa/clicks/trust-02-risk-readiness.png
npx remotion still TrustRiskUserFlow --frame=737 --scale=0.35 out/qa/clicks/trust-03-evidence-before-ai.png
npx remotion still TrustRiskUserFlow --frame=1013 --scale=0.35 out/qa/clicks/trust-04-handoff-caveats.png
npx remotion still TrustRiskUserFlow --frame=1288 --scale=0.35 out/qa/clicks/trust-05-export-boundary.png
npx remotion still FragmentedDataPainpoint --frame=349 --scale=0.35 out/qa/clicks/pain-02-fragmented-proof.png
npx remotion still FragmentedDataPainpoint --frame=583 --scale=0.35 out/qa/clicks/pain-03-evidence-profile.png
npx remotion still FragmentedDataPainpoint --frame=823 --scale=0.35 out/qa/clicks/pain-04-reviewable-join.png
npx remotion still FragmentedDataPainpoint --frame=1039 --scale=0.35 out/qa/clicks/pain-05-human-handoff.png
npx remotion still PublicDemoUserFlow --frame=1860 --scale=0.5 out/qa/public-demo-user-flow-handoff.png
npx remotion still TrustRiskUserFlow --frame=1230 --scale=0.5 out/qa/trust-risk-user-flow-final.png
npx remotion still FragmentedDataPainpoint --frame=1020 --scale=0.5 out/qa/fragmented-data-painpoint-final-motion.png
npm run render:painpoint
npm run render:userflow
npm run render:trust
```

Rendered files:

| File | Size |
| --- | ---: |
| `out/fragmented-data-painpoint.mp4` | 21.5 MB |
| `out/public-demo-user-flow.mp4` | 35.0 MB |
| `out/trust-risk-user-flow.mp4` | 23.5 MB |

Generated voiceover files:

| File | Size |
| --- | ---: |
| `public/voiceover/fragmented-data-painpoint.mp3` | 0.46 MB |
| `public/voiceover/public-demo-user-flow.mp3` | 0.54 MB |
| `public/voiceover/trust-risk-user-flow.mp3` | 0.50 MB |

`ffprobe` is not installed on this machine. Duration and stream verification
were checked with the installed `mediabunny` parser:

| File | Duration | Video | Audio |
| --- | ---: | --- | --- |
| `out/fragmented-data-painpoint.mp4` | 37s | 1920x1080 | 48 kHz stereo |
| `out/public-demo-user-flow.mp4` | 67s | 1920x1080 | 48 kHz stereo |
| `out/trust-risk-user-flow.mp4` | 46s | 1920x1080 | 48 kHz stereo |

## Internal Scoring

Current internal score: **97/100**.

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
| Total | 100 | 97 | Internal production-ready handoff; external pilot still recommended. |

## Remaining Publication Gate

Before broad external publication, run the pilot tests from
`evaluation-rubric.md`:

1. Five cold viewers for `FragmentedDataPainpoint`.
2. Five first-time users for `PublicDemoUserFlow`.
3. Three safety/privacy reviewers for `TrustRiskUserFlow`.

Do not claim market-tested tutorial performance until those pilots pass.
