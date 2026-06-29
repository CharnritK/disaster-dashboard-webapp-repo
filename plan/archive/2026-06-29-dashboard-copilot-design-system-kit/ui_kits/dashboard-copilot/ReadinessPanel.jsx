import React from "react";
import { Pill } from "../../components/feedback/Pill.jsx";

/**
 * Decision readiness panel — white card with a 5px severity left border,
 * status pill, 3-tile readiness grid, and caveat list. Shared by steps 5–7.
 */
export function ReadinessPanel({ compact = false }) {
  return (
    <article
      style={{
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderLeft: "5px solid var(--amber)",
        borderRadius: "8px",
        boxShadow: "var(--shadow)",
        display: "grid",
        gap: compact ? "12px" : "18px",
        padding: "22px",
      }}
    >
      <div>
        <p style={{ color: "var(--accent)", fontSize: "0.75rem", fontWeight: 800, margin: "0 0 8px", textTransform: "uppercase" }}>
          Decision readiness
        </p>
        <Pill tone="ink" style={{ marginBottom: "8px" }}>Review needed</Pill>
        <h3 style={{ fontSize: "1.28rem", fontWeight: 720, lineHeight: 1.2, margin: "8px 0 0" }}>
          Usable with caveats
        </h3>
        <p style={{ color: "var(--muted)", lineHeight: 1.52, margin: "8px 0 0" }}>
          Required evidence is mostly covered. Review the service-gap caveat before acting on
          district rankings.
        </p>
      </div>
      {!compact && (
        <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
          {[
            ["Covered evidence", "2"],
            ["Missing evidence", "0"],
            ["Blockers", "0"],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "8px", padding: "12px" }}>
              <span style={{ color: "var(--muted)", display: "block", fontSize: "0.78rem", fontWeight: 720 }}>{label}</span>
              <strong style={{ display: "block", fontSize: "1.45rem", fontWeight: 760, lineHeight: 1.1, marginTop: "5px" }}>{value}</strong>
            </div>
          ))}
        </div>
      )}
      <ul style={{ color: "var(--muted)", margin: 0, paddingLeft: "18px" }}>
        <li>response_gap_percent is 18% missing in East District.</li>
        {!compact && <li>Assessment coverage is partial for clinic sites.</li>}
      </ul>
    </article>
  );
}
