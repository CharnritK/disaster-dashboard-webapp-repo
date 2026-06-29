import React from "react";
import { formLabelStyle, formControlStyle } from "./Field.jsx";

/**
 * Labeled select with the brand's CSS-drawn double-triangle chevron.
 */
export function SelectField({ label, value, onChange, options = [], style }) {
  return (
    <label style={{ ...formLabelStyle, ...style }}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange && onChange(event.target.value)}
        style={{
          ...formControlStyle,
          appearance: "none",
          WebkitAppearance: "none",
          backgroundImage:
            "linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%)",
          backgroundPosition: "calc(100% - 17px) 17px, calc(100% - 12px) 17px",
          backgroundRepeat: "no-repeat",
          backgroundSize: "5px 5px, 5px 5px",
          padding: "8px 32px 8px 11px",
        }}
      >
        {options.map((option) => {
          const opt = typeof option === "string" ? { value: option, label: option } : option;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}
