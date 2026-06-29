import React from "react";
import { formLabelStyle, formControlStyle } from "./Field.jsx";

/**
 * Labeled textarea, vertical resize only.
 */
export function TextAreaField({ label, value, onChange, placeholder, rows = 3, style }) {
  return (
    <label style={{ ...formLabelStyle, ...style }}>
      {label}
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange && onChange(event.target.value)}
        style={{ ...formControlStyle, resize: "vertical" }}
      />
    </label>
  );
}
