---
name: dashboard-copilot-design
description: Use this skill to generate well-branded interfaces and assets for Dashboard Copilot (DataKind's humanitarian dashboard tool), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key facts for quick orientation:
- Brand: quiet, paper-like analyst worksheet. Warm off-whites, hairline borders, graph-paper page background, one deep teal accent (#235f58).
- Type: Rethink Sans only (Google Fonts, variable 400–800); headings at weight 720; no emoji, no icons — use text pills instead.
- Severity convention: 4px left border (blue info / teal good / amber review / red blocking).
- Tokens live in `tokens/*.css` (linked via `styles.css`); components in `components/*/`; full app recreation in `ui_kits/dashboard-copilot/`.
