# Dashboard Copilot Tutorial Video

Remotion project for tutorial and showcase videos that show the pain of
fragmented disaster-response data, the real `/demo` user flow, and the trust
boundary behind Dashboard Copilot.

## Rendered Series

The current production target is a three-cut tutorial series:

1. `FragmentedDataPainpoint` - 37 seconds. Emotional hook plus real UI proof.
   Uses one generated opener image, then actual product screenshots with cursor
   motion.
2. `PublicDemoUserFlow` - 67 seconds. First-time public demo walkthrough:
   template, fragmented sample, profile, harmonize, readiness, dashboard,
   export, and handoff.
3. `TrustRiskUserFlow` - 46 seconds. Failure-mode and privacy-boundary tutorial:
   risky sample, blockers, evidence-before-advice, handoff caveats, and
   session-only rows.

The older `DashboardCopilotTutorial` composition remains available as a longer
business/architecture walkthrough, but it is not the preferred first tutorial
asset and should stay internal unless it receives the same storyboard,
transcript, and pilot treatment as the three current cuts.

## Storyline

The production storyboard and screen/motion/sound capture map lives in
`storyboard-capture-plan.md`. The narrative outline lives in `storylines.md`.
The pre-generation material brief lives in `pre-generation-brief.md`. The
testing scenarios, thresholds, and scoring criteria live in
`evaluation-rubric.md`. The production review log lives in `production-qa.md`.

Core message:

- Fragmented data makes trust hard, not just charting.
- The public demo uses bundled synthetic data and no account or API key.
- Users must see evidence coverage, join review, readiness, caveats, and handoff.
- The app supports review. It does not approve operational action.
- Uploaded rows stay session-only; controlled-beta persistence is limited to
  approved metadata surfaces.

## Commands

```bash
npm install
npm run dev
npm run capture
npm run speech
npm run still:painpoint
npm run still:userflow
npm run still:trust
npm run render:painpoint
npm run render:userflow
npm run render:trust
npm run lint
```

Rendered MP4 outputs go to `out/`:

- `out/fragmented-data-painpoint.mp4`
- `out/public-demo-user-flow.mp4`
- `out/trust-risk-user-flow.mp4`

## Captured Assets

Screenshots live in `public/captures/`. Regenerate them from a running local
demo with `npm run capture`, which launches local Edge/Chrome headless through
the Chrome DevTools Protocol and replays the deterministic `/demo` path. The
default target is `http://localhost:3002/demo`; override it with `APP_URL` when
needed.

The capture script writes full-page screenshots plus
`public/captures/capture-manifest.json`. The manifest records image dimensions
and measured button/target rectangles so cursor clicks and spotlight overlays
can stay attached to the real UI after Remotion pan/zoom.

Generated emotional stills live in `public/generated/`. The current production
series uses generated imagery only where it is important: the first seven
seconds of `FragmentedDataPainpoint`. Product proof comes from captured app
screenshots and simulated user motion.

Voiceover tracks live in `public/voiceover/`. Generate them with
`npm run speech`, which calls OpenAI `POST /v1/audio/speech` using
`OPENAI_API_KEY` or `LLM_API_KEY` from the environment or local env files. Do
not commit API keys.

When a narration script, visible part label, or on-screen scene copy changes,
regenerate the affected MP3 and rendered MP4 before copying final assets to
`../public/tutorial/`.

## Accessibility

The current cuts include generated narration plus on-screen text. Critical
meaning does not depend on audio alone. Transcripts live in `transcripts/`.

## Notes

- The video uses plain React/CSS plus Remotion primitives.
- Cursor travel, target rings, click pulses, before/after screen transitions,
  screenshot pan/zoom, and progress bars are frame-driven through Remotion.
- Cursor target rings share the same pan/zoom transform as the captured UI, so
  click markers stay attached to the visible screenshot plane.
- Fresh click/transition/spotlight proof stills from the latest motion pass live
  under `out/qa/fresh-2026-06-16/`.
- Render outputs go to `out/`, which is intentionally gitignored.
