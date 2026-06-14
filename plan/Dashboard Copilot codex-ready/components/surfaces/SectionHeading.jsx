import React from "react";

/**
 * Step/section heading: teal uppercase eyebrow + 1.8rem/720 title, hairline bottom border.
 */
export function SectionHeading({ eyebrow, title, style }) {
  return (
    <div style={{ borderBottom: "1px solid var(--line)", margin: 0, paddingBottom: "16px", ...style }}>
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
      <h2 style={{ fontSize: "1.8rem", fontWeight: 720, lineHeight: 1.2, margin: 0 }}>{title}</h2>
    </div>
  );
}
