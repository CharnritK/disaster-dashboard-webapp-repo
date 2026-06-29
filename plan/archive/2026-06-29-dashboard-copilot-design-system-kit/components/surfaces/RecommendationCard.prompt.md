The teal hero card that carries the system's recommendation, with a darkened "Why:" rationale box. The only large block of saturated color in the product — never more than one per view.

```jsx
<RecommendationCard
  title="Combine files on shared district codes"
  why={<>Both files share <code>admin_pcode</code> with a 96% match rate.</>}
  actions={<>
    <Button style={{ background: "white", borderColor: "white", color: "var(--ink)" }}>Accept recommendation</Button>
    <Button style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.22)", color: "white" }}>Adjust join</Button>
  </>}
>
  Joining adds population baselines to every assessment row.
</RecommendationCard>
```
