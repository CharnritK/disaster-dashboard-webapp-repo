/** Labeled select with the brand's CSS-drawn chevron. Options are strings or {value,label}. */
export interface SelectFieldProps {
  label: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  options?: Array<string | { value: string; label: string }>;
  style?: React.CSSProperties;
}
