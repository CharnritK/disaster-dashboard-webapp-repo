import React from "react";

/**
 * Pill toggle with label copy and a sliding track — the header "AI On/Off" switch.
 */
export function ToggleSwitch({ label = "AI", checked, onChange }) {
  return (
    <label
      style={{
        alignItems: "center",
        background: "rgba(255,255,255,0.72)",
        border: "1px solid var(--line)",
        borderRadius: "999px",
        color: "var(--muted)",
        cursor: "pointer",
        display: "inline-flex",
        fontSize: "0.78rem",
        fontWeight: 700,
        gap: "9px",
        lineHeight: 1,
        minHeight: "32px",
        padding: "5px 6px 5px 10px",
        position: "relative",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange && onChange(event.target.checked)}
        style={{ opacity: 0, pointerEvents: "none", position: "absolute" }}
      />
      <span style={{ alignItems: "baseline", display: "inline-flex", gap: "5px", whiteSpace: "nowrap" }}>
        <span>{label}</span>
        <strong style={{ color: "var(--ink)", fontWeight: 800 }}>{checked ? "On" : "Off"}</strong>
      </span>
      <span
        aria-hidden="true"
        style={{
          background: checked ? "var(--accent)" : "#d9dcd5",
          borderRadius: "999px",
          display: "inline-flex",
          height: "20px",
          padding: "2px",
          transition: "background-color 160ms var(--ease)",
          width: "38px",
        }}
      >
        <span
          style={{
            background: "white",
            borderRadius: "50%",
            boxShadow: "0 1px 4px rgba(23,23,23,0.2)",
            height: "16px",
            width: "16px",
            transform: checked ? "translateX(18px)" : "translateX(0)",
            transition: "transform 160ms var(--ease)",
          }}
        />
      </span>
    </label>
  );
}
