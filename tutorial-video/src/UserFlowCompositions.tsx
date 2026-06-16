import type { CSSProperties, ReactNode } from "react";
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

type HighlightRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type ImageSize = {
  height: number;
  width: number;
};

type CursorPath = {
  clickAt?: number;
  from: [number, number];
  label?: string;
  mode?: "click" | "spotlight";
  rect?: HighlightRect;
  to: [number, number];
};

type ResultState = {
  focus: [number, number];
  highlight?: {
    label?: string;
    rect?: HighlightRect;
    target: [number, number];
  };
  image: string;
  imageSize: ImageSize;
  label: string;
};

export type MotionScreenshotSceneProps = {
  accent: Accent;
  body: string;
  checklist?: string[];
  cursor: CursorPath;
  durationInFrames: number;
  focusFrom?: [number, number];
  focusTo?: [number, number];
  footer?: string;
  image: string;
  imageSize: ImageSize;
  kicker: string;
  panTo?: [number, number];
  result?: ResultState;
  task: string;
  title: string;
  zoomTo?: number;
};

type FlowSceneConfig = MotionScreenshotSceneProps & {
  id: string;
};

const size = (width: number, height: number): ImageSize => ({ height, width });
const rect = (x: number, y: number, width: number, height: number): HighlightRect => ({
  height,
  width,
  x,
  y,
});

// Keep these in sync with .flow-scene and .flow-shot-shell in index.css.
const FLOW_SCENE_PADDING_X_PX = 76;
const FLOW_GRID_COPY_WIDTH_PX = 610;
const FLOW_GRID_GAP_PX = 44;
const FLOW_SHOT_BORDER_PX = 10;
const FLOW_SHOT_SHELL_HEIGHT_PX = 760;
const FLOW_SHOT_TOPBAR_HEIGHT_PX = 48;
const FLOW_STAGE_WIDTH_PX =
  VIDEO_WIDTH -
  FLOW_SCENE_PADDING_X_PX * 2 -
  FLOW_GRID_COPY_WIDTH_PX -
  FLOW_GRID_GAP_PX -
  FLOW_SHOT_BORDER_PX * 2;
const FLOW_STAGE_HEIGHT_PX = FLOW_SHOT_SHELL_HEIGHT_PX - FLOW_SHOT_TOPBAR_HEIGHT_PX;

const captureSizes = {
  dashboard: size(1803, 5075),
  fragmentedData: size(1803, 2820),
  handoffSummary: size(1803, 2356),
  harmonizeReview: size(1818, 1272),
  profileEvidence: size(1803, 3838),
  readiness: size(1803, 1682),
  riskPrepare: size(1818, 1272),
  riskQuality: size(1803, 2314),
  riskReadiness: size(1803, 1567),
  template: size(1803, 2204),
  upload: size(1818, 1272),
  exportHandoff: size(1803, 1921),
};

const targets = {
  acceptRecommendation: {
    center: [25.76, 47.42] as [number, number],
    rect: rect(20.3, 45.75, 10.93, 3.34),
  },
  exportDashboard: {
    center: [40.46, 97.9] as [number, number],
    rect: rect(18.77, 97.48, 43.37, 0.84),
  },
  generateDashboard: {
    center: [24.73, 50.25] as [number, number],
    rect: rect(20.05, 48.98, 9.36, 2.53),
  },
  generateHandoff: {
    center: [25.82, 44.06] as [number, number],
    rect: rect(19.83, 42.95, 11.99, 2.21),
  },
  harmonizeData: {
    center: [40.46, 97.23] as [number, number],
    rect: rect(18.77, 96.68, 43.37, 1.11),
  },
  loadFragmented: {
    center: [34.88, 46.34] as [number, number],
    rect: rect(28.98, 43.86, 11.81, 4.97),
  },
  prepareDataset: {
    center: [24.05, 47.42] as [number, number],
    rect: rect(20.3, 45.75, 7.51, 3.34),
  },
  profileData: {
    center: [40.46, 96.24] as [number, number],
    rect: rect(18.77, 95.49, 43.37, 1.51),
  },
  riskHarmonizeData: {
    center: [40.46, 95.41] as [number, number],
    rect: rect(18.77, 94.49, 43.37, 1.84),
  },
  templateContinue: {
    center: [25.92, 94.14] as [number, number],
    rect: rect(20.05, 93.18, 11.74, 1.93),
  },
};

