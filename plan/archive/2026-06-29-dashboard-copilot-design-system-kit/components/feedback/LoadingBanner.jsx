import React from "react";

/**
 * Blue "Working..." banner with a pulsing dot (CSS ring animation).
 */
export function LoadingBanner({ label = "Working..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        alignItems: "center",
        background: "var(--blue-soft)",
        border: "1px solid var(--blue-border)",
        borderRadius: "8px",
        color: "var(--blue-deep)",
        display: "inline-flex",
        fontSize: "0.78rem",
        fontWeight: 700,
        gap: "7px",
        lineHeight: 1,
        minHeight: "26px",
        padding: "4px 9px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ background: "currentColor", borderRadius: "50%", height: "6px", width: "6px", position: "relative" }}>
        <span
          style={{
            animation: "dcPulseRing 1.25s ease-out infinite",
            border: "1px solid currentColor",
            borderRadius: "50%",
            position: "absolute",
            inset: "-5px",
            opacity: 0,
          }}
        />
      </span>
      <span>{label}</span>
    </div>
  );
}
