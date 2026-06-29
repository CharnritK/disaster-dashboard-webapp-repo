The product's only overlay surface (used for the decision map). Same card grammar as everything else — white, 1px line, 8px radius — just lifted on a deeper shadow over a 34% ink scrim. The close affordance is a normal text Button in the header, never an × glyph. Body content is typically nested `--panel` tiles.

```jsx
<Modal
  title="How this decision maps to data"
  description="Signals, datasets, and caveats feeding the flood-response brief."
  maxWidth="640px"
  onClose={() => setOpen(false)}
>
  <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 8, padding: 14 }}>…</div>
</Modal>
```