const publicDemoScenes: FlowSceneConfig[] = [
  {
    accent: "green",
    body: "The user reviews the decision brief, scrolls to the bottom, and clicks the real continuation button.",
    checklist: ["Review decision", "Scroll to collection fields", "Click continue"],
    cursor: {
      clickAt: 0.7,
      from: [47, 82],
      label: "Click continue",
      rect: targets.templateContinue.rect,
      to: targets.templateContinue.center,
    },
    durationInFrames: flowSeconds(8),
    focusFrom: [40, 24],
    focusTo: targets.templateContinue.center,
    footer: "Public demo uses bundled synthetic data.",
    id: "template",
    image: "captures/01-template.png",
    imageSize: captureSizes.template,
    kicker: "Part 2 / Demo",
    result: {
      focus: [34.88, 46.34],
      highlight: {
        label: "Upload step opens",
        rect: targets.loadFragmented.rect,
        target: targets.loadFragmented.center,
      },
      image: "captures/02-upload.png",
      imageSize: captureSizes.upload,
      label: "After click: upload step opens.",
    },
    task: "Review: Decision brief and map",
    title: "Start with the decision, not the chart.",
    zoomTo: 1.07,
  },
  {
    accent: "blue",
    body: "The user clicks the synthetic fragmented sample. The next state shows the loaded files and parsed previews.",
    checklist: ["Choose synthetic sample", "Avoid sensitive upload", "Confirm files loaded"],
    cursor: {
      clickAt: 0.64,
      from: [24, 78],
      label: "Click sample",
      rect: targets.loadFragmented.rect,
      to: targets.loadFragmented.center,
    },
    durationInFrames: flowSeconds(8),
    focusFrom: [35, 24],
    focusTo: targets.loadFragmented.center,
    footer: "No account or API key is required for this path.",
    id: "load-sample",
    image: "captures/02-upload.png",
    imageSize: captureSizes.upload,
    kicker: "Part 2 / Demo",
    result: {
      focus: [40, 32],
      highlight: {
        label: "Files loaded",
        rect: targets.profileData.rect,
        target: targets.profileData.center,
      },
      image: "captures/03-fragmented-data.png",
      imageSize: captureSizes.fragmentedData,
      label: "After click: fragmented files are loaded.",
    },
    task: "Click: Use fragmented demo data needs + population + capacity",
    title: "Load realistic fragmented evidence.",
    zoomTo: 1.08,
  },
  {
    accent: "amber",
    body: "The user scrolls through loaded sample previews and clicks Profile data at the bottom of the page.",
    checklist: ["Review loaded files", "Scroll to action", "Click Profile data"],
    cursor: {
      clickAt: 0.7,
      from: [62, 82],
      label: "Click Profile data",
      rect: targets.profileData.rect,
      to: targets.profileData.center,
    },
    durationInFrames: flowSeconds(9),
    focusFrom: [40, 30],
    focusTo: targets.profileData.center,
    footer: "Uncertainty is part of the workflow, not an afterthought.",
    id: "profile",
    image: "captures/03-fragmented-data.png",
    imageSize: captureSizes.fragmentedData,
    kicker: "Part 2 / Demo",
    result: {
      focus: [40, 48],
      highlight: {
        label: "Evidence coverage appears",
        rect: rect(19.5, 48, 41.9, 18),
        target: [40.46, 57],
      },
      image: "captures/04-profile-evidence.png",
      imageSize: captureSizes.profileEvidence,
      label: "After click: evidence coverage is visible.",
    },
    task: "Click: Profile data",
    title: "Make data quality visible early.",
    zoomTo: 1.08,
  },
  {
    accent: "teal",
    body: "After reviewing evidence coverage, the user scrolls to Harmonize data and opens the join recommendation.",
    checklist: ["Review coverage", "Scroll to action", "Open harmonization"],
    cursor: {
      clickAt: 0.68,
      from: [58, 82],
      label: "Click Harmonize data",
      rect: targets.harmonizeData.rect,
      to: targets.harmonizeData.center,
    },
    durationInFrames: flowSeconds(9),
    focusFrom: [40, 48],
    focusTo: targets.harmonizeData.center,
    footer: "No silent deletion, imputation, fuzzy matching, or hidden recoding.",
    id: "harmonize",
    image: "captures/04-profile-evidence.png",
    imageSize: captureSizes.profileEvidence,
    kicker: "Part 2 / Demo",
    result: {
      focus: [35, 42],
      highlight: {
        label: "Join recommendation opens",
        rect: rect(19.6, 30.5, 42, 20.5),
        target: [34, 40],
      },
      image: "captures/05-harmonize-review.png",
      imageSize: captureSizes.harmonizeReview,
      label: "After click: join review opens.",
    },
    task: "Click: Accept recommendation",
    title: "Review the join before combining files.",
    zoomTo: 1.075,
  },
  {
    accent: "green",
    body: "The user clicks the actual Accept recommendation button. The next screen shows the prepared dataset is ready for review.",
    checklist: ["Check join reason", "Accept recommendation", "Review prepared dataset"],
    cursor: {
      clickAt: 0.68,
      from: [58, 80],
      label: "Click accept",
      rect: targets.acceptRecommendation.rect,
      to: targets.acceptRecommendation.center,
    },
    durationInFrames: flowSeconds(8),
    focusFrom: [34, 37],
    focusTo: targets.acceptRecommendation.center,
    footer: "Ready for review is not operational approval.",
    id: "readiness",
    image: "captures/05-harmonize-review.png",
    imageSize: captureSizes.harmonizeReview,
    kicker: "Part 2 / Demo",
    result: {
      focus: [24.73, 50.25],
      highlight: {
        label: "Ready for review",
        rect: targets.generateDashboard.rect,
        target: targets.generateDashboard.center,
      },
      image: "captures/06-validation-readiness.png",
      imageSize: captureSizes.readiness,
      label: "After click: prepared dataset is ready.",
    },
    task: "Click: Accept recommendation",
    title: "Use readiness as a review checkpoint.",
    zoomTo: 1.07,
  },
  {
    accent: "blue",
    body: "The user clicks Generate dashboard, then sees the generated dashboard with readiness, source notes, caveats, and charts.",
    checklist: ["Click Generate dashboard", "Read source notes", "Check caveats"],
    cursor: {
      clickAt: 0.62,
      from: [62, 80],
      label: "Click Generate dashboard",
      rect: targets.generateDashboard.rect,
      to: targets.generateDashboard.center,
    },
    durationInFrames: flowSeconds(9),
    focusFrom: [40, 28],
    focusTo: targets.generateDashboard.center,
    footer: "The chart is a review surface, not a verdict.",
    id: "dashboard",
    image: "captures/06-validation-readiness.png",
    imageSize: captureSizes.readiness,
    kicker: "Part 2 / Demo",
    result: {
      focus: [40, 26],
      highlight: {
        label: "Dashboard signals appear",
        rect: rect(18.8, 16, 43.4, 18),
        target: [40, 24],
      },
      image: "captures/07-dashboard.png",
      imageSize: captureSizes.dashboard,
      label: "After click: dashboard is generated.",
    },
    task: "Click: Generate dashboard",
    title: "Generate a dashboard that keeps the caveats visible.",
    zoomTo: 1.085,
  },
  {
    accent: "blue",
    body: "The user scrolls through the dashboard from top signals down to the real Export dashboard button.",
    checklist: ["Start at dashboard", "Scroll to bottom", "Click export"],
    cursor: {
      clickAt: 0.7,
      from: [70, 82],
      label: "Click Export dashboard",
      rect: targets.exportDashboard.rect,
      to: targets.exportDashboard.center,
    },
    durationInFrames: flowSeconds(8),
    focusFrom: [40, 22],
    focusTo: targets.exportDashboard.center,
    footer: "This is the top-to-bottom dashboard pass before handoff.",
    id: "export-dashboard",
    image: "captures/07-dashboard.png",
    imageSize: captureSizes.dashboard,
    kicker: "Part 2 / Demo",
    result: {
      focus: targets.generateHandoff.center,
      highlight: {
        label: "Export screen opens",
        rect: targets.generateHandoff.rect,
        target: targets.generateHandoff.center,
      },
      image: "captures/08-export-handoff.png",
      imageSize: captureSizes.exportHandoff,
      label: "After click: export assets open.",
    },
    task: "Click: Export dashboard",
    title: "Move from the dashboard to export.",
    zoomTo: 1.085,
  },
  {
    accent: "teal",
    body: "On the export screen, the user clicks Generate handoff summary and sees a review-ready narrative with caveats intact.",
    checklist: ["Click handoff summary", "Confirm fallback", "Download review package"],
    cursor: {
      clickAt: 0.66,
      from: [58, 78],
      label: "Click handoff summary",
      rect: targets.generateHandoff.rect,
      to: targets.generateHandoff.center,
    },
    durationInFrames: flowSeconds(8),
    focusFrom: [40, 24],
    focusTo: targets.generateHandoff.center,
    footer: "The final decision stays with the response team.",
    id: "handoff",
    image: "captures/08-export-handoff.png",
    imageSize: captureSizes.exportHandoff,
    kicker: "Part 2 / Demo",
    result: {
      focus: [40, 42],
      highlight: {
        label: "Handoff summary appears",
        rect: rect(19.8, 17, 42, 25),
        target: [40, 30],
      },
      image: "captures/09-handoff-summary.png",
      imageSize: captureSizes.handoffSummary,
      label: "After click: handoff summary is generated.",
    },
    task: "Click: Generate handoff summary",
    title: "Package the decision handoff without losing context.",
    zoomTo: 1.08,
  },
];

