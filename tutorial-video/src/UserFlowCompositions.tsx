import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./Composition";
import { VoiceoverAudio } from "./VoiceoverAudio";

const flowSeconds = (value: number) => value * VIDEO_FPS;

type Accent = "amber" | "blue" | "green" | "red" | "teal";

type CursorPath = {
  clickAt?: number;
  from: [number, number];
  to: [number, number];
};

export type MotionScreenshotSceneProps = {
  accent: Accent;
  body: string;
  checklist?: string[];
  cursor: CursorPath;
  durationInFrames: number;
  footer?: string;
  image: string;
  kicker: string;
  panTo?: [number, number];
  task: string;
  title: string;
  zoomTo?: number;
};

type FlowSceneConfig = MotionScreenshotSceneProps & {
  id: string;
};

const publicDemoScenes: FlowSceneConfig[] = [
  {
    accent: "green",
    body: "The user begins with the response decision, action owner, geography, timeframe, and evidence needed for review.",
    checklist: ["Choose template", "Confirm decision owner", "Review decision map"],
    cursor: { clickAt: 0.66, from: [24, 80], to: [41, 37] },
    durationInFrames: flowSeconds(9),
    footer: "Public demo uses bundled synthetic data.",
    id: "template",
    image: "captures/01-template.png",
    kicker: "Tutorial 1",
    panTo: [-20, -16],
    task: "Review: Decision brief and map",
    title: "Start with the decision, not the chart.",
    zoomTo: 1.07,
  },
  {
    accent: "blue",
    body: "Next, the user loads the intentionally fragmented sample instead of uploading sensitive operational files.",
    checklist: ["Open samples", "Load fragmented data", "Keep data synthetic"],
    cursor: { clickAt: 0.64, from: [29, 77], to: [37, 36] },
    durationInFrames: flowSeconds(9),
    footer: "No account or API key is required for this path.",
    id: "load-sample",
    image: "captures/03-fragmented-data.png",
    kicker: "Tutorial 1",
    panTo: [-24, -10],
    task: "Click: Use fragmented demo data needs + population + capacity",
    title: "Load realistic fragmented evidence.",
    zoomTo: 1.08,
  },
  {
    accent: "amber",
    body: "The real next action is Profile data. The app then shows field roles, missingness, dataset profiles, and evidence coverage.",
    checklist: ["Click Profile data", "Inspect demo datasets", "Review evidence coverage"],
    cursor: { clickAt: 0.7, from: [72, 73], to: [43, 57] },
    durationInFrames: flowSeconds(10),
    footer: "Uncertainty is part of the workflow, not an afterthought.",
    id: "profile",
    image: "captures/04-profile-evidence.png",
    kicker: "Tutorial 1",
    panTo: [-30, -22],
    task: "Hover: Review evidence coverage",
    title: "Make data quality visible early.",
    zoomTo: 1.08,
  },
  {
    accent: "teal",
    body: "After Harmonize data, the user reviews the leading join recommendation and cleaning actions before accepting them.",
    checklist: ["Click Harmonize data", "Review join key", "Accept recommendation"],
    cursor: { clickAt: 0.68, from: [26, 80], to: [26, 47] },
    durationInFrames: flowSeconds(10),
    footer: "No silent deletion, imputation, fuzzy matching, or hidden recoding.",
    id: "harmonize",
    image: "captures/05-harmonize-review.png",
    kicker: "Tutorial 1",
    panTo: [-30, -18],
    task: "Click: Accept recommendation",
    title: "Review the join before combining files.",
    zoomTo: 1.075,
  },
  {
    accent: "green",
    body: "The combined dataset becomes Ready for review, then the user explicitly chooses Generate dashboard.",
    checklist: ["Check Ready for review", "Read transformation log", "Generate dashboard"],
    cursor: { clickAt: 0.68, from: [70, 78], to: [25, 60] },
    durationInFrames: flowSeconds(9),
    footer: "Ready for review is not operational approval.",
    id: "readiness",
    image: "captures/06-validation-readiness.png",
    kicker: "Tutorial 1",
    panTo: [-18, -22],
    task: "Click: Generate dashboard",
    title: "Use readiness as a review checkpoint.",
    zoomTo: 1.07,
  },
  {
    accent: "blue",
    body: "The generated dashboard exposes Ready for review, dashboard signals, chart source notes, and caveats before export.",
    checklist: ["Read dashboard signals", "Check caveats", "Export dashboard"],
    cursor: { clickAt: 0.62, from: [28, 78], to: [56, 10] },
    durationInFrames: flowSeconds(10),
    footer: "The chart is a review surface, not a verdict.",
    id: "dashboard",
    image: "captures/07-dashboard.png",
    kicker: "Tutorial 1",
    panTo: [-38, -18],
    task: "Click: Export step",
    title: "Generate a dashboard that keeps the caveats visible.",
    zoomTo: 1.085,
  },
  {
    accent: "teal",
    body: "On the export screen, the user generates the handoff summary and can download CSV, JSON, KIT, PNG, or PDF assets.",
    checklist: ["Generate handoff summary", "Confirm deterministic fallback", "Download review package"],
    cursor: { clickAt: 0.66, from: [30, 78], to: [26, 50] },
    durationInFrames: flowSeconds(10),
    footer: "The final decision stays with the response team.",
    id: "handoff",
    image: "captures/09-handoff-summary.png",
    kicker: "Tutorial 1",
    panTo: [-34, -12],
    task: "Click: Generate handoff summary",
    title: "Package the decision handoff without losing context.",
    zoomTo: 1.08,
  },
];

