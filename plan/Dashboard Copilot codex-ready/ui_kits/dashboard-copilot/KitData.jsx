// Shared mock data + tiny style helpers for the Dashboard Copilot UI kit
// (data mirrors public/samples/demo_*.csv in the source repo)
export const DISTRICTS = [
  { district: "Central District", pcode: "ADM002", people: 792, households: 186, need: "food", severity: 74, gap: 41, partner: "Relief Partner B", note: "Market prices rising" },
  { district: "North District", pcode: "ADM001", people: 642, households: 151, need: "water", severity: 78, gap: 46, partner: "Relief Partner A", note: "Road access limited" },
  { district: "South District", pcode: "ADM004", people: 510, households: 121, need: "health", severity: 67, gap: 38, partner: "Relief Partner A", note: "Mobile team requested" },
  { district: "East District", pcode: "ADM003", people: 388, households: 92, need: "shelter", severity: 61, gap: 33, partner: "Relief Partner C", note: "Assessment coverage partial" },
];

export const DATASETS = [
  {
    name: "demo_needs_assessment.csv",
    fileType: "CSV",
    rows: 5,
    columns: 14,
    duplicates: 0,
    summary: "Tabular CSV with a single header row. Column names are machine-readable.",
    joinFields: "Admin pcode, District name",
    metricFields: "People assessed, Need severity score, Response gap percent",
    groupFields: "District name, Priority need, Site type",
  },
  {
    name: "demo_population_baseline.csv",
    fileType: "CSV",
    rows: 4,
    columns: 6,
    duplicates: 0,
    summary: "Tabular CSV with a single header row. One row per administrative area.",
    joinFields: "Admin pcode",
    metricFields: "Population total, Households total",
    groupFields: "District name",
  },
];

export const EVIDENCE = [
  "Needs severity by area",
  "Population baseline by area",
  "Service capacity or response gaps",
  "Recent assessment date",
];

export const STEPS = ["Template", "Upload", "Profile", "Harmonize", "Dataset", "Dashboard", "Export"];

export const AI_OFF_WARNING =
  "AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard recommendations remain available.";

// Entrance animations freeze at their first frame in hidden documents
// (background tabs, capture iframes) — only animate when visible.
export const ANIMATE = typeof document !== "undefined" && document.visibilityState === "visible";

// style helpers
export const mutedText = { color: "var(--muted)", lineHeight: 1.52, margin: 0 };
export const codeChip = {
  background: "#f1f2ed",
  border: "1px solid var(--line)",
  borderRadius: "5px",
  color: "var(--ink)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.88em",
  padding: "1px 5px",
  whiteSpace: "nowrap",
};
export const stepStack = { display: "grid", gap: "28px", alignContent: "start", animation: ANIMATE ? "dcContentIn 260ms var(--ease)" : "none" };
