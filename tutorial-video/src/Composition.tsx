import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;

const seconds = (value: number) => value * VIDEO_FPS;

const sceneDurations = [
  seconds(7),
  seconds(10),
  seconds(8),
  seconds(8),
  seconds(9),
  seconds(8),
  seconds(8),
  seconds(9),
  seconds(8),
  seconds(9),
  seconds(11),
  seconds(10),
  seconds(8),
];

export const VIDEO_DURATION_IN_FRAMES = sceneDurations.reduce(
  (total, duration) => total + duration,
  0,
);

type SceneConfig = {
  duration: number;
  id: string;
  node: ReactNode;
};

const sceneConfigs: SceneConfig[] = [
  { id: "opening", duration: sceneDurations[0], node: <OpeningScene /> },
  { id: "business", duration: sceneDurations[1], node: <BusinessScene /> },
  {
    id: "template",
    duration: sceneDurations[2],
    node: (
      <ScreenshotScene
        accent="green"
        image="captures/01-template.png"
        kicker="Step 1"
        subtitle="The product starts with a response-prioritization question, action owner, geography, timeframe, and evidence needs."
        title="Start with the decision, not the chart"
      />
    ),
  },
  {
    id: "upload",
    duration: sceneDurations[3],
    node: (
      <ScreenshotScene
        accent="blue"
        image="captures/03-fragmented-data.png"
        kicker="Step 2"
        subtitle="Teams can upload CSV or XLSX files, or use bundled synthetic samples to see how fragmented data gets aligned."
        title="Load the evidence sources"
      />
    ),
  },
  {
    id: "profile",
    duration: sceneDurations[4],
    node: (
      <ScreenshotScene
        accent="amber"
        image="captures/04-profile-evidence.png"
        kicker="Step 3"
        subtitle="Profiling explains field roles, sample values, missingness, and evidence coverage before any recommendation is trusted."
        title="Make data quality visible early"
      />
    ),
  },
  {
    id: "harmonize",
    duration: sceneDurations[5],
    node: (
      <ScreenshotScene
        accent="teal"
        image="captures/05-harmonize-review.png"
        kicker="Step 4"
        subtitle="Join suggestions and row-preserving cleaning are reviewable. The app avoids automatic deletion, imputation, or fuzzy matching."
        title="Review harmonization before combining files"
      />
    ),
  },
  {
    id: "validate",
    duration: sceneDurations[6],
    node: (
      <ScreenshotScene
        accent="green"
        image="captures/06-validation-readiness.png"
        kicker="Step 5"
        subtitle="Ready for review means evidence was detected. It does not mean the system has approved an operational action."
        title="Use readiness as a soft gate"
      />
    ),
  },
  {
    id: "dashboard",
    duration: sceneDurations[7],
    node: (
      <ScreenshotScene
        accent="blue"
        image="captures/07-dashboard.png"
        kicker="Step 6"
        subtitle="The dashboard summarizes metrics, locations, insights, assumptions, and caveats from the prepared dataset."
        title="Generate a review surface"
      />
    ),
  },
  {
    id: "export",
    duration: sceneDurations[8],
    node: (
      <ScreenshotScene
        accent="teal"
        image="captures/09-handoff-summary.png"
        kicker="Step 7"
        subtitle="Exports include prepared CSV, dashboard image, PDF report, transformation log, and a review-ready handoff summary."
        title="Package the decision handoff"
      />
    ),
  },
  {
    id: "risk",
    duration: sceneDurations[9],
    node: (
      <ScreenshotScene
        accent="red"
        image="captures/11-risk-readiness.png"
        kicker="Risk path"
        subtitle="The risky sample still renders, but blockers remain visible: missing capacity evidence, negative counts, and invalid percentages."
        title="Show the failure mode honestly"
      />
    ),
  },
  { id: "architecture", duration: sceneDurations[10], node: <ArchitectureScene /> },
  { id: "modules", duration: sceneDurations[11], node: <ModuleMapScene /> },
  { id: "closing", duration: sceneDurations[12], node: <ClosingScene /> },
];

export const DashboardCopilotTutorial = () => {
  let cursor = 0;

  return (
    <AbsoluteFill className="video-root">
      {sceneConfigs.map((scene) => {
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence
            durationInFrames={scene.duration}
            from={from}
            key={scene.id}
            premountFor={VIDEO_FPS}
          >
            {scene.node}
          </Sequence>
        );
      })}
      <ProgressBar />
    </AbsoluteFill>
  );
};

