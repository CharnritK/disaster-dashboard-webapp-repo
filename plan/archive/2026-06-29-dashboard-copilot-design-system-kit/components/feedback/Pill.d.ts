/** Text pill — the brand's icon substitute. 0.76rem, weight 780, 999px radius. */
export interface PillProps {
  /** neutral (muted outline) · ink (dark text outline) · blue (required) · accent (export types, complete) · panel (meta chips) */
  tone?: "neutral" | "ink" | "blue" | "accent" | "panel";
  /** Smaller uppercase variant for type tags like CSV / JSON / PNG */
  uppercase?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
