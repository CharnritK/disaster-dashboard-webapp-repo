/** Native <details> accordion with typographic +/− marker and optional meta pill on the right. */
export interface AccordionProps {
  /** Summary content (string or stacked title + sub) */
  summary: React.ReactNode;
  /** Small pill next to the marker, e.g. "96% match rate" or "6 columns" */
  meta?: React.ReactNode;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  /** Wrap in a white card (default true) */
  card?: boolean;
}
