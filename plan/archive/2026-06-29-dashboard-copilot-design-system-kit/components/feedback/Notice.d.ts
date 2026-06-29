/** Warn (amber) or error (red) notice block. Calm, factual copy; no icons. */
export interface NoticeProps {
  tone?: "warn" | "error";
  /** One paragraph per string */
  items?: string[];
  children?: React.ReactNode;
}
