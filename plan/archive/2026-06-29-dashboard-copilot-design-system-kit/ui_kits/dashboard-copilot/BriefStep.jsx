import React, { useState } from "react";
import { SectionHeading } from "../../components/surfaces/SectionHeading.jsx";
import { Button } from "../../components/actions/Button.jsx";
import { Field } from "../../components/forms/Field.jsx";
import { TextAreaField } from "../../components/forms/TextAreaField.jsx";
import { SelectField } from "../../components/forms/SelectField.jsx";
import { CheckboxRow } from "../../components/forms/CheckboxRow.jsx";
import { Pill } from "../../components/feedback/Pill.jsx";
import { EVIDENCE, mutedText, stepStack } from "./KitData.jsx";

export function BriefStep({ onContinue }) {
  const [question, setQuestion] = useState(
    "Which districts should receive the first wave of response resources?"
  );
  const [action, setAction] = useState(
    "Allocate response teams and supplies to the highest-severity districts."
  );
  const [maker, setMaker] = useState("Provincial response coordinator");
  const [geo, setGeo] = useState("Affected province (4 districts)");
  const [time, setTime] = useState("Next 2 weeks");
  const [checked, setChecked] = useState(EVIDENCE.slice(0, 3));

  return (
    <section style={stepStack}>
      <SectionHeading eyebrow="Step 1" title="Select Decision Template" />
      <article
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          boxShadow: "var(--shadow)",
          display: "grid",
          gap: "18px",
          padding: "22px",
        }}
      >
        <div style={{ alignItems: "flex-start", display: "grid", gap: "16px", gridTemplateColumns: "minmax(220px, 280px) minmax(0, 1fr)" }}>
          <SelectField label="Template" value="rp" options={[{ value: "rp", label: "Response prioritization" }]} />
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 10px" }}>Response prioritization</h3>
            <p style={mutedText}>
              Decide which areas receive response resources first, using needs severity, population baselines, and service gaps.
            </p>
            <p style={{ ...mutedText, fontSize: "0.88rem", marginTop: "8px" }}>
              Defaults are ready to run. Adjust the brief only where your decision differs.
            </p>
          </div>
        </div>
        <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <TextAreaField label="Decision question" rows={3} value={question} onChange={setQuestion} style={{ gridColumn: "1 / -1" }} />
          <TextAreaField label="Intended action" rows={3} value={action} onChange={setAction} style={{ gridColumn: "1 / -1" }} />
          <Field label="Decision-maker" value={maker} onChange={setMaker} />
          <Field label="Geography scope" value={geo} onChange={setGeo} />
          <Field label="Timeframe" value={time} onChange={setTime} />
        </div>
        <fieldset style={{ border: "1px solid var(--line)", borderRadius: "8px", margin: 0, padding: "14px" }}>
          <legend style={{ color: "var(--muted)", fontSize: "0.86rem", fontWeight: 760, padding: "0 6px" }}>
            Required evidence
          </legend>
          <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            {EVIDENCE.map((item) => (
              <CheckboxRow
                key={item}
                label={item}
                checked={checked.includes(item)}
                onChange={(next) =>
                  setChecked(next ? [...checked, item] : checked.filter((value) => value !== item))
                }
              />
            ))}
          </div>
        </fieldset>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <Button variant="primary" onClick={onContinue}>Use template and continue</Button>
          <Pill tone="panel">{checked.length} of {EVIDENCE.length} evidence needs selected</Pill>
        </div>
      </article>
    </section>
  );
}
