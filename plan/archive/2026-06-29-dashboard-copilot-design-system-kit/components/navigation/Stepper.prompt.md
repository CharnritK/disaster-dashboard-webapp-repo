Numbered pill stepper for the guided workflow. Completed steps go soft teal, the active step is ink-filled, upcoming steps are translucent and disabled.

```jsx
<Stepper
  steps={["Template", "Upload", "Profile", "Harmonize", "Dataset", "Dashboard", "Export"]}
  currentIndex={2}
  onNavigate={goTo}
/>
```
