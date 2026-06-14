import { redirect } from "next/navigation";

import { isAdminUser, aggregateUsageSummary } from "@/lib/adminMetrics";
import { getSupabaseServerIdentity } from "@/lib/supabase/server";

export default async function AdminPage() {
  const identity = await getSupabaseServerIdentity();
  if (!identity) redirect("/login?next=/admin");
  if (!isAdminUser(identity.userId, identity.email)) redirect("/app");

  const summary = await aggregateUsageSummary();

  return (
    <main className="auth-shell">
      <section className="auth-panel auth-panel-wide" aria-labelledby="admin-title">
        <p className="eyebrow">Admin</p>
        <h1 id="admin-title">Metadata dashboard</h1>
        <p className="auth-lede">
          Aggregate usage, feedback, and template metadata only. No uploaded
          rows, prompts, files, reports, or screenshots are displayed here.
        </p>
        <dl className="admin-metrics">
          <div>
            <dt>Usage events</dt>
            <dd>{summary.usageEvents}</dd>
          </div>
          <div>
            <dt>Feedback</dt>
            <dd>{summary.feedbackCount}</dd>
          </div>
          <div>
            <dt>Templates</dt>
            <dd>{summary.templateCount}</dd>
          </div>
        </dl>
        <section className="admin-breakdown" aria-labelledby="fallback-breakdown-title">
          <h2 id="fallback-breakdown-title">Fallback reasons</h2>
          {summary.fallbackReasons.length === 0 ? (
            <p className="auth-lede">No fallback metadata recorded yet.</p>
          ) : (
            <ul>
              {summary.fallbackReasons.map((item) => (
                <li key={item.value}>
                  <span>{item.value}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="admin-breakdown" aria-labelledby="feedback-tags-title">
          <h2 id="feedback-tags-title">Feedback tags</h2>
          {summary.feedbackTags.length === 0 ? (
            <p className="auth-lede">No feedback tag metadata recorded yet.</p>
          ) : (
            <ul>
              {summary.feedbackTags.map((item) => (
                <li key={item.value}>
                  <span>{item.value}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
