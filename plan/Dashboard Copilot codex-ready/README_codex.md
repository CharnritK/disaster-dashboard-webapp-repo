
# Dashboard Copilot Design System — Codex Handoff

This design-system package includes the original components and tokens from the Claude Design deliverable, plus updates for Codex implementation.

## Key Updates

- Added **semantic color tokens** in `tokens/colors.css` to align with the future implementation plan. These tokens follow the naming scheme `--color-<category>-<element>` for neutral, brand (accent), info (AI), warning, danger, and success states. Each category includes `solid`, `surface`, `border`, and related variations. Old tokens like `--ink`, `--accent`, `--blue`, `--amber`, and `--red` are preserved and aliased so existing code continues to work.
- This package still contains the comprehensive design-system specification in `Dashboard Copilot Design System.dc.html`, which defines principles, tokens, components, AI/governance states, data visualization rules, workflow guidance, accessibility requirements, implementation roadmap, QA checklist, and risks.

## For Codex

Use this package to implement the design system in the Next.js / React / TypeScript repository by following the multi-PR roadmap described in the design-system spec. Start by updating the repository’s global CSS tokens to reference the new semantic names (see `tokens/colors.css`) while keeping legacy aliases intact.

Refer to the design-system specification for detailed guidance on component anatomy, workflows, data visualization standards, AI state handling, accessibility, and implementation phases.

