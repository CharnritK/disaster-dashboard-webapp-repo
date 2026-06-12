# Dashboard Copilot Tutorial Video

Remotion project for a short tutorial that shows the business workflow and the technical architecture behind Dashboard Copilot.

## Storyline

1. Business framing: Dashboard Copilot is operational decision support, not automatic approval.
2. Product walkthrough: decision template, upload, profiling, harmonization, validation, dashboard, exports.
3. Risk path: unsafe data can still be inspected, but blockers stay visible.
4. Technical architecture: browser session boundary, server routes, minimized LLM payloads, deterministic fallback, and core modules.

## Commands

```bash
npm install
npm run dev
npm run still
npm run render
npm run lint
```

The main composition is `DashboardCopilotTutorial`.

## Captured Assets

Screenshots live in `public/captures/`. They were captured from the local app running with `NEXT_PUBLIC_COPILOT_API_ENABLED=false`, so the tutorial does not depend on API keys or provider availability.

## Notes

- The video uses plain React/CSS plus Remotion primitives.
- There is no voiceover file yet; the visible scene copy is written so it can double as a narration outline.
- Render outputs go to `out/`, which is intentionally gitignored.
