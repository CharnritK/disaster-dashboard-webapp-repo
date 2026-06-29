import React from "react";

/**
 * Workflow stepper — numbered pills. States: complete (teal soft), active (ink), upcoming (translucent).
 */
export function Stepper({ steps = [], currentIndex = 0, onNavigate, canNavigateTo }) {
  return (
    <nav
      aria-label="Workflow steps"
      style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "8px" }}
    >
      {steps.map((label, index) => {
        const state = index < currentIndex ? "complete" : index === currentIndex ? "active" : "upcoming";
        const allowed = canNavigateTo ? canNavigateTo(index) : index <= currentIndex;
        const disabled = state === "active" || !allowed;
        const palette = {
          complete: { bg: "#eef7f5", border: "#c6ded9", color: "var(--accent)", idx: "#d8ece8" },
          active: { bg: "var(--ink)", border: "var(--ink)", color: "white", idx: "rgba(255,255,255,0.18)" },
          upcoming: { bg: "rgba(255,255,255,0.54)", border: "var(--line)", color: "var(--muted)", idx: "rgba(23,23,23,0.08)" },
        }[state];
        return (
          <button
            type="button"
            key={label}
            disabled={disabled}
            aria-current={state === "active" ? "step" : undefined}
            onClick={() => onNavigate && onNavigate(index)}
            style={{
              alignItems: "center",
              background: palette.bg,
              border: `1px solid ${palette.border}`,
              borderRadius: "999px",
              color: palette.color,
              cursor: disabled ? (state === "active" ? "default" : "not-allowed") : "pointer",
              display: "inline-flex",
              font: "inherit",
              fontSize: "0.82rem",
              gap: "7px",
              minHeight: "auto",
              opacity: state !== "active" && !allowed ? 0.45 : 1,
              padding: "5px 10px 5px 6px",
              transition:
                "background-color 180ms var(--ease), border-color 180ms var(--ease), color 180ms var(--ease)",
            }}
          >
            <span
              style={{
                alignItems: "center",
                background: palette.idx,
                borderRadius: "50%",
                display: "inline-flex",
                fontSize: "0.72rem",
                fontWeight: 760,
                height: "22px",
                justifyContent: "center",
                width: "22px",
              }}
            >
              {index + 1}
            </span>
            <span style={{ lineHeight: 1 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
