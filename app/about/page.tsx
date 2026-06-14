import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Dashboard Copilot",
  description:
    "How to use Dashboard Copilot to turn disaster-response datasets into reviewable decision-support packages.",
};

const resources = [
  {
    title: "Code Repository",
    href: "https://github.com/datakind/disaster-dashboard-webapp-repo",
    description: "The open-sourced code behind Dashboard Copilot.",
  },
  {
    title: "Public-Good Guide",
    href: "https://github.com/datakind/disaster-dashboard-webapp-repo/blob/main/docs/digital-public-good-guide.md",
    description:
      "Plain-English project tutorial, scope, extension guidance, and technical appendix.",
  },
  {
    title: "Release Readiness",
    href: "https://github.com/datakind/disaster-dashboard-webapp-repo/blob/main/docs/release-readiness.md",
    description:
      "Controlled-beta gates, current staging posture, and production approval boundary.",
  },
  {
    title: "Showcase Script",
    href: "https://github.com/datakind/disaster-dashboard-webapp-repo/blob/main/docs/showcase-script.md",
    description:
      "A short presenter path for explaining the workflow without overselling the demo.",
  },
  {
    title: "Tutorial Video Source",
    href: "https://github.com/datakind/disaster-dashboard-webapp-repo/tree/main/tutorial-video",
    description:
      "Remotion source project, captured walkthrough screens, and render notes for the embedded tutorial.",
  },
  {
    title: "License",
    href: "https://github.com/datakind/disaster-dashboard-webapp-repo?tab=Apache-2.0-1-ov-file#readme",
    description: "Open-source licensing for Dashboard Copilot.",
  },
  {
    title: "Documentation",
    href: "https://drive.google.com/drive/folders/1c9RZSxU1GVyKTq7U9--8lCkhUyijyfZB?usp=sharing",
    description:
      "Helpful documentation and sample datasets for Dashboard Copilot.",
  },
  {
    title: "DataKind",
    href: "https://www.datakind.org/",
    description:
      "A nonprofit focused on applying data science and AI in service of social impact organizations.",
  },
];

const workflowSteps = [
  {
    title: "Pick the decision",
    body: "Start with the response-prioritization template, action owner, geography, timeframe, and evidence needs.",
  },
  {
    title: "Load sample or local files",
    body: "Use the public demo samples for a safe first run, or sign in to the workspace before uploading CSV/XLSX data.",
  },
  {
    title: "Inspect evidence coverage",
    body: "Review field roles, join keys, missingness, duplicate signals, and whether the data supports the decision.",
  },
  {
    title: "Review harmonization",
    body: "Accept or adjust join recommendations and row-preserving cleaning transforms before preparing the dataset.",
  },
  {
    title: "Generate and export",
    body: "Use the dashboard, caveats, PDF report, transformation log, handoff log, or project kit as review artifacts.",
  },
];

const entryPoints = [
  {
    title: "Public demo",
    href: "/demo",
    action: "Open demo",
    body: "No login. Uses bundled synthetic data and deterministic recommendations so a new user can learn the flow safely.",
  },
  {
    title: "Authenticated workspace",
    href: "/app",
    action: "Open workspace",
    body: "Login required. Use this path for uploaded CSV/XLSX files, optional AI attempts, usage metering, feedback, templates, and exports.",
  },
  {
    title: "Progress and gates",
    href: "/progress",
    action: "View progress",
    body: "Check what is implemented, what was locally verified, and what still needs approval before production.",
  },
];

const tutorialChapters = [
  "Start with the decision question and action owner.",
  "Load bundled samples or authenticated workspace data.",
  "Profile evidence quality before trusting recommendations.",
  "Review joins, cleaning, readiness, dashboard output, and exports.",
  "Use caveats and handoff logs to support human review.",
];

