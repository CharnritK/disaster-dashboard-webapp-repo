import { AiTrialPanel } from "@/components/AiTrialPanel";

export default function AiTrialPage() {
  return (
    <main className="ai-trial-page workspace-secondary-shell">
      <section className="ai-trial-hero" aria-labelledby="ai-trial-title">
        <p className="eyebrow">AI trial</p>
        <h1 id="ai-trial-title">Test AI-assisted dashboard synthesis</h1>
        <p>
          Run one controlled sample through the same authenticated,
          quota-governed AI path used by the workspace. The sample stays
          synthetic; the app uses its server-managed provider key when enabled.
        </p>
      </section>
      <AiTrialPanel />
    </main>
  );
}
