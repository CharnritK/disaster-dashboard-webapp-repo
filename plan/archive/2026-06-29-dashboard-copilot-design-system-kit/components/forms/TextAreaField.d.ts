/** Labeled textarea (vertical resize only). Same label treatment as Field. */
export interface TextAreaFieldProps {
  label: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
}
