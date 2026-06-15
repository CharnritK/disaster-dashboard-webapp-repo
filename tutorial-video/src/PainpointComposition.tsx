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
import { MotionScreenshotScene } from "./UserFlowCompositions";
import { VoiceoverAudio } from "./VoiceoverAudio";

const painSeconds = (value: number) => value * VIDEO_FPS;

const painpointDurations = [
  painSeconds(7),
  painSeconds(7),
  painSeconds(8),
  painSeconds(8),
  painSeconds(7),
];

export const PAINPOINT_DURATION_IN_FRAMES = painpointDurations.reduce(
  (total, duration) => total + duration,
  0,
);

type PainpointScene = {
  duration: number;
  id: string;
  node: ReactNode;
};

const painpointScenes: PainpointScene[] = [
  {
    duration: painpointDurations[0],
    id: "night-ops",
    node: (
      <EmotionalScene
        body="One assessment file, one population sheet, one capacity update, and a meeting that cannot wait."
        durationInFrames={painpointDurations[0]}
        image="generated/emotional-01-night-ops.png"
        kicker="Part 1 / Problem"
        title="The hardest part is knowing whether the chart can be trusted."
      />
    ),
  },
  {
    duration: painpointDurations[1],
    id: "fragmented-data-proof",
    node: (
      <MotionScreenshotScene
        accent="blue"
        body="The public demo uses bundled synthetic fragmented files, so viewers can test the workflow without sensitive data."
        checklist={["Load sample", "Inspect sources", "Keep data synthetic"]}
        cursor={{ clickAt: 0.66, from: [28, 78], to: [37, 36] }}
        durationInFrames={painpointDurations[1]}
        footer="Synthetic sample data only. No account or API key is needed."
        image="captures/03-fragmented-data.png"
        kicker="Part 1 / Proof"
        panTo={[-26, -12]}
        task="Click: Use fragmented demo data needs + population + capacity"
        title="Show the fragmentation before solving it."
        zoomTo={1.08}
      />
    ),
  },
  {
    duration: painpointDurations[2],
    id: "evidence-profile",
    node: (
      <MotionScreenshotScene
        accent="amber"
        body="Before recommendations, the app profiles fields, missingness, inferred roles, and evidence coverage."
        checklist={["Profile fields", "Find evidence gaps", "Name uncertainty"]}
        cursor={{ clickAt: 0.68, from: [73, 75], to: [43, 57] }}
        durationInFrames={painpointDurations[2]}
        footer="The uncertainty becomes visible before the dashboard exists."
        image="captures/04-profile-evidence.png"
        kicker="Part 1 / Evidence"
        panTo={[-34, -20]}
        task="Read: Evidence coverage"
        title="Make uncertainty visible early."
        zoomTo={1.08}
      />
    ),
  },
  {
    duration: painpointDurations[3],
    id: "reviewable-join",
    node: (
      <MotionScreenshotScene
        accent="teal"
        body="Join suggestions and cleaning stay reviewable, row-preserving, and explainable."
        checklist={["Review join key", "Check cleaning", "Accept only explainable changes"]}
        cursor={{ clickAt: 0.68, from: [26, 80], to: [26, 47] }}
        durationInFrames={painpointDurations[3]}
        footer="No hidden row deletion, imputation, fuzzy matching, or recoding."
        image="captures/05-harmonize-review.png"
        kicker="Part 1 / Review"
        panTo={[-30, -18]}
        task="Click: Accept recommendation"
        title="Do not silently combine fragile data."
        zoomTo={1.075}
      />
    ),
  },
  {
    duration: painpointDurations[4],
    id: "human-handoff",
    node: (
      <MotionScreenshotScene
        accent="blue"
        body="The handoff summary keeps caveats, assumptions, and transformation history attached for human review."
        checklist={["Open handoff", "Check caveats", "Keep final action human-owned"]}
        cursor={{ clickAt: 0.66, from: [30, 78], to: [26, 50] }}
        durationInFrames={painpointDurations[4]}
        footer="Clearer evidence. Human-owned action."
        image="captures/09-handoff-summary.png"
        kicker="Part 1 / Handoff"
        panTo={[-34, -12]}
        task="Click: Generate handoff summary"
        title="Clearer evidence. Human-owned action."
        zoomTo={1.08}
      />
    ),
  },
];

export const FragmentedDataPainpoint = () => {
  let cursor = 0;

  return (
    <AbsoluteFill className="painpoint-root">
      <VoiceoverAudio file="voiceover/fragmented-data-painpoint.mp3" />
      {painpointScenes.map((scene) => {
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
      <PainpointProgress />
    </AbsoluteFill>
  );
};

function EmotionalScene({
  body,
  durationInFrames,
  image,
  kicker,
  title,
}: {
  body: string;
  durationInFrames: number;
  image: string;
  kicker: string;
  title: string;
}) {
  const frame = useCurrentFrame();
  const fade = reveal(frame, 5, 22);
  const copy = reveal(frame, 18, 30);
  const scale = interpolate(frame, [0, durationInFrames], [1.04, 1.12], {
    easing: Easing.bezier(0.33, 0, 0.16, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Img
        className="painpoint-image"
        src={staticFile(image)}
        style={{ transform: `scale(${scale})` }}
      />
      <AbsoluteFill className="painpoint-scrim" />
      <div className="painpoint-copy" style={revealStyle(fade, 22)}>
        <span>{kicker}</span>
        <h1>{title}</h1>
        <p style={revealStyle(copy, 18)}>{body}</p>
        <div className="painpoint-chips">
          {["mismatched districts", "missing capacity", "late updates"].map((chip, index) => (
            <strong
              key={chip}
              style={revealStyle(reveal(frame, 40 + index * 9, 18), 14)}
            >
              {chip}
            </strong>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function PainpointProgress() {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, PAINPOINT_DURATION_IN_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className="timeline-track">
      <div className="timeline-fill" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

function reveal(frame: number, start: number, length: number) {
  return interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function revealStyle(progress: number, offset: number): CSSProperties {
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * offset}px)`,
  };
}

export const PAINPOINT_VIDEO_WIDTH = VIDEO_WIDTH;
export const PAINPOINT_VIDEO_HEIGHT = VIDEO_HEIGHT;
