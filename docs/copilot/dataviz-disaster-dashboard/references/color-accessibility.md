# Color And Accessibility Rules

Color is a support cue, not the only cue.

## Color Roles

- Neutral context: text, grid, table, and panel surfaces.
- Primary emphasis: one focal series or mark family.
- Categorical comparison: limited semantic palette.
- Quality status: `ok`, `warn`, and `block` tokens only.

## Requirements

- Critical status must include visible text.
- Chart marks need keyboard focus where they expose details.
- Screen-reader summaries must explain the chart purpose and fields.
- Avoid low-contrast marks and labels.
- Avoid rotated labels; use horizontal labels, truncation with accessible titles, or table fallback.

## Current Implementation

Shared tokens live in `lib/vizRules/`. Chart card metadata and quality status render through `components/charts/ChartFrame.tsx`.
