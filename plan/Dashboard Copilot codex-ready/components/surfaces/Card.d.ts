/** White card with 1px border, 8px radius, 18px padding, hairline shadow. */
export interface CardProps {
  /** Teal uppercase eyebrow above the title (e.g. "CSV", "Step 2") */
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Default "18px"; main panels use "28px" */
  padding?: string;
  style?: React.CSSProperties;
}