const trustRiskScenes: FlowSceneConfig[] = [
  {
    accent: "red",
    body: "The risky sample is allowed to render so the user can see bad inputs instead of hiding them.",
    checklist: ["Load risky sample", "Inspect invalid values", "Keep blockers visible"],
    cursor: { clickAt: 0.65, from: [28, 78], to: [58, 41] },
    durationInFrames: flowSeconds(9),
    footer: "A trustworthy tutorial must show the failure path.",
    id: "risk-quality",
    image: "captures/10-risk-quality.png",
    kicker: "Tutorial 2",
    panTo: [-28, -18],
    task: "Read: Missing evidence indicator",
    title: "Show when the data is not safe yet.",
    zoomTo: 1.08,
  },
  {
    accent: "red",
    body: "Readiness blockers remain legible: missing capacity evidence, negative counts, invalid percentages, and weak coverage.",
    checklist: ["Read blockers", "Separate warnings from stops", "Escalate missing evidence"],
    cursor: { clickAt: 0.7, from: [70, 74], to: [38, 48] },
    durationInFrames: flowSeconds(10),
    footer: "The app supports review. It does not approve action.",
    id: "risk-readiness",
    image: "captures/11-risk-readiness.png",
    kicker: "Tutorial 2",
    panTo: [-18, -22],
    task: "Read: Readiness blockers",
    title: "Let blockers stay uncomfortable.",
    zoomTo: 1.075,
  },
  {
    accent: "amber",
    body: "The user checks evidence coverage before relying on any recommendation, AI-assisted or deterministic.",
    checklist: ["Confirm evidence coverage", "Check missing fields", "Treat AI as optional"],
    cursor: { clickAt: 0.62, from: [25, 78], to: [43, 57] },
    durationInFrames: flowSeconds(9),
    footer: "Deterministic validation remains authoritative.",
    id: "evidence-before-ai",
    image: "captures/04-profile-evidence.png",
    kicker: "Tutorial 2",
    panTo: [-32, -20],
    task: "Read: Evidence map",
    title: "Evidence comes before advice.",
    zoomTo: 1.08,
  },
  {
    accent: "blue",
    body: "The handoff keeps caveats, assumptions, and source notes attached so the decision owner does not lose context.",
    checklist: ["Open summary", "Check assumptions", "Carry caveats forward"],
    cursor: { clickAt: 0.64, from: [29, 78], to: [48, 62] },
    durationInFrames: flowSeconds(9),
    footer: "Handoff is useful because it is reviewable.",
    id: "handoff-caveats",
    image: "captures/09-handoff-summary.png",
    kicker: "Tutorial 2",
    panTo: [-34, -12],
    task: "Read: Handoff narrative",
    title: "Keep the risk in the package.",
    zoomTo: 1.08,
  },
  {
    accent: "teal",
    body: "Uploaded rows stay in the browser session. Controlled-beta persistence is limited to approved metadata surfaces.",
    checklist: ["Session-only rows", "Metadata-only beta storage", "No raw data persistence"],
    cursor: { clickAt: 0.66, from: [26, 80], to: [50, 75] },
    durationInFrames: flowSeconds(9),
    footer: "Privacy claims must be exact, not comforting.",
    id: "export-boundary",
    image: "captures/08-export-handoff.png",
    kicker: "Tutorial 2",
    panTo: [-36, -12],
    task: "Read: Export package boundary",
    title: "Close with the session boundary.",
    zoomTo: 1.08,
  },
];

