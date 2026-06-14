import React from "react";

/**
 * KPI tile: muted label on top, big 1.8rem/760 number below, panel background.
 */
export function Metric({ label, value, style }) {
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: "8px",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "18px",
        animation:
          typeof document !== "undefined" && document.visibilityState === "visible"
            ? "dcContentIn 260ms var(--ease)"
            : "none",
        ...style,
      }}
    >
      <span style={{ color: "var(--muted)", display: "block", fontSize: "0.84rem" }}>{label}</span>
      <strong style={{ display: "block", fontSize: "1.8rem", fontWeight: 760, lineHeight: 1, marginTop: "10px" }}>
        {value}
      </strong>
    </div>
  );
}
