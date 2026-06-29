The only floating UI besides the modal. Ink-black chip, 7px radius, appears above the trigger with a 140ms fade + 4px rise. Use it for data detail on hover (chart marks, truncated values) — never for help text that matters; important caveats belong in visible Notices.

```jsx
<Tooltip label={<><strong>Central District</strong><span style={{ color: "#e7e7e2", display: "block" }}>792 people assessed</span></>}>
  <Pill tone="panel">Central District</Pill>
</Tooltip>
```
