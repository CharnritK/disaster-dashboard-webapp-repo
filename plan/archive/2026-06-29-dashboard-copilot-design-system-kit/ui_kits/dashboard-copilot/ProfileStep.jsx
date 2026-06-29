import React from "react";
import { SectionHeading } from "../../components/surfaces/SectionHeading.jsx";
import { Card } from "../../components/surfaces/Card.jsx";
import { Accordion } from "../../components/surfaces/Accordion.jsx";
import { Button } from "../../components/actions/Button.jsx";
import { Pill } from "../../components/feedback/Pill.jsx";
import { SeverityCallout } from "../../components/feedback/SeverityCallout.jsx";
import { DataTable } from "../../components/data/DataTable.jsx";
import { DATASETS, mutedText, codeChip, stepStack } from "./KitData.jsx";

function ProfileCard({ dataset }) {
  return (
    <Card eyebrow={dataset.fileType} style={{ display: "grid", gap: "12px", alignContent: "start" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, overflowWrap: "anywhere" }}>{dataset.name}</h3>
      <div style={{ background: "var(--soft)", display: "flex", flexWrap: "wrap", padding: "6px 0" }}>
        {[`${dataset.rows} rows`, `${dataset.columns} columns`, `${dataset.duplicates} duplicates`].map((chip, index) => (
          <span
            key={chip}
            style={{
              color: "var(--muted)",
              fontSize: "0.76rem",
              padding: "0 9px",
              borderRight: index < 2 ? "1px solid var(--line-strong)" : "none",
            }}
          >
            {chip}
          </span>
        ))}
      </div>
      <Accordion card={false} summary="Recommendations">
        <ul style={{ display: "grid", gap: "9px", listStyle: "none", margin: 0, padding: 0 }}>
          {[
            ["Recommended join fields", dataset.joinFields],
            ["Recommended metrics", dataset.metricFields],
            ["Recommended groupings", dataset.groupFields],
          ].map(([label, value]) => (
            <li key={label} style={{ borderBottom: "1px solid var(--line)", display: "grid", gap: "3px", paddingBottom: "9px" }}>
              <strong style={{ fontWeight: 760 }}>{label}</strong>
              <span style={{ color: "var(--muted)" }}>{value}</span>
            </li>
          ))}
        </ul>
      </Accordion>
    </Card>
  );
}

function CoveragePanel() {
  const items = [
    {
      severity: "low",
      label: "Covered",
      need: "Needs severity by area",
      candidate: <>demo_needs_assessment.csv <code style={codeChip}>need_severity_score</code> — 0% missing, 92% confidence</>,
      next: "No action needed before harmonization.",
    },
    {
      severity: "low",
      label: "Covered",
      need: "Population baseline by area",
      candidate: <>demo_population_baseline.csv <code style={codeChip}>population_total</code> — 0% missing, 95% confidence</>,
      next: "No action needed before harmonization.",
    },
    {
      severity: "medium",
      label: "Needs review",
      need: "Service capacity or response gaps",
      candidate: <>demo_needs_assessment.csv <code style={codeChip}>response_gap_percent</code> — 18% missing, 64% confidence</>,
      next: "Confirm the field maps to service gaps, or upload a capacity dataset.",
    },
  ];
  return (
    <Card style={{ display: "grid", gap: "16px", padding: "20px", boxShadow: "var(--shadow)" }}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: "16px", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <p style={{ color: "var(--accent)", fontSize: "0.75rem", fontWeight: 800, margin: "0 0 8px", textTransform: "uppercase" }}>
            Evidence coverage
          </p>
          <h3 style={{ fontSize: "1.24rem", fontWeight: 720, margin: 0 }}>Evidence coverage</h3>
          <p style={{ ...mutedText, marginTop: "8px" }}>
            This checks whether your uploaded files contain the evidence needed for the selected decision.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <Pill tone="ink">2 covered</Pill>
          <Pill tone="ink">1 need review</Pill>
          <Pill tone="ink">0 missing</Pill>
        </div>
      </div>
      <div style={{ display: "grid", gap: "12px" }}>
        {items.map((item) => (
          <SeverityCallout
            key={item.need}
            severity={item.severity}
            title={item.need}
            meta={<Pill tone="panel">{item.label}</Pill>}
            style={{ padding: "14px" }}
          >
            <span style={{ color: "var(--muted)", fontSize: "0.86rem" }}>{item.candidate}</span>
            <p style={{ margin: 0, display: "grid", gap: "3px" }}>
              <strong style={{ fontSize: "0.8rem", fontWeight: 760 }}>Next action</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.86rem" }}>{item.next}</span>
            </p>
          </SeverityCallout>
        ))}
      </div>
    </Card>
  );
}

export function ProfileStep({ onRecommend, working }) {
  return (
    <section style={stepStack}>
      <SectionHeading eyebrow="Step 3" title="Review Data Profiling" />
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {DATASETS.map((dataset) => (
          <ProfileCard key={dataset.name} dataset={dataset} />
        ))}
      </div>
      <CoveragePanel />
      <Accordion summary="Column details and samples" meta="14 columns">
        <DataTable
          columns={["Column", "Type", "Missing", "Unique", "Samples"]}
          rows={[
            [<code style={codeChip}>district_name</code>, "string", "0%", "4", "North District, Central District"],
            [<code style={codeChip}>people_assessed</code>, "number", "0%", "4", "642, 792, 388"],
            [<code style={codeChip}>need_severity_score</code>, "number", "0%", "4", "78, 74, 61"],
            [<code style={codeChip}>response_gap_percent</code>, "number", "18%", "4", "46, 41, 33"],
            [<code style={codeChip}>priority_need</code>, "string", "0%", "4", "water, food, shelter"],
          ]}
        />
      </Accordion>
      <Button variant="accent" disabled={working} onClick={onRecommend} style={{ justifySelf: "start" }}>
        {working ? "Generating recommendations..." : "Harmonize data"}
      </Button>
    </section>
  );
}
