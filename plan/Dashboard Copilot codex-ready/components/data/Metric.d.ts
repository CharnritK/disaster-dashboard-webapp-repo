/** KPI tile: muted label above a 1.8rem number. Grid them at minmax(165px, 1fr). */
export interface MetricProps {
  label: React.ReactNode;
  /** Pre-formatted display value, e.g. "2,332" or "64.8" */
  value: React.ReactNode;
  style?: React.CSSProperties;
}