export default function AboutPage() {
  return (
    <main>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="header-brand">
            <a className="brand-home" href="/">
              Dashboard Copilot
            </a>
            <a
              className="header-nav-link active"
              href="/about"
              aria-current="page"
            >
              About
            </a>
            <a className="header-nav-link" href="/progress">
              Progress
            </a>
          </div>
        </div>
      </header>

      <div className="about-shell">
        <section className="about-hero">
          <p className="eyebrow">About</p>
          <h1>Dashboard Copilot for Disaster Response Decisions</h1>
          <p className="about-lede">
            Dashboard Copilot helps response teams turn fragmented,
            non-sensitive CSV and XLSX data into a reviewable decision-support
            package: profiled evidence, safe preparation steps, readiness
            checks, recommended visualizations, caveats, and exportable handoff
            artifacts.
          </p>
          <div className="about-actions" aria-label="Primary entry points">
            <a className="primary-action" href="/demo">
              Try the public demo
            </a>
            <a className="secondary-action" href="/app">
              Open the workspace
            </a>
          </div>
        </section>

        <section className="about-grid" aria-label="Application overview">
          <article className="about-panel">
            <h2>What It Is</h2>
            <p>
              A controlled-beta decision-readiness workflow for humanitarian
              and disaster-response teams. The product is built to support
              human review, not to approve an operational action automatically.
            </p>
          </article>
          <article className="about-panel">
            <h2>What It Produces</h2>
            <p>
              Prepared data, quality warnings, recommended charts, dashboard
              insights, PDF/image exports, transformation logs, decision
              handoff logs, and a project kit for second-pass implementation.
            </p>
          </article>
          <article className="about-panel">
            <h2>How AI Fits</h2>
            <p>
              AI is optional and advisory. Provider calls require server-side
              enablement, authentication, entitlement, and quota. Deterministic
              recommendations remain the fallback and the validation anchor.
            </p>
          </article>
        </section>

        <section className="about-section">
          <div className="section-heading">
            <p className="eyebrow">Tutorial</p>
            <h2>Watch the Workflow Once, Then Try the Demo</h2>
          </div>
          <div className="about-video-grid">
            <div className="about-video-card">
              <video
                controls
                poster="/tutorial/dashboard-copilot-tutorial-poster.jpg"
                preload="metadata"
              >
                <source
                  src="/tutorial/dashboard-copilot-tutorial.mp4"
                  type="video/mp4"
                />
                Your browser does not support embedded video. Open the
                tutorial source from the resources section below.
              </video>
            </div>
            <aside className="about-note tutorial-summary">
              <h3>What the tutorial covers</h3>
              <ul>
                {tutorialChapters.map((chapter) => (
                  <li key={chapter}>{chapter}</li>
                ))}
              </ul>
              <a className="secondary-action" href="/demo">
                Start with the deterministic demo
              </a>
            </aside>
          </div>
        </section>

        <section className="about-section">
          <div className="section-heading">
            <p className="eyebrow">Start here</p>
            <h2>Choose the Right Entry Point</h2>
          </div>
          <div className="entry-grid">
            {entryPoints.map((entry) => (
              <article className="entry-card" key={entry.href}>
                <h3>{entry.title}</h3>
                <p>{entry.body}</p>
                <a className="secondary-action" href={entry.href}>
                  {entry.action}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section">
          <div className="section-heading">
            <p className="eyebrow">Workflow</p>
            <h2>Use It as a Review Workflow</h2>
          </div>
          <ol className="about-steps">
            {workflowSteps.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.body}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-section">
          <div className="section-heading">
            <p className="eyebrow">Data handling</p>
            <h2>Controlled-Beta Boundaries</h2>
          </div>
          <div className="about-note">
            <p>
              Uploaded disaster data remains session-only. The app may persist
              account/profile metadata, AI usage metadata, feedback, custom
              templates, template versions, and non-sensitive admin/evaluation
              metadata; it must not persist uploaded files, raw rows, prepared
              rows, full datasets, exports, full prompts, row-like model
              responses, or secrets.
            </p>
            <p>
              The public demo uses synthetic sample data and does not make AI
              calls. Authenticated workspace routes can use optional AI only
              after the server verifies access and quota, and AI output remains
              secondary to deterministic validation and visible caveats.
            </p>
            <p>
              This application does not replace operational review, statistical
              validation, domain approval, or accountability processes. Use it
              to standardize first drafts, surface quality issues, and make
              preparation steps easier to inspect before stakeholders act.
            </p>
          </div>
        </section>

        <section className="about-section">
          <div className="section-heading">
            <p className="eyebrow">Resources</p>
            <h2>Helpful References</h2>
          </div>
          <div className="resource-grid">
            {resources.map((resource) => (
              <a
                className="resource-card"
                href={resource.href}
                key={resource.href}
                rel="noreferrer"
                target="_blank"
              >
                <strong>{resource.title}</strong>
                <span>{resource.description}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
