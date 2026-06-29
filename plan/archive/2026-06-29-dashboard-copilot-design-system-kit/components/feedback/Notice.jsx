import React from "react";

/**
 * Inline warn/error notice block — soft tinted bg, 1px tinted border.
 */
export function Notice({ tone = "warn", items = [], children, style }) {
  const palette = {
    warn: { bg: "var(--amber-soft)", border: "var(--amber-border)", color: "var(--amber)" },
    error: { bg: "var(--red-soft)", border: "var(--red-border)", color: "var(--red)" },
  }[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      style={{
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: "8px",
        color: palette.color,
        margin: "14px 0",
        padding: "12px",
        animation:
          typeof document !== "undefined" && document.visibilityState === "visible"
            ? "dcContentIn 220ms var(--ease)"
            : "none",
        ...style,
      }}
    >
      {items.map((item) => (
        <p key={item} style={{ margin: "0 0 4px", lineHeight: 1.52 }}>
          {item}
        </p>
      ))}
      {children}
    </div>
  );
}
