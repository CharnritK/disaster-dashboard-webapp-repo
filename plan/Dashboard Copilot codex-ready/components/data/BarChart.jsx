import React from "react";

function formatNumber(value) {
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

/**
 * Horizontal bar chart rows: label column + blue bar (value inside) on a track,
 * with a 3-tick axis. Bars animate scaleX from the left.
 */
export function BarChart({ items = [], maxBars = 10, color = "var(--chart-1)" }) {
  const visible = items.slice(0, maxBars);
  const max = Math.max(...visible.map((item) => item.value), 1);
  return (
    <div>
      {visible.map((item) => (
        <div
          key={item.label}
          style={{
            display: "grid",
            gap: "8px",
            gridTemplateColumns: "minmax(96px, 128px) 1fr",
            margin: "9px 0",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              color: "var(--muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "0.86rem",
              alignSelf: "center",
            }}
          >
            {item.label}
          </span>
          <div
            style={{
              background: "var(--chart-track)",
              border: "1px solid var(--chart-track-border)",
              borderRadius: "8px",
              minHeight: "30px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: color,
                borderRadius: "7px",
                color: "white",
                fontSize: "0.82rem",
                minHeight: "30px",
                padding: "6px 8px",
                whiteSpace: "nowrap",
                width: `${Math.max((item.value / max) * 100, 4)}%`,
                animation:
                  typeof document !== "undefined" && document.visibilityState === "visible"
                    ? "dcBarGrow 520ms var(--ease) both"
                    : "none",
                transformOrigin: "left center",
              }}
            >
              {formatNumber(item.value)}
            </div>
          </div>
        </div>
      ))}
      <div
        style={{
          color: "var(--muted)",
          display: "grid",
          fontSize: "0.74rem",
          gap: "8px",
          gridTemplateColumns: "repeat(3, 1fr)",
          marginLeft: "136px",
          paddingTop: "2px",
        }}
      >
        <span>0</span>
        <span style={{ textAlign: "center" }}>{formatNumber(max / 2)}</span>
        <span style={{ textAlign: "right" }}>{formatNumber(max)}</span>
      </div>
    </div>
  );
}
