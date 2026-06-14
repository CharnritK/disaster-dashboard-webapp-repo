import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress | Dashboard Copilot",
  description:
    "Current Dashboard Copilot controlled-beta progress, gaps, and decisions needed.",
};

const progressCards = [
  {
    label: "Target state",
    value: "Controlled beta",
    detail: "Public deterministic demo plus protected AI-assisted workspace.",
  },
  {
    label: "Local code",
    value: "Implemented",
    detail: "Core beta paths exist and the local command gates are passing.",
  },
  {
    label: "External readiness",
    value: "Not launched",
    detail: "Production Supabase, migrations, email login, and deploy are not verified.",
  },
  {
    label: "Next decision",
    value: "Preview first",
    detail: "Validate auth, metadata storage, and smoke tests before production work.",
  },
];

const statusRows = [
  {
    area: "Public demo",
    status: "In place",
    tone: "ready",
    evidence:
      "The root route redirects to the public demo, and the demo is deterministic and sample-focused.",
    gap: "Keep it public, simple, and non-AI unless you decide otherwise.",
  },
  {
    area: "Authenticated workspace",
    status: "In place locally",
    tone: "ready",
    evidence:
      "Protected app routes are split by data, prepare, readiness, dashboard, and export.",
    gap: "Real login still needs a reviewed Supabase project and email flow.",
  },
  {
    area: "AI governance",
    status: "In place locally",
    tone: "ready",
    evidence:
      "AI attempts are gated by auth, entitlement, quota, provider config, and deterministic fallback.",
    gap: "Provider credentials and production model policy remain explicit approvals.",
  },
  {
    area: "Metadata persistence",
    status: "Built, not migrated",
    tone: "watch",
    evidence:
      "Metadata adapter, schema draft, RLS draft, and privacy guard tests exist.",
    gap: "No production migration has been run. RLS and grants need review first.",
  },
  {
    area: "Feedback and templates",
    status: "In place locally",
    tone: "ready",
    evidence:
      "Authenticated feedback and private draft template flows exist with row-like payload rejection.",
    gap: "Beta policy must decide who can use them and what support promise exists.",
  },
  {
    area: "Admin metadata dashboard",
    status: "Guarded",
    tone: "watch",
    evidence:
      "Admin route is deny-by-default and shows aggregate metadata only.",
    gap: "Production admin allowlist needs your approval before real use.",
  },
  {
    area: "Deployment",
    status: "Blocked by decision",
    tone: "blocked",
    evidence:
      "Dry-run smoke script and release checklist exist; no production deploy was run.",
    gap: "Need preview target, environment values, and production go/no-go.",
  },
];

const decisions = [
  {
    rank: "D1",
    decision: "Approve a preview deployment path",
    recommendation:
      "Use preview-only first. Do not deploy production until auth, DB, and fallback smoke tests pass.",
    neededFor: "External validation without touching production.",
  },
  {
    rank: "D2",
    decision: "Choose and configure the real Supabase project",
    recommendation:
      "Use Supabase Auth and Supabase Postgres if you want the fewest moving parts.",
    neededFor: "Magic-link login, protected app routes, metadata storage, and RLS review.",
  },
  {
    rank: "D3",
    decision: "Approve database migration timing",
    recommendation:
      "Review schema and RLS first, then migrate only in a preview or staging database.",
    neededFor: "Persistent usage events, feedback, templates, and admin aggregates.",
  },
  {
    rank: "D4",
    decision: "Define beta access and admin allowlists",
    recommendation:
      "Start narrow: named beta emails, named admins, no open self-serve signup.",
    neededFor: "Preventing accidental access and keeping support scope manageable.",
  },
  {
    rank: "D5",
    decision: "Set the daily AI quota",
    recommendation:
      "Keep `AI_DAILY_QUOTA=20` for early beta unless real usage suggests otherwise.",
    neededFor: "Cost control and predictable fallback behavior.",
  },
  {
    rank: "D6",
    decision: "Confirm public demo behavior",
    recommendation:
      "Keep `/demo` deterministic and sample-only. Do not expose anonymous AI.",
    neededFor: "Clear privacy boundary and simple public story.",
  },
  {
    rank: "D7",
    decision: "Approve retention policy or leave it manual",
    recommendation:
      "Document retention now; automate deletion later after legal/product review.",
    neededFor: "Compliance posture without premature background jobs.",
  },
];

const nextSteps = [
  "Freeze the current local beta scope and stop adding product surfaces.",
  "Pick preview deployment target and Supabase project.",
  "Configure preview env values without committing secrets.",
  "Run login, quota, fallback, feedback, template, admin-denial, and no-row-persistence smoke checks.",
  "Only then decide whether to run production migration or production deployment.",
];

const risks = [
  "The codebase is heavily dirty, so scope control matters more than adding one more feature.",
  "Local tests passing does not prove Supabase email login, redirect URLs, RLS, or production env values are correct.",
  "The biggest product risk is making AI or exports sound like operational approval.",
  "The biggest technical risk is accidentally storing uploaded rows while wiring persistence.",
];

export default function ProgressPage() {
  return (
    <main>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="header-brand">
            <a className="brand-home" href="/demo">
              Dashboard Copilot
            </a>
            <a className="header-nav-link" href="/about">
              About
            </a>
            <a
              className="header-nav-link active"
              href="/progress"
              aria-current="page"
            >
              Progress
            </a>
          </div>
        </div>
      </header>

      <div className="about-shell progress-shell">
        <section className="about-hero progress-hero">
          <p className="eyebrow">Owner status</p>
          <h1>Progress toward controlled beta</h1>
          <p className="about-lede">
            The local code now matches the controlled-beta direction. The next
            bottleneck is not more features; it is deciding how to validate
            Supabase, preview deployment, access policy, and production timing.
          </p>
        </section>

        <section className="progress-metrics" aria-label="Progress summary">
          {progressCards.map((card) => (
            <article className="progress-metric" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </article>
          ))}
        </section>

        <section className="about-section">
          <div className="section-heading">
            <p className="eyebrow">Current read</p>
            <h2>What is actually in place</h2>
          </div>
          <div className="progress-status-list">
            {statusRows.map((row) => (
              <article className="progress-status-row" key={row.area}>
                <div>
                  <span className={`progress-pill ${row.tone}`}>
                    {row.status}
                  </span>
                  <h3>{row.area}</h3>
                </div>
                <p>{row.evidence}</p>
                <p>{row.gap}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-section">
          <div className="section-heading">
            <p className="eyebrow">Decision queue</p>
            <h2>What needs your decision</h2>
          </div>
          <div className="progress-decision-list">
            {decisions.map((item) => (
              <article className="progress-decision-card" key={item.rank}>
                <span>{item.rank}</span>
                <div>
                  <h3>{item.decision}</h3>
                  <p>{item.recommendation}</p>
                </div>
                <p>{item.neededFor}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="progress-two-column">
          <article className="about-note">
            <p className="eyebrow">Recommended sequence</p>
            <h2>Best next move</h2>
            <ol className="progress-list">
              {nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="about-note">
            <p className="eyebrow">Blind spots</p>
            <h2>Risks to watch</h2>
            <ul className="progress-list">
              {risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
