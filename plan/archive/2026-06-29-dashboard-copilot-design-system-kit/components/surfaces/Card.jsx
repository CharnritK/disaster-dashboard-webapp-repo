import React from "react";

/**
 * White card: 1px line border, 8px radius, 18px padding, hairline shadow.
 * Optional eyebrow + title header.
 */
export function Card({ eyebrow, title, children, padding = "18px", style }) {
  return (
    <article
      style={{
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "8px",
        boxShadow: "var(--shadow-card)",
        padding,
        ...style,
      }}
    >
      {eyebrow && (
        <p
          style={{
            color: "var(--accent)",
            fontSize: "0.75rem",
            fontWeight: 800,
            margin: "0 0 8px",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </p>
      )}
      {title && (
        <h3 style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.25, margin: "0 0 10px" }}>{title}</h3>
      )}
      {children}
    </article>
  );
}