function OpeningScene() {
  const title = useReveal(0.2, 0.8);
  const subtitle = useReveal(0.65, 0.8);
  const cards = useStagger(4, 1.4, 0.16);
  const chain = useReveal(2.0, 0.8);

  return (
    <SceneShell
      eyebrow="Tutorial"
      title="Dashboard Copilot"
      titleStyle={revealStyle(title, 34)}
    >
      <div className="opening-layout">
        <div className="opening-copy">
          <p className="scene-subtitle" style={revealStyle(subtitle, 28)}>
            Turn fragmented disaster response data into review-ready decision
            assets without pretending the software can approve the action.
          </p>
          <div className="opening-card-grid">
            {[
              ["Business", "Decision-first workflow"],
              ["Product", "Visible evidence and caveats"],
              ["Technical", "Session-only data handling"],
              ["AI", "Optional recommendations with fallback"],
            ].map(([label, value], index) => (
              <MetricCard
                key={label}
                label={label}
                progress={cards[index]}
                value={value}
              />
            ))}
          </div>
        </div>
        <DecisionChain progress={chain} />
      </div>
    </SceneShell>
  );
}

function BusinessScene() {
  const intro = useReveal(0.15, 0.7);
  const rows = useStagger(5, 1.0, 0.18);
  const bottom = useReveal(5.8, 0.8);

  return (
    <SceneShell
      eyebrow="Business side"
      title="The real product is operational decision support"
      titleStyle={revealStyle(intro, 26)}
    >
      <div className="business-grid">
        {[
          ["Decision question", "Which affected districts should receive first response?"],
          ["Action", "Prioritize response teams for the next distribution cycle."],
          ["Decision-maker", "Emergency operations lead"],
          ["Evidence", "Geography, severity, affected population, response gap, capacity"],
          ["Output", "Review-ready dashboard, caveats, and handoff artifacts"],
        ].map(([label, value], index) => (
          <div className="business-row" key={label} style={revealStyle(rows[index], 24)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="assertion-strip" style={revealStyle(bottom, 18)}>
        The demo should not be sold as automatic triage. It is a faster way to
        standardize inputs, expose risk, and prepare a human review.
      </div>
    </SceneShell>
  );
}

function ScreenshotScene({
  accent,
  image,
  kicker,
  subtitle,
  title,
}: {
  accent: "amber" | "blue" | "green" | "red" | "teal";
  image: string;
  kicker: string;
  subtitle: string;
  title: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const copy = useReveal(0.15, 0.65);
  const imageIn = useReveal(0.75, 0.8);
  const callout = useReveal(3.1, 0.8);
  const imageScale = interpolate(frame, [0, 6 * fps], [1.015, 1.045], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell eyebrow={kicker} title={title} titleStyle={revealStyle(copy, 22)}>
      <div className="screenshot-layout">
        <div className={`screenshot-frame ${accent}`} style={revealStyle(imageIn, 22)}>
          <Img
            src={staticFile(image)}
            style={{
              height: "100%",
              objectFit: "cover",
              objectPosition: "top left",
              transform: `scale(${imageScale})`,
              width: "100%",
            }}
          />
        </div>
        <aside className={`callout-card ${accent}`} style={revealStyle(callout, 26)}>
          <span>{kicker}</span>
          <p>{subtitle}</p>
        </aside>
      </div>
    </SceneShell>
  );
}

function ArchitectureScene() {
  const intro = useReveal(0.15, 0.7);
  const nodes = useStagger(4, 1.0, 0.18);
  const warnings = useStagger(3, 6.3, 0.18);

  return (
    <SceneShell
      eyebrow="Technical side"
      title="The architecture protects the prototype contract"
      titleStyle={revealStyle(intro, 24)}
    >
      <div className="architecture-grid">
        {[
          {
            label: "Browser",
            title: "Session workflow",
            body: "Uploaded rows, step state, dashboard rendering, and exports stay in the browser session.",
            meta: "No account or project persistence.",
          },
          {
            label: "Server routes",
            title: "/api/recommend and /api/copilot",
            body: "Routes validate payloads, enforce request limits, and construct provider calls server-side.",
            meta: "Keys never enter browser code.",
          },
          {
            label: "LLM boundary",
            title: "Minimized profile metadata",
            body: "Only capped profile summaries, quality summaries, and dashboard facts are sent when AI is enabled.",
            meta: "No full uploaded rows.",
          },
          {
            label: "Fallback",
            title: "Deterministic recommendations",
            body: "Missing keys, disabled AI, rate limits, timeouts, and invalid model JSON fall back cleanly.",
            meta: "Validation remains authoritative.",
          },
        ].map((item, index) => (
          <ArchitectureNode
            body={item.body}
            key={item.label}
            label={item.label}
            meta={item.meta}
            progress={nodes[index]}
            title={item.title}
          />
        ))}
      </div>
      <div className="risk-rules">
        {[
          "Safe cleaning is typed, row-preserving, and explainable.",
          "AI output is reconciled and sanitized before it reaches the workflow.",
          "Exports keep caveats and transformation history attached.",
        ].map((rule, index) => (
          <span key={rule} style={revealStyle(warnings[index], 14)}>
            {rule}
          </span>
        ))}
      </div>
    </SceneShell>
  );
}

function ModuleMapScene() {
  const rows = useStagger(5, 0.8, 0.16);
  const note = useReveal(7.6, 0.7);

  return (
    <SceneShell eyebrow="Architecture map" title="Where the main logic lives">
      <div className="module-map">
        {[
          ["Input", "lib/fileParsers.ts, lib/profiling.ts", "Parse CSV/XLSX, validate uploads, infer field roles."],
          ["Recommend", "lib/recommendationSchema.ts, lib/llmClient.ts", "Minimize request payloads, sanitize structured AI output, preserve fallback."],
          ["Prepare", "lib/harmonization.ts, lib/cleaningTransforms.ts", "Apply reviewed joins and allowed row-preserving cleaning transforms."],
          ["Validate", "lib/validation.ts, lib/decisionContext.ts", "Run quality checks and decision-readiness assessment."],
          ["Present", "lib/dashboardRecommendations.ts, lib/dashboardInsights.ts, lib/chartMetrics.ts", "Generate charts, insights, metrics, caveats, and exportable artifacts."],
        ].map(([phase, files, body], index) => (
          <div className="module-row" key={phase} style={revealStyle(rows[index], 18)}>
            <span>{phase}</span>
            <code>{files}</code>
            <p>{body}</p>
          </div>
        ))}
      </div>
      <div className="test-note" style={revealStyle(note, 14)}>
        Core regression coverage lives in <code>tests/dataPipeline.test.ts</code>.
        Demo credibility comes from showing the gates, not hiding them.
      </div>
    </SceneShell>
  );
}

function ClosingScene() {
  const rows = useStagger(5, 0.8, 0.2);
  const close = useReveal(5.7, 0.8);

  return (
    <SceneShell eyebrow="Demo close" title="The message to land">
      <div className="closing-grid">
        {[
          "Start with the operational decision and action owner.",
          "Show which evidence is covered, weak, or missing.",
          "Explain that joins and cleaning are reviewable.",
          "Carry readiness caveats into dashboard and exports.",
          "Use the architecture slide to prove privacy and fallback boundaries.",
        ].map((item, index) => (
          <div className="closing-row" key={item} style={revealStyle(rows[index], 20)}>
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="closing-statement" style={revealStyle(close, 18)}>
        Dashboard Copilot is a review surface for faster, safer response
        prioritization. The final decision stays with the response team.
      </div>
    </SceneShell>
  );
}

function SceneShell({
  children,
  eyebrow,
  title,
  titleStyle,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  titleStyle?: CSSProperties;
}) {
  return (
    <AbsoluteFill className="scene-shell">
      <header className="scene-header">
        <span className="scene-eyebrow">{eyebrow}</span>
        <h1 style={titleStyle}>{title}</h1>
      </header>
      <div className="scene-body">{children}</div>
    </AbsoluteFill>
  );
}

function MetricCard({
  label,
  progress,
  value,
}: {
  label: string;
  progress: number;
  value: string;
}) {
  return (
    <div className="metric-card" style={revealStyle(progress, 20)}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DecisionChain({ progress }: { progress: number }) {
  return (
    <div className="decision-chain" style={revealStyle(progress, 24)}>
      {["Decision", "Evidence", "Quality", "Dashboard", "Handoff"].map((item, index) => (
        <div className="chain-item" key={item}>
          <strong>{String(index + 1).padStart(2, "0")}</strong>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function ArchitectureNode({
  body,
  label,
  meta,
  progress,
  title,
}: {
  body: string;
  label: string;
  meta: string;
  progress: number;
  title: string;
}) {
  return (
    <article className="architecture-node" style={revealStyle(progress, 22)}>
      <span>{label}</span>
      <h2>{title}</h2>
      <p>{body}</p>
      <small>{meta}</small>
    </article>
  );
}

function ProgressBar() {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, VIDEO_DURATION_IN_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className="timeline-track">
      <div className="timeline-fill" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

function useReveal(startSecond: number, durationSecond: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return interpolate(
    frame,
    [startSecond * fps, (startSecond + durationSecond) * fps],
    [0, 1],
    {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
}

function useStagger(count: number, startSecond: number, gapSecond: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return Array.from({ length: count }, (_, index) =>
    interpolate(
      frame,
      [
        (startSecond + index * gapSecond) * fps,
        (startSecond + index * gapSecond + 0.65) * fps,
      ],
      [0, 1],
      {
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    ),
  );
}

function revealStyle(progress: number, yDistance: number): CSSProperties {
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * yDistance}px)`,
  };
}
