import React from "react";

/**
 * Inline code chip for data terms. Column and dataset names render as
 * monospace chips (need_severity_score), with human display labels alongside.
 * Source: `.inline-code` in app/styles.css.
 */
export function InlineCode({ children, style }) {
  return (
    <code
      style={{
        background: "#f1f2ed",
        border: "1px solid var(--line)",
        borderRadius: "5px",
        color: "var(--ink)",
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: "0.88em",
        padding: "1px 5px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </code>
  );
}
