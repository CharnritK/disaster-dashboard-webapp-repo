import React from "react";
import { SectionHeading } from "../../components/surfaces/SectionHeading.jsx";
import { Card } from "../../components/surfaces/Card.jsx";
import { Accordion } from "../../components/surfaces/Accordion.jsx";
import { Button } from "../../components/actions/Button.jsx";
import { Pill } from "../../components/feedback/Pill.jsx";
import { SeverityCallout } from "../../components/feedback/SeverityCallout.jsx";
import { Metric } from "../../components/data/Metric.jsx";
import { BarChart } from "../../components/data/BarChart.jsx";
import { DataTable } from "../../components/data/DataTable.jsx";
import { ReadinessPanel } from "./ReadinessPanel.jsx";
import { DISTRICTS, mutedText, stepStack } from "./KitData.jsx";

function ChartCard({ title, rationale, children }) {
  return (
    <Card title={title} style={{ display: "grid", gap: "12px", alignContent: "start" }}>
      <p style={{ ...mutedText, fontSize: "0.9rem" }}>{rationale}</p>
      {children}
    </Card>
  );
}

function SectionLabel({ title }) {
  return (
    <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 720, lineHeight: 1.2, margin: 0 }}>{title}</h2>
    </div>
  );
}

export function DashboardScreen({ onExport }) {
  return (
    <section style={stepStack}>
      <SectionHeading eyebrow="Generated dashboard" title="Prepared response dataset" />
      <ReadinessPanel compact />
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))" }}>
        <Metric label="Total records" value="4" />
        <Metric label="Sum of People assessed" value="2,332" />
        <Metric label="Average of Need severity score" value="70" />
        <Metric label="Average of Response gap" value="39.5%" />
      </div>
      <Accordion
        defaultOpen
        summary={
          <>
            <strong>Recommended insights</strong>
            <span style={{ color: "var(--muted)", fontSize: "0.86rem", fontWeight: 500 }}>
              Evidence-backed observations and review prompts.
            </span>
          </>
        }
        meta="3 insights"
      >
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          <SeverityCallout severity="high" title="North District has the widest gap" meta={<Pill uppercase>priority</Pill>}>
            <span style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
              Severity 78 with a 46% response gap — the highest combination in the dataset.
            </span>
            <p style={{ background: "white", border: "1px solid var(--line)", borderRadius: "8px", display: "grid", gap: "2px", margin: 0, padding: "9px" }}>
              <strong style={{ fontSize: "0.76rem", textTransform: "uppercase" }}>Action</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.86rem" }}>Prioritize water response teams for ADM001 this week.</span>
            </p>
          </SeverityCallout>
          <SeverityCallout severity="medium" title="East District data is partial" meta={<Pill uppercase>data gap</Pill>}>
            <span style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
              Assessment coverage is partial; the ranking may understate shelter needs.
            </span>
          </SeverityCallout>
          <SeverityCallout severity="low" title="Join coverage is strong" meta={<Pill uppercase>coverage</Pill>}>
            <span style={{ color: "var(--muted)", fontSize: "0.86rem" }}>
              96% of assessment rows matched a population baseline row.
            </span>
          </SeverityCallout>
        </div>
      </Accordion>
      <SectionLabel title="Key Comparisons" />
      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <ChartCard title="Need severity by district" rationale="Severity scores rank where conditions are worst.">
          <BarChart items={DISTRICTS.map((row) => ({ label: row.district, value: row.severity })).sort((a, b) => b.value - a.value)} />
        </ChartCard>
        <ChartCard title="People assessed by district" rationale="Scale of assessed population per area.">
          <BarChart items={DISTRICTS.map((row) => ({ label: row.district, value: row.people })).sort((a, b) => b.value - a.value)} />
        </ChartCard>
      </div>
      <SectionLabel title="Data Quality and Coverage" />
      <ChartCard title="Missing values by column" rationale="Columns with gaps that may affect interpretation.">
        <BarChart color="var(--amber)" items={[
          { label: "response_gap_percent", value: 18 },
          { label: "notes", value: 9 },
        ]} />
      </ChartCard>
      <SectionLabel title="Detail Review" />
      <DataTable
        columns={["District", "Priority need", "Severity", "People assessed", "Response gap"]}
        rows={DISTRICTS.map((row) => [row.district, row.need, row.severity, row.people.toLocaleString(), `${row.gap}%`])}
      />
      <Button variant="accent" onClick={onExport} style={{ justifySelf: "start" }}>
        Export dashboard
      </Button>
    </section>
  );
}
