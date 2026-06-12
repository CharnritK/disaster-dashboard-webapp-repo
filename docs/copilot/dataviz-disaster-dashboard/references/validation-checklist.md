# Visualization Validation Checklist

Use this checklist before claiming a dashboard visualization change is complete.

- Chart specs pass through `enforceVizPolicy()`.
- Pie overflow converts to bar.
- Invalid part-to-whole values do not render as pie.
- Line charts require at least two valid time points.
- Bar charts default to value-descending sort.
- Line charts default to time-ascending sort.
- High-risk quality fields produce visible `warn` or `block` status.
- Raw-count choropleths fall back to bar/table.
- Mobile behavior is present on every chart after policy enforcement.
- Chart card has a title, quality badge, screen-reader summary, and caveat/source slot.
- No new dependency, storage, external browser call, or map service was added without explicit approval.
