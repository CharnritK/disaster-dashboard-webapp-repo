import React from "react";

/**
 * Checkbox with inline label text, 9px gap.
 */
export function CheckboxRow({ label, checked, onChange, style }) {
  return (
    <label
      style={{
        alignItems: "center",
        display: "flex",
        gap: "9px",
        fontSize: "0.86rem",
        color: "var(--muted)",
        ...style,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange && onChange(event.target.checked)}
        style={{ flex: "0 0 auto" }}
      />
      <span>{label}</span>
    </label>
  );
}
