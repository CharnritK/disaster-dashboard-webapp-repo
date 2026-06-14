import Link from "next/link";
import { TemplateList } from "@/components/TemplateBuilder";

export default function TemplatesPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel-wide" aria-labelledby="templates-title">
        <p className="eyebrow">Templates</p>
        <h1 id="templates-title">Decision templates</h1>
        <p className="auth-lede">
          Create private draft templates for repeatable decision-support
          workflows. Reviewed templates remain read-only until a domain reviewer
          approves changes.
        </p>
        <div className="auth-action-row">
          <Link className="primary-action" href="/app/templates/new">
            New template
          </Link>
          <Link href="/app/data">Back to workflow</Link>
        </div>
        <TemplateList />
      </section>
    </main>
  );
}
