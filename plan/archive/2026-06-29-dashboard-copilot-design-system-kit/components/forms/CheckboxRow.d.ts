/** Checkbox with inline label, 9px gap — used for evidence choices and acknowledgements. */
export interface CheckboxRowProps {
  label: React.ReactNode;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  style?: React.CSSProperties;
}
