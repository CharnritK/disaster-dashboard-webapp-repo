/** Teal-filled hero card for the system's recommendation. One per view. White primary button inside. */
export interface RecommendationCardProps {
  /** Default "Recommended" */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  /** Body copy */
  children?: React.ReactNode;
  /** Rationale shown in a darkened "Why:" box */
  why?: React.ReactNode;
  /** Buttons row. Inside this card, primary = white fill with ink text; secondary = translucent white outline. */
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}
