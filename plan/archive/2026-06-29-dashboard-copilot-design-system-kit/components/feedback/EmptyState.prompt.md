Empty regions are never blank — they explain what is missing and what to do next, in plain sentences. The dashed border is the only place the system breaks its solid-hairline rule; it signals "nothing here yet" without color. No illustrations, no icons.

```jsx
<EmptyState
  title="Add data to begin"
  actions={<><Button tone="primary">Upload files</Button><Button>Use sample data</Button></>}
>
  <p style={{ margin: 0 }}>Upload CSV or XLSX files to profile, harmonize, and build a reviewable dashboard.</p>
</EmptyState>

<EmptyState compact title="No blocking quality issues were found.">
  Quality checks cover missingness, duplicates, and join coverage.
</EmptyState>
```
