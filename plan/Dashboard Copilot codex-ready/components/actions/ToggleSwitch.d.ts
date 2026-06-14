/** Pill toggle with "Label On/Off" copy and sliding thumb (the header AI switch). Track turns teal when on. */
export interface ToggleSwitchProps {
  /** Short label before the On/Off state. Default "AI". */
  label?: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}
