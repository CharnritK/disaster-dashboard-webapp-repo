/** Ink-black rounded tooltip chip, shown above the trigger on hover/focus. */
export interface TooltipProps {
  /** Tooltip content. Multi-line: secondary lines in #e7e7e2. Keep it factual ("Central District — 792 people"). */
  label?: React.ReactNode;
  /** The trigger element */
  children?: React.ReactNode;
  /** Applied to the trigger wrapper */
  style?: React.CSSProperties;
}
