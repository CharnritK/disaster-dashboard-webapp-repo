/**
 * Dashboard Copilot button. 40px min-height, weight 600, 8px radius.
 * Hover lifts -1px. Disabled = opacity .45.
 * @startingPoint section="Components" subtitle="Default, primary (ink) and accent (teal) buttons" viewport="700x220"
 */
export interface ButtonProps {
  /** "default" white outline · "primary" ink fill · "accent" teal fill (advance-the-workflow actions) */
  variant?: "default" | "primary" | "accent";
  children: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  style?: React.CSSProperties;
}
