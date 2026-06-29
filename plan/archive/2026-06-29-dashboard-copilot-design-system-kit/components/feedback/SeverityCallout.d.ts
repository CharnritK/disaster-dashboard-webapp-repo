/** Panel tile with a 4px severity left border — insights, quality checks, evidence coverage. */
export interface SeverityCalloutProps {
  /** info = blue · low/covered = teal · medium/review = amber · high/blocking = red */
  severity?: "info" | "low" | "medium" | "high";
  title?: React.ReactNode;
  /** Right-aligned slot next to the title (usually a Pill) */
  meta?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
