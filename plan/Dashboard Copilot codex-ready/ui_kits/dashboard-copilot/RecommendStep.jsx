import React, { useState } from "react";
import { SectionHeading } from "../../components/surfaces/SectionHeading.jsx";
import { Card } from "../../components/surfaces/Card.jsx";
import { Accordion } from "../../components/surfaces/Accordion.jsx";
import { RecommendationCard } from "../../components/surfaces/RecommendationCard.jsx";
import { Button } from "../../components/actions/Button.jsx";
import { SelectField } from "../../components/forms/SelectField.jsx";
import { mutedText, codeChip, stepStack, ANIMATE } from "./KitData.jsx";

export function RecommendStep({ onAccept }) {
  const [showAdjust, setShowAdjust] = useState(false);
  return (
    <section style={stepStack}>
      <SectionHeading eyebrow="Step 4" title="Review before combining files" />
      <RecommendationCard
        title="Combine files on shared district codes"
        why={
          <>
            Both files share <code style={{ ...codeChip, background: "rgba(0,0,0,0.1)", borderColor: "rgba(0,0,0,0.15)", color: "white" }}>admin_pcode</code> with
            a 96% estimated match rate. Joining adds population baselines to every assessment row.
          </>
        }
        actions={
          <>
            <Button style={{ background: "white", borderColor: "white", color: "var(--ink)" }} onClick={onAccept}>
              Accept recommendation
            </Button>
            <Button
              style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.22)", color: "white" }}
              onClick={() => setShowAdjust((value) => !value)}
            >
              Adjust join
            </Button>
          </>
        }
      >
        Use a left join from the needs assessment to the population baseline so no assessment rows are dropped.
      </RecommendationCard>
      {showAdjust && (
        <Card title="Join/combine adjustment" style={{ animation: ANIMATE ? "dcRevealIn 220ms var(--ease)" : "none" }}>
          <p style={{ ...mutedText, marginBottom: "12px" }}>Change the combine field or join type.</p>
          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <SelectField label="Source field" value="admin_pcode" options={["admin_pcode", "district_name"]} />
            <SelectField label="Target field" value="admin_pcode" options={["admin_pcode", "district_name"]} />
            <SelectField label="Join type" value="left" options={[{ value: "left", label: "Left join" }, { value: "inner", label: "Inner join" }, { value: "outer", label: "Outer join" }]} />
          </div>
          <div style={{ marginTop: "14px" }}>
            <Button variant="primary" onClick={onAccept}>Accept adjusted join</Button>
          </div>
        </Card>
      )}
      <Accordion summary="Review join/combine recommendation" meta="96% match rate">
        <p style={mutedText}>
          <strong style={{ color: "var(--ink)" }}>Join 1</strong>{" "}
          <code style={codeChip}>demo_needs_assessment.csv</code> to{" "}
          <code style={codeChip}>demo_population_baseline.csv</code> using{" "}
          <code style={codeChip}>admin_pcode</code> = <code style={codeChip}>admin_pcode</code>.
        </p>
        <p style={{ ...mutedText, marginTop: "8px" }}>
          Risk: one baseline row has no matching assessment; it will be kept with empty assessment fields.
        </p>
      </Accordion>
      <Card style={{ display: "grid", gap: "10px" }}>
        <div>
          <p style={{ color: "var(--accent)", fontSize: "0.75rem", fontWeight: 800, margin: "0 0 8px", textTransform: "uppercase" }}>Harmonization</p>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 720, lineHeight: 1.2, margin: 0 }}>Automated Data Cleaning</h2>
        </div>
        <p style={mutedText}>
          When the dataset is harmonized, safe normalization will also be checked. Only values that need
          changes are updated and recorded in the transformation log:
        </p>
        <ul style={{ display: "grid", gap: "9px", listStyle: "none", margin: 0, padding: 0 }}>
          {[
            ["Trim whitespace in text fields", <>Removes stray spaces in <code style={codeChip}>district_name</code> and <code style={codeChip}>priority_need</code>. Transform: trim whitespace.</>],
            ["Convert numeric strings", <>Parses <code style={codeChip}>response_gap_percent</code> values stored as text. Transform: to number.</>],
          ].map(([title, body]) => (
            <li key={title} style={{ borderBottom: "1px solid var(--line)", display: "grid", gap: "3px", paddingBottom: "9px" }}>
              <strong style={{ fontWeight: 760 }}>{title}</strong>
              <span style={{ color: "var(--muted)" }}>{body}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
