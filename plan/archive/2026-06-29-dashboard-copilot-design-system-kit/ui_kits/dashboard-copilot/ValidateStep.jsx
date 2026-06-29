import React from "react";
import { SectionHeading } from "../../components/surfaces/SectionHeading.jsx";
import { Accordion } from "../../components/surfaces/Accordion.jsx";
import { RecommendationCard } from "../../components/surfaces/RecommendationCard.jsx";
import { Button } from "../../components/actions/Button.jsx";
import { DataTable } from "../../components/data/DataTable.jsx";
import { ReadinessPanel } from "./ReadinessPanel.jsx";
import { DISTRICTS, mutedText, codeChip, stepStack } from "./KitData.jsx";

export function ValidateStep({ onProceed, working }) {
  return (
    <section style={stepStack}>
      <SectionHeading eyebrow="Step 5" title="Review Combined Dataset" />
      <ReadinessPanel />
      <RecommendationCard
        title="Proceed With Dashboard Generation"
        actions={
          <Button style={{ background: "white", borderColor: "white", color: "var(--ink)" }} disabled={working} onClick={onProceed}>
            {working ? "Generating..." : "Generate dashboard"}
          </Button>
        }
      >
        No blocking quality issues were found.
      </RecommendationCard>
      <DataTable
        columns={["district_name", "admin_pcode", "people_assessed", "priority_need", "need_severity_score", "response_gap_percent", "population_total"]}
        rows={DISTRICTS.map((row) => [
          row.district,
          row.pcode,
          row.people.toLocaleString(),
          row.need,
          row.severity,
          `${row.gap}%`,
          (row.people * 9).toLocaleString(),
        ])}
      />
      <Accordion summary="Transformation log" meta="3 recorded steps">
        <ul style={{ display: "grid", gap: "10px", listStyle: "none", margin: 0, padding: 0 }}>
          {[
            ["Joined datasets", <>Left join on <code style={codeChip}>admin_pcode</code>; 4 of 4 assessment rows matched.</>],
            ["Trimmed whitespace", <>2 values updated in <code style={codeChip}>district_name</code>.</>],
            ["Converted numeric strings", <>4 values parsed in <code style={codeChip}>response_gap_percent</code>.</>],
          ].map(([title, body]) => (
            <li key={title} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "10px" }}>
              <strong style={{ fontWeight: 760 }}>{title}</strong>
              <p style={{ ...mutedText, margin: "4px 0 0", fontSize: "0.86rem" }}>{body}</p>
            </li>
          ))}
        </ul>
      </Accordion>
    </section>
  );
}
