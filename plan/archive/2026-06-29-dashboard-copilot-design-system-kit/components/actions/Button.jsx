import React, { useState } from "react";

/**
 * Dashboard Copilot button.
 * variants: "default" (white outline), "primary" (ink fill), "accent" (teal fill — workflow next-action)
 */
export function Button({
  variant = "default",
  children,
  disabled = false,
  fullWidth = false,
  type = "button",
  onClick,
  style,
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const base = {
    alignItems: "center",
    display: "inline-flex",
    justifyContent: "center",
    gap: "6px",
    minHeight: "40px",
    padding: "9px 13px",
    borderRadius: "8px",
    border: "1px solid var(--line-strong)",
    background: "var(--paper)",
    color: "var(--ink)",
    font: "inherit",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    textDecoration: "none",
    width: fullWidth ? "100%" : undefined,
    transform: !disabled && hover && !active ? "translateY(-1px)" : "translateY(0)",
    transition:
      "background-color 160ms var(--ease), border-color 160ms var(--ease), box-shadow 160ms var(--ease), color 160ms var(--ease), transform 160ms var(--ease)",
  };

  const variants = {
    default: {
      background: !disabled && hover ? "#f7f7f4" : "var(--paper)",
      borderColor: !disabled && hover ? "#aeb2aa" : "var(--line-strong)",
    },
    primary: {
      background: !disabled && hover ? "#2a2a2a" : "var(--ink)",
      borderColor: !disabled && hover ? "#2a2a2a" : "var(--ink)",
      color: "white",
    },
    accent: {
      background: !disabled && hover ? "var(--accent-hover)" : "var(--accent)",
      borderColor: !disabled && hover ? "var(--accent-hover)" : "var(--accent)",
      color: "white",
    },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}
