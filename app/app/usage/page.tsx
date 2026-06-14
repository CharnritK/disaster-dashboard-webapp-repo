import { UsageMeter } from "@/components/UsageMeter";

export default function UsagePage() {
  return (
    <main className="auth-shell workspace-secondary-shell">
      <section className="auth-panel auth-panel-wide" aria-labelledby="usage-title">
        <p className="eyebrow">Usage</p>
        <h1 id="usage-title">AI usage</h1>
        <p className="auth-lede">
          Daily quota is counted only when the server attempts an AI provider
          call. Deterministic workflow fallback remains available when quota is
          exhausted.
        </p>
        <UsageMeter enabled />
      </section>
    </main>
  );
}
