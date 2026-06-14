Sticky glassy header: plain-text brand (1.08rem / 720), pill nav links, right-side slot for status + toggles. The whole bar tints blue while loading.

```jsx
<AppHeader links={[{ label: "About", href: "/about" }]} loading={busy}>
  {busy && <LoadingBanner />}
  <ToggleSwitch label="AI" checked={ai} onChange={setAi} />
</AppHeader>
```
