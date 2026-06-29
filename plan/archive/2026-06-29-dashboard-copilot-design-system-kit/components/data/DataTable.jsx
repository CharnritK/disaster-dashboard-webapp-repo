import React from "react";

/**
 * Bordered, rounded data table: panel header, hairline row borders, row hover tint.
 */
export function DataTable({ columns = [], rows = [], maxHeight }) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "8px",
        maxWidth: "100%",
        overflowX: "auto",
        overflowY: maxHeight ? "auto" : undefined,
        maxHeight,
        width: "100%",
      }}
    >
      <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{
                  background: "var(--panel)",
                  borderBottom: "1px solid var(--line)",
                  color: "var(--muted)",
                  fontSize: "0.86rem",
                  fontWeight: 700,
                  padding: "9px 10px",
                  position: "sticky",
                  top: 0,
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <Row key={rowIndex} row={row} last={rowIndex === rows.length - 1} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ row, last }) {
  const [hover, setHover] = React.useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: hover ? "#fafaf6" : "transparent", transition: "background-color 140ms ease" }}
    >
      {row.map((cell, cellIndex) => (
        <td
          key={cellIndex}
          style={{
            borderBottom: last ? 0 : "1px solid var(--line)",
            fontSize: "0.86rem",
            padding: "9px 10px",
            textAlign: "left",
            whiteSpace: "nowrap",
          }}
        >
          {cell}
        </td>
      ))}
    </tr>
  );
}
