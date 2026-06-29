Horizontal bar rows — the product's main chart. Values print inside the bar; bars grow from the left (520ms). Put it inside a `Card` with a title and one-line rationale.

```jsx
<BarChart items={[
  { label: "North District", value: 642 },
  { label: "Central District", value: 792 },
]} />
```

Use `color="var(--amber)"` for missingness charts. Hover/highlight color across all charts is `var(--chart-2)` orange.
