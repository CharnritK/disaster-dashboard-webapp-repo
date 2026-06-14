import { TemplateBuilder } from "@/components/TemplateBuilder";

export default function NewTemplatePage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel-wide" aria-labelledby="new-template-title">
        <p className="eyebrow">Draft template</p>
        <h1 id="new-template-title">New decision template</h1>
        <TemplateBuilder />
      </section>
    </main>
  );
}
