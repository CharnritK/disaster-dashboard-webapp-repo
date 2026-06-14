import React from "react";

export const formLabelStyle = {
  color: "var(--muted)",
  display: "grid",
  fontSize: "0.86rem",
  fontWeight: 720,
  gap: "6px",
};

export const formControlStyle = {
  background: "var(--paper)",
  border: "1px solid var(--line-strong)",
  borderRadius: "8px",
  color: "var(--ink)",
  font: "inherit",
  minHeight: "40px",
  padding: "9px 11px",
  width: "100%",
};

/**
 * Labeled text input. Label sits above, muted, weight 720.
 */
export function Field({ label, value, onChange, placeholder, type = "text", style }) {
  return (
    <label style={{ ...formLabelStyle, ...style }}>
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange && onChange(event.target.value)}
        style={formControlStyle}
      />
    </label>
  );
}
