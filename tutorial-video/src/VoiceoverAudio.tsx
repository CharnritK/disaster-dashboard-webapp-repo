import { Audio } from "@remotion/media";
import { staticFile } from "remotion";

const VOICEOVER_VOLUME = 0.92;

export function VoiceoverAudio({ file }: { file: string }) {
  return <Audio src={staticFile(file)} volume={VOICEOVER_VOLUME} />;
}
