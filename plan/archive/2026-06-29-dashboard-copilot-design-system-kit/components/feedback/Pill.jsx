import React from "react";

/**
 * Rounded text pill. The product's stand-in for icons: short uppercase or
 * sentence-case labels like "CSV", "Required", "Needs review", "82% match rate".
 */
export function Pill({ tone = "neutral", uppercase = false, children, style }) {
  const palette = {
    neutral: { bg: "transparent", border: "var(--line-strong)", color: "var(--muted)" },
    ink: { bg: "transparent", border: "var(--line-strong)", color: "var(--ink)" },
    blue: { bg: "var(--blue-soft-alt)", border: "var(--blue-border-alt)", color: "var(--blue)" },
    accent: { bg: "var(--accent-soft)", border: "var(--accent-border)", color: "var(--accent)" },
    panel: { bg: "var(--panel)", border: "var(--line)", color: "var(--muted)" },
  }[tone];
  return (
    <span
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: "999px",
        color: palette.color,
        display: "inline-flex",
        alignItems: "center",
        fontSize: uppercase ? "0.72rem" : "0.76rem",
        fontWeight: 780,
        lineHeight: 1,
        padding: uppercase ? "5px 8px" : "6px 8px",
        textTransform: uppercase ? "uppercase" : "none",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
