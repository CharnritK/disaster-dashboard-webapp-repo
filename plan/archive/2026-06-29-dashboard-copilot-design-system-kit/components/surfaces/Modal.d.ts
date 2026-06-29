/** Modal dialog over a dimmed ink backdrop. Closes on Escape and backdrop click. */
export interface ModalProps {
  /** Render the dialog. Default true. */
  open?: boolean;
  onClose?: () => void;
  /** Header title, 1.34rem weight 720 */
  title?: React.ReactNode;
  /** Muted paragraph under the title */
  description?: React.ReactNode;
  /** Dialog body. Sections separated by the 18px grid gap. */
  children?: React.ReactNode;
  /** Default "980px" (the decision-map width); use narrower for confirmations */
  maxWidth?: string;
  /** Text of the header close Button. Default "Close". */
  closeLabel?: string;
  /** Applied to the dialog surface */
  style?: React.CSSProperties;
}
