/** Zero-data placeholder. Default: dashed panel, content centered, left-aligned text. Compact: solid hairline tile. */
export interface EmptyStateProps {
  /** Heading, e.g. "Add data to begin". In compact mode renders as an ink strong line. */
  title?: React.ReactNode;
  /** Muted explanation. Plain complete sentences; state what is missing and what to do. */
  children?: React.ReactNode;
  /** Action row (Buttons), default variant only */
  actions?: React.ReactNode;
  /** Solid-border tile for empty sub-sections ("none detected"). Default false. */
  compact?: boolean;
  /** Default "300px" (the app's upload surface). Ignored in compact mode. */
  minHeight?: string;
  style?: React.CSSProperties;
}
