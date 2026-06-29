import React from "react";

/**
 * Zero-data placeholder. Default: dashed-border panel centered in a tall
 * region ("Add data to begin"). Compact: solid hairline tile for empty
 * sub-sections ("none detected").
 * Source: `.empty-state`, `.quality-empty` / `.mini-empty` in app/styles.css.
 */
export function EmptyState({ title, children, actions, compact = false, minHeight = "300px", style }) {
  if (compact) {
    return (
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          color: "var(--muted)",
          fontSize: "0.9rem",
          padding: "14px",
          ...style,
        }}
      >
        {title && (
          <strong style={{ color: "var(--ink)", display: "block", fontWeight: 720, marginBottom: "4px" }}>
            {title}
          </strong>
        )}
        {children}
      </div>
    );
  }
  return (
    <div
      style={{
        alignItems: "flex-start",
        background: "var(--panel)",
        border: "1px dashed var(--line-strong)",
        borderRadius: "8px",
        display: "grid",
        gap: "10px",
        justifyItems: "start",
        minHeight,
        padding: "28px",
        placeContent: "center",
        textAlign: "left",
        ...style,
      }}
    >
      {title && <h3 style={{ fontSize: "1.18rem", fontWeight: 720, lineHeight: 1.25, margin: 0 }}>{title}</h3>}
      {children && <div style={{ color: "var(--muted)", display: "grid", gap: "6px" }}>{children}</div>}
      {actions && <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "4px" }}>{actions}</div>}
    </div>
  );
}
