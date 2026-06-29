import { FeedbackForm } from "@/components/FeedbackForm";

export default function FeedbackPage() {
  return (
    <main className="auth-shell workspace-secondary-shell">
      <section className="auth-panel auth-panel-wide" aria-labelledby="feedback-page-title">
        <p className="eyebrow">Feedback</p>
        <h1 id="feedback-page-title">Review workflow output</h1>
        <p className="auth-lede">
          Share metadata-only feedback about AI drafts, deterministic fallbacks,
          or workflow guidance quality. Do not
          paste rows, files, reports, screenshots, prompts, or sensitive
          operational details.
        </p>
        <FeedbackForm enabled />
      </section>
    </main>
  );
}
