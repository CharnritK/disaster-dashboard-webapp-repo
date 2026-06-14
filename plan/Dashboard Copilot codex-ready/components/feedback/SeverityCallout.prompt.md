Severity tile: panel background, 4px colored left border. Use for insights, quality checks, evidence coverage items, readiness notes.

```jsx
<SeverityCallout severity="medium" title="Response gap data partially missing" meta={<Pill uppercase>data gap</Pill>}>
  <span style={{ color: "var(--muted)" }}>response_gap_percent is 18% missing in East District.</span>
</SeverityCallout>
```

Severity mapping: `info` blue (neutral), `low` teal (good), `medium` amber (review), `high` red (blocking).
