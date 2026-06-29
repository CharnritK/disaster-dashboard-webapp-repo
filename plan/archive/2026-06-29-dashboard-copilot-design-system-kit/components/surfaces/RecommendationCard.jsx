import React from "react";

/**
 * Teal-filled recommendation card with eyebrow, title, body, optional "Why:" box and actions row.
 * The loudest surface in the product — one per view, max.
 */
export function RecommendationCard({ eyebrow = "Recommended", title, children, why, actions, style }) {
  return (
    <article
      style={{
        background: "var(--accent)",
        border: "1px solid var(--accent)",
        borderRadius: "8px",
        boxShadow: "var(--shadow)",
        color: "white",
        padding: "22px",
        ...style,
      }}
    >
      <p
        style={{
          color: "#d8d8d2",
          fontSize: "0.75rem",
          fontWeight: 800,
          margin: "0 0 8px",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </p>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 720, lineHeight: 1.2, margin: 0 }}>{title}</h2>
      {children && <div style={{ lineHeight: 1.52, margin: "8px 0 0" }}>{children}</div>}
      {why && (
        <div
          style={{
            background: "rgba(0,0,0,0.1)",
            border: "1px solid rgba(0,0,0,0.15)",
            borderRadius: "8px",
            margin: "14px 0",
            padding: "12px",
          }}
        >
          <strong>Why:</strong> {why}
        </div>
      )}
      {actions && <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px" }}>{actions}</div>}
    </article>
  );
}
