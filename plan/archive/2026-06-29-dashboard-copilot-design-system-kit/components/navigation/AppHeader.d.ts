/** Sticky translucent header (warm white + 18px blur, hairline bottom border). Tints blue while loading. */
export interface AppHeaderProps {
  /** Brand text, default "Dashboard Copilot" */
  title?: string;
  /** Pill nav links rendered next to the brand */
  links?: Array<{ label: string; href?: string; active?: boolean; onClick?: () => void }>;
  /** Blue loading tint on the whole bar */
  loading?: boolean;
  /** Right-side actions slot (LoadingBanner, ToggleSwitch, …) */
  children?: React.ReactNode;
  sticky?: boolean;
}