export const PUBLIC_DEMO_USER_FLOW_DURATION_IN_FRAMES = publicDemoScenes.reduce(
  (total, scene) => total + scene.durationInFrames,
  0,
);

export const TRUST_RISK_USER_FLOW_DURATION_IN_FRAMES = trustRiskScenes.reduce(
  (total, scene) => total + scene.durationInFrames,
  0,
);

export const USER_FLOW_VIDEO_WIDTH = VIDEO_WIDTH;
export const USER_FLOW_VIDEO_HEIGHT = VIDEO_HEIGHT;

export const PublicDemoUserFlow = () => {
  return (
    <FlowComposition
      progressClassName="tutorial-progress"
      scenes={publicDemoScenes}
      totalDuration={PUBLIC_DEMO_USER_FLOW_DURATION_IN_FRAMES}
      voiceoverFile="voiceover/public-demo-user-flow.mp3"
    />
  );
};

export const TrustRiskUserFlow = () => {
  return (
    <FlowComposition
      progressClassName="trust-progress"
      scenes={trustRiskScenes}
      totalDuration={TRUST_RISK_USER_FLOW_DURATION_IN_FRAMES}
      voiceoverFile="voiceover/trust-risk-user-flow.mp3"
    />
  );
};

export function MotionScreenshotScene({
  accent,
  body,
  checklist = [],
  cursor,
  durationInFrames,
  footer,
  image,
  kicker,
  panTo = [-24, -16],
  task,
  title,
  zoomTo = 1.075,
}: MotionScreenshotSceneProps) {
  const frame = useCurrentFrame();
  const shell = reveal(frame, 4, 24);
  const shot = reveal(frame, 14, 26);
  const panel = reveal(frame, 22, 24);
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = interpolate(frame, [0, durationInFrames], [1.018, zoomTo], {
    easing: Easing.bezier(0.33, 0, 0.16, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panX = interpolate(frame, [0, durationInFrames], [0, panTo[0]], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panY = interpolate(frame, [0, durationInFrames], [0, panTo[1]], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const imageTransform = `translate(${panX}px, ${panY}px) scale(${zoom})`;

  return (
    <AbsoluteFill className={`flow-scene flow-${accent}`} style={fadeStyle(shell)}>
      <div className="flow-copy" style={revealStyle(panel, 18)}>
        <span>{kicker}</span>
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="flow-task">{task}</div>
        {checklist.length > 0 ? (
          <div className="flow-checklist">
            {checklist.map((item, index) => (
              <strong
                key={item}
                style={revealStyle(reveal(frame, 54 + index * 11, 18), 10)}
              >
                {String(index + 1).padStart(2, "0")} {item}
              </strong>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flow-shot-shell" style={revealStyle(shot, 24)}>
        <div className="flow-shot-topbar">
          <span />
          <span />
          <span />
          <strong>localhost:3002/demo</strong>
        </div>
        <div className="flow-shot-stage">
          <Img
            className="flow-shot"
            src={staticFile(image)}
            style={{ transform: imageTransform }}
          />
          <div
            className="flow-interaction-layer"
            style={{ transform: imageTransform }}
          >
            <UserCursor
              clickAt={cursor.clickAt ?? 0.66}
              durationInFrames={durationInFrames}
              frame={frame}
              from={cursor.from}
              to={cursor.to}
            />
          </div>
        </div>
      </div>
      {footer ? (
        <div className="flow-footer" style={revealStyle(reveal(frame, 92, 18), 10)}>
          {footer}
        </div>
      ) : null}
      <div className="flow-scene-meter">
        <div style={{ transform: `scaleX(${progress})` }} />
      </div>
    </AbsoluteFill>
  );
}

function FlowComposition({
  progressClassName,
  scenes,
  totalDuration,
  voiceoverFile,
}: {
  progressClassName: string;
  scenes: FlowSceneConfig[];
  totalDuration: number;
  voiceoverFile: string;
}) {
  let cursor = 0;

  return (
    <AbsoluteFill className="flow-root">
      <VoiceoverAudio file={voiceoverFile} />
      {scenes.map((scene) => {
        const from = cursor;
        cursor += scene.durationInFrames;
        return (
          <Sequence
            durationInFrames={scene.durationInFrames}
            from={from}
            key={scene.id}
            premountFor={VIDEO_FPS}
          >
            <MotionScreenshotScene {...scene} />
          </Sequence>
        );
      })}
      <FlowProgress className={progressClassName} totalDuration={totalDuration} />
    </AbsoluteFill>
  );
}

function UserCursor({
  clickAt,
  durationInFrames,
  frame,
  from,
  to,
}: {
  clickAt: number;
  durationInFrames: number;
  frame: number;
  from: [number, number];
  to: [number, number];
}) {
  const travelStart = Math.round(durationInFrames * 0.22);
  const travelEnd = Math.round(durationInFrames * 0.58);
  const clickFrame = Math.round(durationInFrames * clickAt);
  const x = interpolate(frame, [0, travelStart, travelEnd], [from[0], from[0], to[0]], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, travelStart, travelEnd], [from[1], from[1], to[1]], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ring = interpolate(frame, [clickFrame, clickFrame + 15], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const target = reveal(frame, travelEnd - 8, 18);

  return (
    <>
      <div
        className="flow-target-ring"
        style={{
          left: `${to[0]}%`,
          opacity: target,
          top: `${to[1]}%`,
          transform: `translate(-50%, -50%) scale(${0.92 + target * 0.08})`,
        }}
      />
      <div
        className="flow-click-pulse"
        style={{
          left: `${to[0]}%`,
          opacity: ring,
          top: `${to[1]}%`,
          transform: `translate(-50%, -50%) scale(${1.2 + (1 - ring) * 1.8})`,
        }}
      />
      <div
        className="flow-cursor"
        style={{
          left: `${x}%`,
          top: `${y}%`,
        }}
      />
    </>
  );
}

function FlowProgress({
  className,
  totalDuration,
}: {
  className: string;
  totalDuration: number;
}) {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, totalDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className={`timeline-track ${className}`}>
      <div className="timeline-fill" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

function reveal(frame: number, start: number, length: number) {
  return interpolate(frame, [start, start + length], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function fadeStyle(progress: number): CSSProperties {
  return {
    display: "grid",
    opacity: progress,
  };
}

function revealStyle(progress: number, yDistance: number): CSSProperties {
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * yDistance}px)`,
  };
}
