The workhorse button — white outline by default, ink fill for the primary action in a card, teal fill (`accent`) only for the single action that advances the workflow.

```jsx
<Button variant="accent" onClick={next}>Generate dashboard</Button>
<Button variant="primary">Accept recommendation</Button>
<Button>Adjust join</Button>
```

Notes: never more than one `accent` button per view; buttons are sentence case; disabled state is opacity .45 with `not-allowed` cursor.
