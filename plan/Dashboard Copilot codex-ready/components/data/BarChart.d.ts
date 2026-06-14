/** Horizontal bars on tracks with values inside and a 3-tick axis. Blue by default. */
export interface BarChartProps {
  items: Array<{ label: string; value: number }>;
  /** Default 10 */
  maxBars?: number;
  /** Bar fill; use var(--amber) for missingness views */
  color?: string;
}
