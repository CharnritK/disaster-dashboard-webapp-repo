import { FeedbackForm } from "@/components/FeedbackForm";

export default function FeedbackPage() {
  return (
    <main className="auth-shell workspace-secondary-shell">
      <section className="auth-panel auth-panel-wide" aria-labelledby="feedback-page-title">
        <p className="eyebrow">Feedback</p>
        <h1 id="feedback-page-title">Review the AI beta</h1>
        <p className="auth-lede">
          Share metadata-only feedback about recommendation quality. Do not
          paste rows, files, reports, screenshots, prompts, or sensitive
          operational details.
        </p>
        <FeedbackForm enabled />
      </section>
    </main>
  );
}
