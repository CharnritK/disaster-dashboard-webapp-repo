import React from "react";

/**
 * Severity tile: panel bg + 4px colored left border.
 * The product's strongest visual convention (insights, quality checks, coverage).
 */
export function SeverityCallout({ severity = "info", title, meta, children, style }) {
  const border = {
    info: "var(--blue)",
    low: "var(--accent)",
    medium: "var(--amber)",
    high: "var(--red)",
  }[severity];
  return (
    <article
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderLeft: `4px solid ${border}`,
        borderRadius: "8px",
        display: "grid",
        gap: "8px",
        padding: "12px",
        ...style,
      }}
    >
      {(title || meta) && (
        <div style={{ alignItems: "flex-start", display: "flex", gap: "8px", justifyContent: "space-between" }}>
          {title && <strong style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{title}</strong>}
          {meta}
        </div>
      )}
      {children}
    </article>
  );
}
