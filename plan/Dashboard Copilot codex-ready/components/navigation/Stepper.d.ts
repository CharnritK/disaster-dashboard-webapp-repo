/** Numbered pill stepper for the 7-step workflow. Complete = soft teal, active = ink, upcoming = translucent. */
export interface StepperProps {
  /** Step labels in order, e.g. ["Template","Upload","Profile","Harmonize","Dataset","Dashboard","Export"] */
  steps: string[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  /** Return false to disable navigation to a step (renders at 45% opacity) */
  canNavigateTo?: (index: number) => boolean;
}