const trustRiskScenes: FlowSceneConfig[] = [
  {
    accent: "red",
    body: "The risky sample shows invalid values and missing evidence, then the user opens harmonization from the real bottom action.",
    checklist: ["Inspect invalid values", "Scroll to action", "Open harmonization"],
    cursor: {
      clickAt: 0.66,
      from: [62, 82],
      label: "Click Harmonize data",
      rect: targets.riskHarmonizeData.rect,
      to: targets.riskHarmonizeData.center,
    },
    durationInFrames: flowSeconds(9),
    focusFrom: [40, 30],
    focusTo: targets.riskHarmonizeData.center,
    footer: "Bad inputs stay visible before anyone acts.",
    id: "risk-quality",
    image: "captures/10-risk-quality.png",
    imageSize: captureSizes.riskQuality,
    kicker: "Part 3 / Risk",
    result: {
      focus: targets.prepareDataset.center,
      highlight: {
        label: "Prepare dataset appears",
        rect: targets.prepareDataset.rect,
        target: targets.prepareDataset.center,
      },
      image: "captures/10-risk-prepare.png",
      imageSize: captureSizes.riskPrepare,
      label: "After click: prepare step opens.",
    },
    task: "Read: Missing evidence indicator",
    title: "Show when the data is not safe yet.",
    zoomTo: 1.08,
  },
  {
    accent: "red",
    body: "The user clicks Prepare dataset. The next state is explicit: Not safe for action yet.",
    checklist: ["Click Prepare dataset", "Read blockers", "Escalate missing evidence"],
    cursor: {
      clickAt: 0.66,
      from: [58, 78],
      label: "Click Prepare dataset",
      rect: targets.prepareDataset.rect,
      to: targets.prepareDataset.center,
    },
    durationInFrames: flowSeconds(10),
    focusFrom: [35, 38],
    focusTo: targets.prepareDataset.center,
    footer: "The app supports review. It does not approve action.",
    id: "risk-readiness",
    image: "captures/10-risk-prepare.png",
    imageSize: captureSizes.riskPrepare,
    kicker: "Part 3 / Risk",
    result: {
      focus: [32, 38],
      highlight: {
        label: "Not safe for action yet",
        rect: rect(20, 24, 42, 26),
        target: [32, 36],
      },
      image: "captures/11-risk-readiness.png",
      imageSize: captureSizes.riskReadiness,
      label: "After click: blockers stop the workflow.",
    },
    task: "Read: Readiness blockers",
    title: "Let blockers stay uncomfortable.",
    zoomTo: 1.075,
  },
  {
    accent: "amber",
    body: "The user checks evidence coverage before relying on any recommendation, AI-assisted or deterministic.",
    checklist: ["Confirm evidence coverage", "Check missing fields", "Treat AI as optional"],
    cursor: {
      from: [43, 57],
      label: "Evidence coverage",
      mode: "spotlight",
      rect: rect(19.5, 48, 41.9, 18),
      to: [40.46, 57],
    },
    durationInFrames: flowSeconds(9),
    focusFrom: [40, 44],
    focusTo: [40.46, 57],
    footer: "Deterministic validation remains authoritative.",
    id: "evidence-before-ai",
    image: "captures/04-profile-evidence.png",
    imageSize: captureSizes.profileEvidence,
    kicker: "Part 3 / Risk",
    task: "Read: Evidence map",
    title: "Evidence comes before advice.",
    zoomTo: 1.08,
  },
  {
    accent: "teal",
    body: "Uploaded rows stay in the browser session. Controlled-beta persistence is limited to approved metadata surfaces.",
    checklist: ["Session-only rows", "Metadata-only beta storage", "No raw data persistence"],
    cursor: {
      from: [54, 72],
      label: "Metadata-only project kit",
      mode: "spotlight",
      rect: rect(47.78, 51.26, 13.31, 11.65),
      to: [54.44, 57.09],
    },
    durationInFrames: flowSeconds(9),
    focusFrom: [40, 24],
    focusTo: [54.44, 57.09],
    footer: "The boundary is session-only rows and metadata-only beta storage.",
    id: "export-boundary",
    image: "captures/08-export-handoff.png",
    imageSize: captureSizes.exportHandoff,
    kicker: "Part 3 / Risk",
    task: "Read: Export package boundary",
    title: "Close with the session boundary.",
    zoomTo: 1.08,
  },
  {
    accent: "blue",
    body: "The handoff keeps caveats, assumptions, and source notes attached so the decision owner does not lose context.",
    checklist: ["Open summary", "Check assumptions", "Carry caveats forward"],
    cursor: {
      from: [40, 40],
      label: "Handoff caveats",
      mode: "spotlight",
      rect: rect(19.8, 17, 42, 25),
      to: [40, 30],
    },
    durationInFrames: flowSeconds(9),
    focusFrom: [40, 24],
    focusTo: [40, 35],
    footer: "Handoff is useful because it is reviewable.",
    id: "handoff-caveats",
    image: "captures/09-handoff-summary.png",
    imageSize: captureSizes.handoffSummary,
    kicker: "Part 3 / Risk",
    task: "Read: Handoff narrative",
    title: "Keep the risk in the package.",
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
  focusFrom,
  focusTo,
  footer,
  image,
  imageSize,
  kicker,
  result,
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
  const clickFrame = Math.round(durationInFrames * (cursor.clickAt ?? 0.66));
  const resultStart = result ? clickFrame + 10 : durationInFrames + 1;
  const resultProgress = result ? reveal(frame, resultStart, 18) : 0;
  const focusStart = focusFrom ?? cursor.from;
  const focusEnd = focusTo ?? cursor.to;
  const focusX = interpolate(
    frame,
    [0, Math.max(1, clickFrame - 24), clickFrame + 4],
    [focusStart[0], focusEnd[0], focusEnd[0]],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const focusY = interpolate(
    frame,
    [0, Math.max(1, clickFrame - 24), clickFrame + 4],
    [focusStart[1], focusEnd[1], focusEnd[1]],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const zoom = interpolate(frame, [0, durationInFrames], [1.04, zoomTo], {
    easing: Easing.bezier(0.33, 0, 0.16, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const primaryOpacity = result ? 1 - resultProgress : 1;
  const resultOpacity = resultProgress;

  return (
    <AbsoluteFill
      className={`flow-scene flow-${accent}`}
      style={flowSceneStyle(frame, durationInFrames, shell)}
    >
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
          <strong>Dashboard Copilot /demo</strong>
        </div>
        <div className="flow-shot-stage">
          <CaptureCanvas
            focus={[focusX, focusY]}
            image={image}
            imageSize={imageSize}
            opacity={primaryOpacity}
            zoom={zoom}
          >
            <UserCursor
              clickAt={cursor.clickAt ?? 0.66}
              durationInFrames={durationInFrames}
              frame={frame}
              from={cursor.from}
              label={cursor.label}
              mode={cursor.mode ?? "click"}
              rect={cursor.rect}
              to={cursor.to}
            />
          </CaptureCanvas>
          {result ? (
            <CaptureCanvas
              focus={result.focus}
              image={result.image}
              imageSize={result.imageSize}
              opacity={resultOpacity}
              zoom={zoomTo}
            >
              {result.highlight ? (
                <TargetHighlight
                  label={result.highlight.label}
                  opacity={resultOpacity}
                  rect={result.highlight.rect}
                  target={result.highlight.target}
                />
              ) : null}
            </CaptureCanvas>
          ) : null}
          {result ? (
            <div
              className="flow-state-change"
              style={revealStyle(resultProgress, 10)}
            >
              {result.label}
            </div>
          ) : null}
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
  label,
  mode,
  rect,
  to,
}: {
  clickAt: number;
  durationInFrames: number;
  frame: number;
  from: [number, number];
  label?: string;
  mode: "click" | "spotlight";
  rect?: HighlightRect;
  to: [number, number];
}) {
  const isClick = mode === "click";
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
  const pulse = interpolate(frame, [clickFrame - 3, clickFrame, clickFrame + 18], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulseScale = interpolate(frame, [clickFrame - 3, clickFrame, clickFrame + 18], [0.8, 1.1, 2.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const targetStart = isClick ? travelEnd - 8 : Math.round(durationInFrames * 0.16);
  const target = reveal(frame, targetStart, 18);

  return (
    <>
      <TargetHighlight
        label={label}
        opacity={target}
        rect={rect}
        target={to}
      />
      {isClick ? (
        <>
          <div
              className="flow-click-pulse"
              style={{
                left: `${to[0]}%`,
                opacity: pulse,
                top: `${to[1]}%`,
                transform: `translate(-50%, -50%) scale(${pulseScale})`,
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
      ) : null}
    </>
  );
}

function TargetHighlight({
  label,
  opacity,
  rect,
  target,
}: {
  label?: string;
  opacity: number;
  rect?: HighlightRect;
  target: [number, number];
}) {
  const rectStyle: CSSProperties = rect
    ? {
        height: `${rect.height}%`,
        left: `${rect.x}%`,
        opacity,
        top: `${rect.y}%`,
        width: `${rect.width}%`,
      }
    : {
        height: "7.5%",
        left: `${target[0]}%`,
        opacity,
        top: `${target[1]}%`,
        transform: "translate(-50%, -50%)",
        width: "12%",
      };

  return (
    <>
      <div className="flow-target-rect" style={rectStyle} />
      <div
        className="flow-target-ring"
        style={{
          left: `${target[0]}%`,
          opacity,
          top: `${target[1]}%`,
          transform: `translate(-50%, -50%) scale(${0.92 + opacity * 0.08})`,
        }}
      />
      {label ? (
        <div
          className="flow-action-label"
          style={{
            left: `${target[0]}%`,
            opacity,
            top: `${target[1]}%`,
          }}
        >
          {label}
        </div>
      ) : null}
    </>
  );
}

function CaptureCanvas({
  children,
  focus,
  image,
  imageSize,
  opacity,
  zoom,
}: {
  children?: ReactNode;
  focus: [number, number];
  image: string;
  imageSize: ImageSize;
  opacity: number;
  zoom: number;
}) {
  const transform = getCanvasTransform({ focus, imageSize, zoom });

  return (
    <div
      className="flow-capture-canvas"
      style={{
        aspectRatio: `${imageSize.width} / ${imageSize.height}`,
        opacity,
        transform,
      }}
    >
      <Img className="flow-shot" src={staticFile(image)} />
      <div className="flow-interaction-layer">{children}</div>
    </div>
  );
}

function getCanvasTransform({
  focus,
  imageSize,
  zoom,
}: {
  focus: [number, number];
  imageSize: ImageSize;
  zoom: number;
}) {
  const canvasWidth = FLOW_STAGE_WIDTH_PX * zoom;
  const canvasHeight = (FLOW_STAGE_WIDTH_PX * imageSize.height * zoom) / imageSize.width;
  const anchorX = FLOW_STAGE_WIDTH_PX * 0.38;
  const anchorY = FLOW_STAGE_HEIGHT_PX * 0.58;
  const rawX = anchorX - (focus[0] / 100) * canvasWidth;
  const rawY = anchorY - (focus[1] / 100) * canvasHeight;
  const minX = Math.min(0, FLOW_STAGE_WIDTH_PX - canvasWidth);
  const minY = Math.min(0, FLOW_STAGE_HEIGHT_PX - canvasHeight);
  const x = clamp(rawX, minX, 0);
  const y = clamp(rawY, minY, 0);

  return `translate(${x}px, ${y}px) scale(${zoom})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function flowSceneStyle(
  frame: number,
  durationInFrames: number,
  progress: number,
): CSSProperties {
  const exitStart = Math.max(1, durationInFrames - 22);
  const exit = interpolate(frame, [exitStart, durationInFrames], [1, 0.78], {
    easing: Easing.bezier(0.7, 0, 0.84, 0),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enterY = interpolate(frame, [0, 22], [34, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitY = interpolate(frame, [exitStart, durationInFrames], [0, -34], {
    easing: Easing.bezier(0.7, 0, 0.84, 0),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return {
    display: "grid",
    opacity: progress * exit,
    transform: `translateY(${enterY + exitY}px)`,
  };
}

function revealStyle(progress: number, yDistance: number): CSSProperties {
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * yDistance}px)`,
  };
}
