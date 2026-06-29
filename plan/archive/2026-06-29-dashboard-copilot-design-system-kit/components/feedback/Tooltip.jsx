import React, { useState } from "react";

/**
 * Ink-black rounded tooltip chip — the chart-tooltip convention generalized.
 * Shows above the trigger on hover and keyboard focus; fades + rises 4px.
 * Source: `.chart-mark[data-tooltip]` / `.chart-tooltip` in app/styles.css.
 */
export function Tooltip({ label, children, style }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      style={{ display: "inline-block", position: "relative", ...style }}
    >
      {children}
      <span
        role="tooltip"
        aria-hidden={!open}
        style={{
          background: "#171717",
          borderRadius: "7px",
          bottom: "calc(100% + 8px)",
          boxShadow: "var(--shadow-tooltip)",
          color: "white",
          fontSize: "0.76rem",
          left: "50%",
          lineHeight: 1.35,
          maxWidth: "min(260px, 78vw)",
          opacity: open ? 1 : 0,
          padding: "8px 9px",
          pointerEvents: "none",
          position: "absolute",
          transform: open ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(4px)",
          transition: "opacity 140ms var(--ease), transform 140ms var(--ease)",
          width: "max-content",
          zIndex: 10,
        }}
      >
        {label}
      </span>
    </span>
  );
}
