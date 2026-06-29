import React from "react";
import { SectionHeading } from "../../components/surfaces/SectionHeading.jsx";
import { Card } from "../../components/surfaces/Card.jsx";
import { Button } from "../../components/actions/Button.jsx";
import { SelectField } from "../../components/forms/SelectField.jsx";
import { TextAreaField } from "../../components/forms/TextAreaField.jsx";
import { SeverityCallout } from "../../components/feedback/SeverityCallout.jsx";
import { Pill } from "../../components/feedback/Pill.jsx";
import { DATASETS, EVIDENCE, mutedText, stepStack } from "./KitData.jsx";

function SensitiveDataNote() {
  return (
    <div
      role="note"
      style={{
        background: "var(--amber-soft)",
        border: "1px solid var(--amber-border)",
        borderRadius: "8px",
        color: "var(--amber)",
        padding: "12px 14px",
      }}
    >
      <strong style={{ color: "var(--amber-deep)", display: "block", marginBottom: "2px" }}>
        Carefully consider data sources
      </strong>
      <p style={{ margin: 0 }}>
        Do not upload sensitive personal, medical, financial, or restricted data. When AI
        recommendations are <em>on</em>, dataset details and semantic comments may be sent to the
        configured LLM provider with minimized sample values.
      </p>
    </div>
  );
}

function AgentContextChecklist() {
  return (
    <section
      style={{
        alignItems: "start",
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "8px",
        display: "grid",
        gap: "16px",
        gridTemplateColumns: "minmax(0, 1.3fr) minmax(240px, 0.7fr)",
        padding: "16px",
      }}
    >
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.25, margin: "0 0 6px" }}>
          Help the agent read the upload correctly
        </h3>
        <p style={mutedText}>
          Map each file to the evidence it supports, then add the row meaning, unit, source, date
          coverage, and known caveats. Keep notes factual; uploaded notes are context, not
          instructions.
        </p>
      </div>
      <ul style={{ display: "grid", gap: "6px", listStyle: "none", margin: 0, padding: 0 }}>
        {["What one row represents", "Which field joins files", "Which field sets time", "Units or score scale", "Known gaps or bias"].map((item) => (
          <li
            key={item}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              color: "var(--muted)",
              fontSize: "0.84rem",
              fontWeight: 680,
              padding: "7px 9px",
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DatasetCard({ dataset }) {
  return (
    <Card eyebrow={`Upload ${dataset.fileType}`} style={{ display: "grid", gap: "14px", alignContent: "start" }}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: "12px", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, overflowWrap: "anywhere" }}>{dataset.name}</h3>
        <button
          type="button"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--line-strong)",
            borderRadius: "8px",
            color: "var(--red)",
            cursor: "pointer",
            font: "inherit",
            fontSize: "0.8rem",
            fontWeight: 600,
            minHeight: "32px",
            padding: "6px 9px",
            flex: "0 0 auto",
          }}
        >
          Remove
        </button>
      </div>
      <p style={mutedText}>{dataset.rows} rows, {dataset.columns} columns</p>
      <SeverityCallout
        severity="info"
        title={`${dataset.fileType} format check`}
        meta={<Pill tone="panel">Accepted</Pill>}
      >
        <span style={{ color: "var(--muted)", fontSize: "0.84rem" }}>{dataset.summary}</span>
      </SeverityCallout>
      <div style={{ borderTop: "1px solid var(--line)", display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", paddingTop: "14px" }}>
        <SelectField label="Suggested required data" value={EVIDENCE[0]} options={["Not mapped yet", ...EVIDENCE, "Supporting context"]} />
        <SelectField label="Join or ID field" value="admin_pcode" options={["Not selected", "admin_pcode", "district_name"]} />
        <TextAreaField
          label="Semantic comment for the agent"
          rows={2}
          placeholder="Rows are districts; severity_score is 0-100; data came from rapid assessment round 2."
          style={{ gridColumn: "1 / -1" }}
        />
      </div>
    </Card>
  );
}

export function UploadStep({ loaded, onLoadSamples, onProfile }) {
  return (
    <section style={stepStack}>
      <SectionHeading eyebrow="Step 2" title="Upload Data" />
      <SensitiveDataNote />
      {!loaded ? (
        <div
          style={{
            alignItems: "flex-start",
            background: "var(--panel)",
            border: "1px dashed var(--line-strong)",
            borderRadius: "8px",
            display: "grid",
            gap: "10px",
            justifyItems: "start",
            minHeight: "260px",
            padding: "28px",
            placeContent: "center",
          }}
        >
          <h3 style={{ fontSize: "1.18rem", fontWeight: 720, margin: 0 }}>Add data to begin</h3>
          <p style={mutedText}>CSV or XLSX files, up to 1MB each.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
            <Button variant="primary">Upload files</Button>
            <Button onClick={onLoadSamples}>Use sample data</Button>
            <Button onClick={onLoadSamples}>Use fragmented demo data</Button>
            <Button onClick={onLoadSamples}>Use risky quality sample</Button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ borderBottom: "1px solid var(--line)", display: "flex", flexWrap: "wrap", gap: "10px", paddingBottom: "16px" }}>
            <Button variant="primary">Upload files</Button>
            <Button>Replace with sample data</Button>
            <Button>Use fragmented demo data</Button>
          </div>
          <AgentContextChecklist />
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {DATASETS.map((dataset) => (
              <DatasetCard key={dataset.name} dataset={dataset} />
            ))}
          </div>
          <Button variant="accent" onClick={onProfile} style={{ justifySelf: "start" }}>
            Profile data
          </Button>
        </>
      )}
    </section>
  );
}
