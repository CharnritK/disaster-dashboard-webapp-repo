import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Dashboard Copilot",
  description:
    "How Dashboard Copilot helps turn humanitarian datasets into transparent dashboards.",
};

const resources = [
  {
    title: "Code Repository",
    href: "https://github.com/datakind/disaster-dashboard-webapp-repo",
    description: "The open-sourced code behind Dashboard Copilot.",
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
          </div>
        </div>
      </header>

      <div className="about-shell">
        <section className="about-hero">
          <p className="eyebrow">About</p>
          <h1>Dashboard Copilot for Humanitarian Aid</h1>
          <p className="about-lede">
            Dashboard Copilot helps teams turn CSV and XLSX datasets into a
            prepared dataset, quality checks, recommended visualizations, and
            exportable dashboard artifacts without hiding the data preparation
            steps that shaped the result.
          </p>
        </section>

        <section className="about-grid" aria-label="Application overview">
          <article className="about-panel">
            <h2>What It Does</h2>
            <p>
              The workflow profiles uploaded or sample data, recommends safe
              harmonization steps, applies typed row-preserving cleaning
              transforms, validates the prepared dataset, and generates a
              dashboard with charts and insights tailored to the available
              fields.
            </p>
          </article>
          <article className="about-panel">
            <h2>What Stays Visible</h2>
            <p>
              Joins, cleaning operations, quality warnings, assumptions, and
              exportable transformation logs remain visible so analysts can
              review what changed before sharing a dashboard or prepared data.
            </p>
          </article>
          <article className="about-panel">
            <h2>How AI is Used</h2>
            <p>
              When enabled, the server asks the configured LLM for structured
              recommendations using minimized column summaries. The app keeps
              deterministic fallbacks available when AI is off, unavailable,
              rate limited, or unable to return valid structured output.
            </p>
          </article>
        </section>

        <section className="about-section">
          <div className="section-heading">
            <p className="eyebrow">Workflow</p>
            <h2>Designed for Review Before Publication</h2>
          </div>
          <ol className="about-steps">
            <li>
              <strong>Upload data</strong>
              <span>
                Load CSV/XLSX files or use the bundled humanitarian sample
                datasets.
              </span>
            </li>
            <li>
              <strong>Profile fields</strong>
              <span>
                Identify likely join keys, metrics, categories, missingness, and
                duplicates.
              </span>
            </li>
            <li>
              <strong>Harmonize safely</strong>
              <span>
                Apply typed transforms such as trimming whitespace and
                converting numeric strings.
              </span>
            </li>
            <li>
              <strong>Validate and generate</strong>
              <span>
                Review quality checks, then generate recommended charts and
                insights.
              </span>
            </li>
            <li>
              <strong>Export artifacts</strong>
              <span>
                Download prepared data, dashboard images, PDF reports, and
                decision handoff logs.
              </span>
            </li>
          </ol>
        </section>

        <section className="about-section">
          <div className="section-heading">
            <p className="eyebrow">Data handling</p>
            <h2>Current Prototype Boundaries</h2>
          </div>
          <div className="about-note">
            <p>
              Uploaded files are held in browser session memory. The browser
              never reads the server LLM API key. When AI recommendations are
              enabled, the server sends minimized column summaries and capped
              sample values to the configured provider; full uploaded rows are
              not sent to the recommendation route.
            </p>
            <p>
              This application does not replace operational review, statistical
              validation, or accountability processes. Use it to speed up first
              drafts, surface quality issues, and make preparation steps easier
              to inspect.
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
