import React, { useState } from "react";

/**
 * Native-details accordion with the brand's typographic +/− marker and an optional meta pill.
 */
export function Accordion({ summary, meta, defaultOpen = false, children, card = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      open={defaultOpen || undefined}
      onToggle={(event) => setOpen(event.target.open)}
      style={
        card
          ? {
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              boxShadow: "var(--shadow-card)",
              padding: "18px",
              margin: 0,
            }
          : { margin: 0 }
      }
    >
      <summary
        style={{
          alignItems: "center",
          cursor: "pointer",
          display: "flex",
          gap: "12px",
          justifyContent: "space-between",
          listStyle: "none",
          fontWeight: 650,
          color: "var(--ink)",
        }}
      >
        <span style={{ display: "grid", gap: "2px", minWidth: 0 }}>{summary}</span>
        <span style={{ alignItems: "center", display: "inline-flex", gap: "8px", flex: "0 0 auto" }}>
          {meta && (
            <span
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                borderRadius: "999px",
                color: "var(--muted)",
                fontSize: "0.76rem",
                fontWeight: 720,
                lineHeight: 1,
                padding: "5px 8px",
                whiteSpace: "nowrap",
              }}
            >
              {meta}
            </span>
          )}
          <span aria-hidden="true" style={{ color: "var(--muted)", fontSize: "1.1rem", fontWeight: 760, lineHeight: 1 }}>
            {open ? "\u2212" : "+"}
          </span>
        </span>
      </summary>
      <div style={{ borderTop: "1px solid var(--line)", marginTop: "14px", paddingTop: "14px" }}>{children}</div>
    </details>
  );
}
