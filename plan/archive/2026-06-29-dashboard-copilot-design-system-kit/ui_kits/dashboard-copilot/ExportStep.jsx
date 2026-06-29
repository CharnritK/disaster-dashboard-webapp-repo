import React, { useState } from "react";
import { SectionHeading } from "../../components/surfaces/SectionHeading.jsx";
import { Card } from "../../components/surfaces/Card.jsx";
import { Pill } from "../../components/feedback/Pill.jsx";
import { CheckboxRow } from "../../components/forms/CheckboxRow.jsx";
import { ReadinessPanel } from "./ReadinessPanel.jsx";
import { stepStack } from "./KitData.jsx";

const EXPORTS = [
  { type: "CSV", label: "Prepared dataset", meta: "Downloads the harmonized, cleaned rows used to generate the dashboard.", detail: "4 rows prepared for analysis." },
  { type: "JSON", label: "Decision handoff log", meta: "Includes evidence coverage, join review, quality caveats, and transformation history.", detail: "3 recorded steps available." },
  { type: "PNG", label: "Dashboard image", meta: "Captures the full generated dashboard as a shareable static image.", detail: "4 charts with recommended insights expanded." },
  { type: "PDF", label: "Dashboard report", meta: "Packages the dashboard, quality checks, and transformation summary for review.", detail: "Includes 2 quality issues and 3 transformations." },
];

function ExportOption({ option, enabled }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      disabled={!enabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        alignContent: "start",
        background: enabled && hover ? "#f8faf8" : "var(--paper)",
        border: `1px solid ${enabled && hover ? "var(--accent)" : "var(--line)"}`,
        borderRadius: "8px",
        boxShadow: enabled && hover ? "0 10px 22px rgba(23,23,23,0.07)" : "var(--shadow-card)",
        cursor: enabled ? "pointer" : "not-allowed",
        display: "grid",
        font: "inherit",
        gap: "8px",
        justifyItems: "start",
        minHeight: "148px",
        opacity: enabled ? 1 : 0.45,
        padding: "18px",
        textAlign: "left",
        transition: "background-color 160ms var(--ease), border-color 160ms var(--ease), box-shadow 160ms var(--ease)",
      }}
    >
      <Pill tone="accent" uppercase>{option.type}</Pill>
      <span style={{ color: "var(--ink)", fontSize: "1rem", fontWeight: 760, lineHeight: 1.2 }}>{option.label}</span>
      <span style={{ color: "var(--muted)", fontSize: "0.84rem", fontWeight: 560, lineHeight: 1.35 }}>{option.meta}</span>
      <span style={{ borderTop: "1px solid var(--line)", color: "var(--ink)", fontSize: "0.78rem", fontWeight: 720, lineHeight: 1.3, marginTop: "4px", paddingTop: "9px" }}>
        {option.detail}
      </span>
    </button>
  );
}

export function ExportStep() {
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <section style={stepStack}>
      <SectionHeading eyebrow="Step 7" title="Export Dashboard Assets" />
      <ReadinessPanel />
      <label
        style={{
          alignItems: "center",
          background: "var(--amber-ack-bg)",
          border: "1px solid var(--amber-ack-border)",
          borderRadius: "8px",
          color: "var(--amber-ack-text)",
          display: "flex",
          fontWeight: 720,
          gap: "9px",
          padding: "13px 14px",
        }}
      >
        <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
        <span>I reviewed the decision-readiness caveats before exporting.</span>
      </label>
      <Card style={{ display: "grid", gap: "18px", background: "linear-gradient(180deg, #ffffff 0%, #fbfbf8 100%)", boxShadow: "0 14px 36px rgba(23,23,23,0.06)" }}>
        <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "14px" }}>
          <p style={{ color: "var(--accent)", fontSize: "0.75rem", fontWeight: 800, margin: 0, textTransform: "uppercase" }}>
            Available exports
          </p>
        </div>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {EXPORTS.map((option) => (
            <ExportOption key={option.type} option={option} enabled={acknowledged} />
          ))}
        </div>
      </Card>
    </section>
  );
}
