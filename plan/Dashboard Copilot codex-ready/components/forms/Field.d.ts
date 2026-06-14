/** Labeled text input — muted 0.86rem label stacked above a 40px white control. */
export interface FieldProps {
  label: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  style?: React.CSSProperties;
}
