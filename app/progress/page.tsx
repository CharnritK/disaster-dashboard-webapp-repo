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
    label: "Current branch",
    value: "PR #7 open",
    detail: "Showcase deck salvage assets are on a mergeable review branch.",
  },
  {
    label: "Preview checks",
    value: "Passing",
    detail: "GitHub reports Vercel preview and preview comments as successful.",
  },
  {
    label: "Next decision",
    value: "Merge PR #7",
    detail: "Merge the salvage branch if the showcase assets should be kept.",
  },
];

const statusRows = [
  {
    area: "Branch cleanup",
    status: "Cleaned",
    tone: "ready",
    evidence:
      "Merged and obsolete pending branches were deleted. Leftover uncommitted work from the old branch was backed up before the worktree was removed.",
    gap: "No old pending branch remains as the active integration path; PR #7 is the review path for salvaged assets.",
  },
  {
    area: "Showcase salvage branch",
    status: "Under review",
    tone: "watch",
    evidence:
      "PR #7 adds showcase deck notes, deterministic deck builders, verifier scripts, and Typhoon Kestrel synthetic sample files.",
    gap: "The PR still needs human review and merge. The final deck still requires the approved eight PNGs and a visual spot-check.",
  },
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
    gap: "Staging magic-link evidence exists, but production auth and redirect URLs remain approval-gated.",
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
    status: "Preview only",
    tone: "watch",
    evidence:
      "PR #7 has a successful Vercel preview check. Production deployment was not run.",
    gap: "Production still needs explicit environment, auth, database, support, and release-owner approval.",
  },
];

const decisions = [
  {
    rank: "D1",
    decision: "Merge or reject PR #7",
    recommendation:
      "Merge it if you want the showcase deck builders and Typhoon Kestrel synthetic demo files in main.",
    neededFor: "Closing the pending-branch cleanup without losing useful standalone assets.",
  },
  {
    rank: "D2",
    decision: "Complete the next preview smoke pass",
    recommendation:
      "Use the PR preview and staging credentials to re-check login, quota denial, deterministic fallback, feedback/templates, and no-row-persistence.",
    neededFor: "Fresh external validation without touching production.",
  },
  {
    rank: "D3",
    decision: "Confirm production Supabase timing",
    recommendation:
      "Keep the approved Supabase-backed preview path separate from any production project or redirect URL changes.",
    neededFor: "Avoiding accidental production auth or database mutation.",
  },
  {
    rank: "D4",
    decision: "Approve database migration timing",
    recommendation:
      "Review schema and RLS first, then migrate only in a preview or staging database.",
    neededFor: "Persistent usage events, feedback, templates, and admin aggregates.",
  },
  {
    rank: "D5",
    decision: "Define beta access and admin allowlists",
    recommendation:
      "Start narrow: named beta emails, named admins, no open self-serve signup.",
    neededFor: "Preventing accidental access and keeping support scope manageable.",
  },
  {
    rank: "D6",
    decision: "Set the daily AI quota",
    recommendation:
      "Keep `AI_DAILY_QUOTA=20` for early beta unless real usage suggests otherwise.",
    neededFor: "Cost control and predictable fallback behavior.",
  },
  {
    rank: "D7",
    decision: "Confirm public demo behavior",
    recommendation:
      "Keep `/demo` deterministic and sample-only. Do not expose anonymous AI.",
    neededFor: "Clear privacy boundary and simple public story.",
  },
  {
    rank: "D8",
    decision: "Approve retention policy or leave it manual",
    recommendation:
      "Document retention now; automate deletion later after legal/product review.",
    neededFor: "Compliance posture without premature background jobs.",
  },
];

const nextSteps = [
  "Review and merge or reject PR #7.",
  "If merged, delete the salvage branch after main contains the commit.",
  "Keep the public demo deterministic and sample-only while the showcase deck is reviewed.",
  "Pick the next preview or staging validation target before touching production settings.",
  "Only after preview evidence is current, decide whether to run production migration or production deployment.",
];

const risks = [
  "A passing PR preview does not prove Supabase email login, redirect URLs, RLS, or production env values are correct.",
  "Showcase deck scripts prove PPTX structure, not visual quality; the final deck still needs a human spot-check.",
  "PR #7 links and deck notes should be reviewed after merge so branch-only references do not become stale.",
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
            As of June 28, 2026, the fork main branch contains the completed
            product-standout work. The only active review branch is PR #7 for
            showcase deck salvage assets. Production remains approval-gated.
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
