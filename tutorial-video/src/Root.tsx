import "./index.css";
import { Composition } from "remotion";
import {
  DashboardCopilotTutorial,
  VIDEO_DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./Composition";
import {
  FragmentedDataPainpoint,
  PAINPOINT_DURATION_IN_FRAMES,
  PAINPOINT_VIDEO_HEIGHT,
  PAINPOINT_VIDEO_WIDTH,
} from "./PainpointComposition";
import {
  PUBLIC_DEMO_USER_FLOW_DURATION_IN_FRAMES,
  PublicDemoUserFlow,
  TRUST_RISK_USER_FLOW_DURATION_IN_FRAMES,
  TrustRiskUserFlow,
  USER_FLOW_VIDEO_HEIGHT,
  USER_FLOW_VIDEO_WIDTH,
} from "./UserFlowCompositions";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DashboardCopilotTutorial"
        component={DashboardCopilotTutorial}
        durationInFrames={VIDEO_DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
      <Composition
        id="FragmentedDataPainpoint"
        component={FragmentedDataPainpoint}
        durationInFrames={PAINPOINT_DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={PAINPOINT_VIDEO_WIDTH}
        height={PAINPOINT_VIDEO_HEIGHT}
      />
      <Composition
        id="PublicDemoUserFlow"
        component={PublicDemoUserFlow}
        durationInFrames={PUBLIC_DEMO_USER_FLOW_DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={USER_FLOW_VIDEO_WIDTH}
        height={USER_FLOW_VIDEO_HEIGHT}
      />
      <Composition
        id="TrustRiskUserFlow"
        component={TrustRiskUserFlow}
        durationInFrames={TRUST_RISK_USER_FLOW_DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={USER_FLOW_VIDEO_WIDTH}
        height={USER_FLOW_VIDEO_HEIGHT}
      />
    </>
  );
};
