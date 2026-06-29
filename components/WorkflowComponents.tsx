"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import type {
  Dataset,
  ColumnProfile,
  ColumnTopValue,
  DatasetFormatAssessment,
  DatasetInputHints,
} from "@/types/dataset";
import type {
  DecisionBrief,
  AiGuardrailExplanation,
  DecisionPlaybook,
  DecisionReadinessResult,
  EvidenceCoverageSummary,
  SuggestedDataCollectionTemplate,
} from "@/types/decision";
import type { DecisionHandoffSummary } from "@/types/copilot";
import type { SampleDatasetKind } from "@/lib/fileParsers";
import { createFormDatasetFromTemplate } from "@/lib/formIntake";
import type {
  AIRecommendationResponse,
  CleaningRecommendation,
  DashboardRecommendation,
  JoinRecommendation,
  MetricAggregation,
} from "@/types/recommendations";
import type { QualityCheckResult } from "@/types/quality";
import type { RepairAction } from "@/types/repairAction";
import type { TransformationStep } from "@/types/transformations";
import {
  MAX_UPLOAD_SIZE_MB,
  SUPPORTED_FILE_TYPES,
  WORKFLOW_STEPS,
  canActivateWorkflowStep,
  type WorkflowStep,
} from "@/lib/config";
import {
  DEMO_GUIDED_FLOW_COPY,
  DEMO_SAMPLE_ONLY_COPY,
  DEMO_UPLOAD_TITLE,
  STEP_LABELS,
} from "@/lib/demoMessaging";
import type { ReadinessBlocker } from "@/lib/readinessGate";
import { runQualityChecks } from "@/lib/validation";
import {
  buildEvidenceCoverageSummary,
  buildDecisionMapDataGroups,
  buildDecisionPlaybook,
  buildEvidenceReadinessControlTower,
  buildSuggestedCollectionTemplateRows,
  buildSuggestedDataCollectionTemplate,
  createDecisionBriefFromTemplate,
  DECISION_TEMPLATES,
  evidenceCoverageStatusLabel,
  getUseCaseTemplate,
  readinessStatusLabel,
} from "@/lib/decisionContext";
import { downloadText, toCsv } from "@/lib/exportCsv";
import {
  aggregateField,
  aggregateRows,
  fieldDisplayLabel,
  inferMetricAggregation,
  metricDisplayLabel,
  sortGroupedMetricValues,
  toNumber,
  type GroupedMetricValue,
} from "@/lib/chartMetrics";
import { cleaningTransformLabel } from "@/lib/cleaningTransforms";
import { repairActionAutomationLabel } from "@/lib/repairActions";
import { isValidLatitude, isValidLongitude } from "@/lib/locationFields";
import { summarizeJoinMatch, type JoinMatchSummary } from "@/lib/joinSummary";
import { ChartFrame } from "@/components/charts/ChartFrame";

const CHART_PALETTE = [
  "var(--chart-primary)",
  "var(--chart-accent)",
  "var(--chart-success)",
  "var(--chart-compare)",
  "var(--chart-warning)",
  "var(--chart-neutral)",
];

const DIALOG_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function StepIndicator({
  currentStep,
  canNavigateTo,
  onNavigate,
}: {
  currentStep: WorkflowStep;
  canNavigateTo: (step: WorkflowStep) => boolean;
  onNavigate: (step: WorkflowStep) => void;
}) {
  const currentIndex = WORKFLOW_STEPS.indexOf(currentStep);
  return (
    <nav className="stepper" aria-label="Workflow steps">
      {WORKFLOW_STEPS.map((step, index) => {
        const stateClass =
          index < currentIndex
            ? "complete"
            : index === currentIndex
              ? "active"
              : "";
        const isCurrent = step === currentStep;
        const canNavigate = canActivateWorkflowStep({
          currentStep,
          targetStep: step,
          canNavigateTo,
        });
        const isUnavailable = !canNavigate && !isCurrent;
        return (
          <button
            type="button"
            className={["step", stateClass].filter(Boolean).join(" ")}
            key={step}
            aria-current={isCurrent ? "step" : undefined}
            aria-disabled={isCurrent ? true : undefined}
            disabled={isUnavailable}
            onClick={() => {
              if (canNavigate) onNavigate(step);
            }}
          >
            <span className="step-index">{index + 1}</span>
            <span className="step-label">{STEP_LABELS[step]}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function Notice({
  tone,
  items,
}: {
  tone: "error" | "warn";
  items: string[];
}) {
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

export function LoadingStatus() {
  return (
    <div className="loading-banner" role="status" aria-live="polite">
      <span className="loading-dot" aria-hidden="true" />
      <span>Working...</span>
    </div>
  );
}

export function DecisionBriefStep({
  aiAssistedAvailable,
  aiAssistedEnabled,
  brief,
  missingFields,
  onAiAssistedEnabledChange,
  onChange,
  onContinue,
  sampleOnly = false,
}: {
  aiAssistedAvailable: boolean;
  aiAssistedEnabled: boolean;
  brief: DecisionBrief;
  missingFields: string[];
  onAiAssistedEnabledChange: (enabled: boolean) => void;
  onChange: (brief: DecisionBrief) => void;
  onContinue: () => void;
  sampleOnly?: boolean;
}) {
  const updateField = <K extends keyof DecisionBrief>(field: K, value: DecisionBrief[K]) => {
    onChange({ ...brief, [field]: value });
  };
  const collectionTemplate = buildSuggestedDataCollectionTemplate(brief);
  const selectedTemplate = getUseCaseTemplate(brief.useCaseId);
  const selectedPlaybook = buildDecisionPlaybook(brief.useCaseId);
  const templateDefaults = createDecisionBriefFromTemplate(brief.useCaseId);
  const hasCustomBriefContext = isBriefCustomizedFromTemplate(brief, templateDefaults);
  const [isDecisionMapOpen, setIsDecisionMapOpen] = useState(false);
  const decisionMapTriggerRef = useRef<HTMLButtonElement>(null);
  const decisionMapTitleId = useId();
  const decisionMapDescriptionId = useId();
  const closeDecisionMap = () => {
    setIsDecisionMapOpen(false);
    decisionMapTriggerRef.current?.focus();
  };
  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Step 1</p>
        <h2>Select Decision Template</h2>
      </div>
      <article className="decision-brief-panel">
        <div className="template-selector">
          <label>
            Template
            <select
              value={brief.useCaseId}
              onChange={(event) =>
                onChange(createDecisionBriefFromTemplate(event.target.value as DecisionBrief["useCaseId"]))
              }
            >
              {DECISION_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          </label>
          <div className="template-summary">
            <h3>{selectedTemplate.title}</h3>
            <p>{selectedTemplate.description}</p>
            <p className="helper-text">
              {sampleOnly
                ? DEMO_GUIDED_FLOW_COPY
                : "Defaults are ready to run in deterministic mode. If you change the decision context, turn on AI-assisted workflow so the model can use your edited question, action, and evidence needs."}
            </p>
            <button
              ref={decisionMapTriggerRef}
              type="button"
              className="decision-map-trigger"
              onClick={() => setIsDecisionMapOpen(true)}
            >
              View decision map
            </button>
          </div>
        </div>
        <div className={`ai-context-notice${hasCustomBriefContext ? " custom" : ""}`}>
          <div>
            <strong>
              {hasCustomBriefContext
                ? "Custom decision context detected"
                : "Template defaults selected"}
            </strong>
            <p>
              {sampleOnly
                ? "This public demo runs as a guided flow without AI. Sign in for quota-governed AI assistance."
                : hasCustomBriefContext
                  ? aiAssistedEnabled && aiAssistedAvailable
                    ? "AI-assisted workflow is on. Your edited brief will be sent as minimized decision context with the profile metadata."
                    : "Deterministic mode will continue with template rules, but it will not reinterpret your custom brief. Turn on AI-assisted workflow before harmonizing or generating dashboards."
                  : "Use the template as-is for the deterministic guided flow, or edit it and turn on AI-assisted workflow for context-aware recommendations."}
            </p>
          </div>
          {!sampleOnly ? (
            <label className="llm-toggle ai-context-toggle">
              <input
                type="checkbox"
                checked={aiAssistedEnabled}
                disabled={!aiAssistedAvailable}
                onChange={(event) => onAiAssistedEnabledChange(event.target.checked)}
              />
              <span className="llm-toggle-copy">
                <span>AI-assisted workflow</span>
                <strong>
                  {aiAssistedAvailable
                    ? aiAssistedEnabled
                      ? "On"
                      : "Off"
                    : "Unavailable"}
                </strong>
              </span>
              <span className="llm-toggle-track" aria-hidden="true">
                <span className="llm-toggle-thumb" />
              </span>
            </label>
          ) : null}
        </div>
        {sampleOnly ? (
          <DemoAdvancedCaveats playbook={selectedPlaybook} />
        ) : (
          <DecisionPlaybookPanel playbook={selectedPlaybook} />
        )}
        <div className="brief-form-grid">
          <label>
            Decision question
            <textarea
              value={brief.decisionQuestion}
              onChange={(event) => updateField("decisionQuestion", event.target.value)}
              rows={3}
            />
          </label>
          <label>
            Intended action
            <textarea
              value={brief.intendedAction}
              onChange={(event) => updateField("intendedAction", event.target.value)}
              rows={3}
            />
          </label>
          <label>
            Decision-maker
            <input
              value={brief.decisionMaker}
              onChange={(event) => updateField("decisionMaker", event.target.value)}
            />
          </label>
          <label>
            Geography scope
            <input
              value={brief.geographyScope}
              onChange={(event) => updateField("geographyScope", event.target.value)}
            />
          </label>
          <label>
            Timeframe
            <input
              value={brief.timeframe}
              onChange={(event) => updateField("timeframe", event.target.value)}
            />
          </label>
        </div>
        <fieldset className="evidence-fieldset">
          <legend>Decision signals</legend>
          <div className="evidence-choice-grid">
            {selectedTemplate.requiredEvidence.map((item) => (
              <label key={item} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={brief.requiredEvidence.includes(item)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...brief.requiredEvidence, item]
                      : brief.requiredEvidence.filter((value) => value !== item);
                    updateField("requiredEvidence", Array.from(new Set(next)));
                  }}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <SuggestedCollectionTemplatePreview template={collectionTemplate} />
        {missingFields.length > 0 ? (
          <div className="quality medium">
            <strong>Review brief before loading data</strong>
            <p>Missing: {missingFields.join(", ")}.</p>
          </div>
        ) : null}
        <div className="action-row">
          <button
            className="primary-button"
            disabled={missingFields.length > 0}
            onClick={onContinue}
          >
            {sampleOnly
              ? "Run the 3-minute sample walkthrough"
              : "Use template and continue"}
          </button>
        </div>
        {isDecisionMapOpen ? (
          <DecisionMapDialog
            brief={brief}
            descriptionId={decisionMapDescriptionId}
            template={collectionTemplate}
            titleId={decisionMapTitleId}
            onClose={closeDecisionMap}
          />
        ) : null}
      </article>
    </section>
  );
}

function isBriefCustomizedFromTemplate(
  brief: DecisionBrief,
  templateDefaults: DecisionBrief,
) {
  return (
    brief.decisionQuestion !== templateDefaults.decisionQuestion ||
    brief.intendedAction !== templateDefaults.intendedAction ||
    brief.decisionMaker !== templateDefaults.decisionMaker ||
    brief.geographyScope !== templateDefaults.geographyScope ||
    brief.timeframe !== templateDefaults.timeframe ||
    normalizedEvidence(brief.requiredEvidence) !==
      normalizedEvidence(templateDefaults.requiredEvidence)
  );
}

function normalizedEvidence(values: string[]) {
  return [...values].sort().join("|");
}

function DecisionPlaybookPanel({ playbook }: { playbook: DecisionPlaybook }) {
  return (
    <section className="decision-playbook-panel" aria-labelledby="decision-playbook-title">
      <div className="decision-playbook-header">
        <div>
          <p className="eyebrow">Decision playbook</p>
          <h3 id="decision-playbook-title">{playbook.title}</h3>
          <p>{playbook.sampleScenario}</p>
        </div>
        <div className="playbook-required-evidence">
          <span>Required evidence</span>
          <strong>{playbook.requiredEvidence.length}</strong>
        </div>
      </div>
      <div className="decision-playbook-grid">
        <div>
          <h4>Known caveats</h4>
          <ul className="compact-list">
            {playbook.knownCaveats.slice(0, 3).map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Source freshness</h4>
          <ul className="compact-list">
            {playbook.sourceFreshnessExpectations.slice(0, 3).map((expectation) => (
              <li key={expectation}>{expectation}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Next collection asks</h4>
          <ul className="compact-list">
            {playbook.nextCollectionAsks.slice(0, 3).map((ask) => (
              <li key={ask}>{ask}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="playbook-handoff-language">{playbook.handoffLanguage}</p>
    </section>
  );
}

function DemoAdvancedCaveats({ playbook }: { playbook: DecisionPlaybook }) {
  return (
    <details className="demo-advanced-caveats">
      <summary>Advanced caveats</summary>
      <div className="accordion-content">
        <h3>{playbook.title}</h3>
        <ul className="compact-list">
          {[
            ...playbook.knownCaveats.slice(0, 3),
            ...playbook.sourceFreshnessExpectations.slice(0, 2),
          ].map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function DecisionMapDialog({
  brief,
  descriptionId,
  template,
  titleId,
  onClose,
}: {
  brief: DecisionBrief;
  descriptionId: string;
  template: SuggestedDataCollectionTemplate;
  titleId: string;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const dataGroups = buildDecisionMapDataGroups(brief, template);
  const sourceConfigFields = template.fields.filter((field) =>
    ["Source quality", "Review context"].includes(field.evidenceNeed)
  );
  const sourceConfigNotes = [
    {
      label: "Source",
      value: sourceConfigFields.find((field) => field.evidenceNeed === "Source quality")?.description ??
        "Record the agency, assessment, or system behind each observation.",
    },
    {
      label: "Unit / scale",
      value: "Capture the unit or scoring scale for each decision signal.",
    },
    {
      label: "Date coverage",
      value: `Align observations to ${brief.timeframe.toLowerCase() || "the selected timeframe"}.`,
    },
    {
      label: "Join key",
      value: "Use a stable P-code / COD admin code across uploaded files.",
    },
    {
      label: "Row meaning",
      value: `Keep one row tied to one ${brief.geographyScope.toLowerCase() || "area"} observation.`,
    },
    {
      label: "Caveats",
      value: sourceConfigFields.find((field) => field.evidenceNeed === "Review context")?.description ??
        "Keep known gaps, bias, and assumptions factual.",
    },
  ];

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR),
      ).filter((element) => element.tabIndex >= 0);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      if (!dialog.contains(activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKeyDown);
    return () => document.removeEventListener("keydown", handleDialogKeyDown);
  }, [onClose]);

  return (
    <div
      className="decision-map-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="decision-map-dialog"
        role="dialog"
      >
        <div className="decision-map-dialog-header">
          <div>
            <p className="eyebrow">Decision map</p>
            <h3 id={titleId}>{brief.decisionQuestion || "Selected decision"} chain</h3>
            <p id={descriptionId}>
              Read-only view of the selected template, current action, required signals, data fields, and metadata checks.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="decision-map-close"
            aria-label="Close decision map"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="decision-map-chain" aria-label="Decision chain">
          <DecisionMapNode label="Decision question" value={brief.decisionQuestion || "Decision question needed"} />
          <DecisionMapConnector />
          <DecisionMapNode label="User action" value={brief.intendedAction || "Intended action needed"} />
          <DecisionMapConnector />
          <section className="decision-map-node decision-map-node-wide">
            <span>Decision signals</span>
            <div className="decision-map-signal-list">
              {brief.requiredEvidence.length > 0 ? (
                brief.requiredEvidence.map((signal) => (
                  <strong key={signal}>{signal}</strong>
                ))
              ) : (
                <strong>Decision signals needed</strong>
              )}
            </div>
          </section>
          <DecisionMapConnector />
          <section className="decision-map-node decision-map-node-wide">
            <span>Data required</span>
            <div className="decision-map-data-grid">
              {dataGroups.map((group) => (
                <article className="decision-map-data-group" key={group.evidenceNeed}>
                  <h4>{group.evidenceNeed}</h4>
                  <ul>
                    {group.fields.map((field) => (
                      <li key={field.name}>
                        <code>{field.name}</code>
                        <span>
                          {field.label} - {field.type}
                          {field.required ? " - required" : " - optional"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
          <DecisionMapConnector />
          <section className="decision-map-node decision-map-node-wide">
            <span>Source/config notes</span>
            <div className="decision-map-note-grid">
              {sourceConfigNotes.map((note) => (
                <article key={note.label}>
                  <strong>{note.label}</strong>
                  <p>{note.value}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function DecisionMapNode({ label, value }: { label: string; value: string }) {
  return (
    <section className="decision-map-node">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

function DecisionMapConnector() {
  return <div className="decision-map-connector" aria-hidden="true" />;
}

function SuggestedCollectionTemplatePreview({
  template,
}: {
  template: SuggestedDataCollectionTemplate;
}) {
  const requiredCount = template.fields.filter((field) => field.required).length;
  const downloadTemplate = () => {
    downloadText(
      "response-prioritization-collection-template.csv",
      toCsv(buildSuggestedCollectionTemplateRows(template)),
      "text/csv;charset=utf-8",
    );
  };
  return (
    <section className="collection-template-section">
      <div className="collection-template-heading">
        <div>
          <p className="eyebrow">Suggested data collection template</p>
          <h3>{template.title}</h3>
        </div>
        <div className="collection-template-actions">
          <span className="template-count">{requiredCount} required</span>
          <button type="button" onClick={downloadTemplate}>
            Download CSV template
          </button>
        </div>
      </div>
      <div className="collection-template-meta">
        <span>{template.geographyScope}</span>
        <span>{template.timeframe}</span>
        <span>{template.decisionMaker}</span>
      </div>
      <div className="collection-table-wrapper">
        <table className="collection-template-table">
          <caption>Suggested data collection fields for this decision template</caption>
          <thead>
            <tr>
              <th>Field</th>
              <th>Evidence</th>
              <th>Type</th>
              <th>Status</th>
              <th>Example</th>
              <th>Caveat</th>
            </tr>
          </thead>
          <tbody>
            {template.fields.map((field) => (
              <tr key={field.name}>
                <td>
                  <strong>{field.name}</strong>
                  <span>{field.label}</span>
                </td>
                <td>{field.evidenceNeed}</td>
                <td>{field.type}</td>
                <td>
                  <span className={field.required ? "field-pill required" : "field-pill"}>
                    {field.required ? "Required" : "Optional"}
                  </span>
                </td>
                <td>{field.example}</td>
                <td>{field.caveat ?? field.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function UploadStep({
  datasets,
  decisionBrief,
  onProfile,
  onFiles,
  onSamples,
  onRemoveDataset,
  onUpdateDatasetInputHints,
  onCreateFormDataset,
  sampleOnly = false,
}: {
  datasets: Dataset[];
  decisionBrief: DecisionBrief;
  onProfile: () => void;
  onFiles?: (files: FileList | null) => void;
  onSamples: (kind: SampleDatasetKind) => void;
  onRemoveDataset: (datasetId: string) => void;
  onUpdateDatasetInputHints: (datasetId: string, inputHints: DatasetInputHints) => void;
  onCreateFormDataset: (dataset: Dataset) => void;
  sampleOnly?: boolean;
}) {
  const uploadTitle = sampleOnly ? DEMO_UPLOAD_TITLE : "Upload Data";
  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Step 2</p>
        <h2>{uploadTitle}</h2>
      </div>
      {!sampleOnly ? (
        <div className="sensitive-data-note" role="note">
          <strong>Carefully consider data sources</strong>
          <p>
            Do not upload sensitive personal, medical, financial, or restricted
            data. When AI recommendations are <em>on</em>, dataset details and
            semantic comments may be sent to the configured LLM provider with
            minimized sample values.
          </p>
        </div>
      ) : null}
      {!sampleOnly ? (
        <FormIntakeReviewPanel
          decisionBrief={decisionBrief}
          onCreateFormDataset={onCreateFormDataset}
        />
      ) : null}
      {datasets.length === 0 ? (
        <div className="empty-state upload-empty">
          <h3>{sampleOnly ? DEMO_SAMPLE_ONLY_COPY : "Add data to begin"}</h3>
          <p>
            {sampleOnly
              ? DEMO_GUIDED_FLOW_COPY
              : `${SUPPORTED_FILE_TYPES.map((type) => type.toUpperCase()).join(
                  " or ",
                )} files, up to ${MAX_UPLOAD_SIZE_MB}MB each.`}
          </p>
          <div className="action-row">
            {!sampleOnly && (
              <label className="primary-action compact">
                Upload files
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx"
                  onChange={(event) => onFiles?.(event.target.files)}
                />
              </label>
            )}
            <button onClick={() => onSamples("multi")}>Use sample data</button>
            <button onClick={() => onSamples("fragmented")}>
              Use fragmented demo data
              <span>needs + population + capacity</span>
            </button>
            <button onClick={() => onSamples("quality-risk")}>
              Use risky quality sample
              <span>invalid values and missing evidence</span>
            </button>
            <button onClick={() => onSamples("service-gap")}>
              Use service gap sample
              <span>availability + gap + capacity</span>
            </button>
            <button onClick={() => onSamples("preparedness-risk")}>
              Use preparedness sample
              <span>hazard + vulnerability + capacity</span>
            </button>
          </div>
          {sampleOnly && (
            <p className="helper-text">
              Sign in for private uploads and AI-assisted workflow.
            </p>
          )}
        </div>
      ) : (
        <>
          {sampleOnly ? (
            <div className="sample-only-note" role="note">
              <strong>{DEMO_SAMPLE_ONLY_COPY}</strong>
              <span>{DEMO_GUIDED_FLOW_COPY}</span>
            </div>
          ) : null}
          <div className="action-row toolbar-row">
            {!sampleOnly && (
              <label className="primary-action compact">
                Upload files
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx"
                  onChange={(event) => onFiles?.(event.target.files)}
                />
              </label>
            )}
            <button onClick={() => onSamples("multi")}>
              Replace with sample data
            </button>
            <button onClick={() => onSamples("fragmented")}>
              Use fragmented demo data
            </button>
            <button onClick={() => onSamples("quality-risk")}>
              Use risky quality sample
            </button>
            <button onClick={() => onSamples("service-gap")}>
              Use service gap sample
            </button>
            <button onClick={() => onSamples("preparedness-risk")}>
              Use preparedness sample
            </button>
          </div>
          <AgentContextChecklist />
          <div className="dataset-grid">
            {datasets.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                evidenceOptions={decisionBrief.requiredEvidence}
                onRemove={() => onRemoveDataset(dataset.id)}
                onUpdateInputHints={(inputHints) =>
                  onUpdateDatasetInputHints(dataset.id, inputHints)
                }
              />
            ))}
          </div>
          <button className="primary-button next-action" onClick={onProfile}>
            Profile data
          </button>
        </>
      )}
    </section>
  );
}

function FormIntakeReviewPanel({
  decisionBrief,
  onCreateFormDataset,
}: {
  decisionBrief: DecisionBrief;
  onCreateFormDataset: (dataset: Dataset) => void;
}) {
  const template = buildSuggestedDataCollectionTemplate(decisionBrief);
  const previewDataset = createFormDatasetFromTemplate(template, {
    filename: `${decisionBrief.useCaseId}-reviewed-form-schema.csv`,
  });
  const metadata = previewDataset.inputHints?.formMetadata;
  const mappings = metadata?.evidenceMappings ?? [];

  function addSchemaDataset() {
    onCreateFormDataset(
      createFormDatasetFromTemplate(template, {
        datasetId: crypto.randomUUID(),
        filename: `${decisionBrief.useCaseId}-reviewed-form-schema.csv`,
        uploadedAt: new Date().toISOString(),
      }),
    );
  }

  return (
    <section className="form-intake-panel" aria-labelledby="form-intake-title">
      <div className="form-intake-panel__header">
        <div>
          <p className="eyebrow">Form-aware intake</p>
          <h3 id="form-intake-title">Review playbook form schema</h3>
          <p>
            Add a metadata-only form schema from this playbook, or upload HXL
            and 3W/5W-style exports for deterministic recognition.
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={addSchemaDataset}>
          Add schema dataset
        </button>
      </div>
      <div className="form-intake-summary">
        <div>
          <span>Detected family</span>
          <strong>{metadata?.family.replaceAll("_", " ") ?? "Not detected"}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{metadata?.detection.status.replaceAll("_", " ") ?? "Review needed"}</strong>
        </div>
        <div>
          <span>Mappings</span>
          <strong>{mappings.length}</strong>
        </div>
        <div>
          <span>Privacy</span>
          <strong>{metadata?.privacyAudit.metadataOnly ? "Metadata only" : "Review"}</strong>
        </div>
      </div>
      <div className="form-intake-mapping-list">
        {mappings.slice(0, 6).map((mapping) => (
          <span key={mapping.evidenceNeed}>
            {mapping.evidenceNeed}: {mapping.fieldNames.join(", ")}
          </span>
        ))}
      </div>
    </section>
  );
}

export function ProfileStep({
  datasets,
  decisionBrief,
  isWorking = false,
  onRecommend,
}: {
  datasets: Dataset[];
  decisionBrief?: DecisionBrief;
  isWorking?: boolean;
  onRecommend: () => void;
}) {
  const quality = buildProfileQualityResults(datasets, decisionBrief);
  const evidenceCoverage = decisionBrief
    ? buildEvidenceCoverageSummary(datasets, decisionBrief)
    : undefined;
  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Step 3</p>
        <h2>Review Data Profiling</h2>
      </div>
      <div className="dataset-grid">
        {datasets.map((dataset) => (
          <ProfileCard key={dataset.id} dataset={dataset} />
        ))}
      </div>
      <EvidenceCoveragePanel summary={evidenceCoverage} />
      <QualityPanel quality={quality} />
      <MetadataPanel datasets={datasets} />
      <button
        className="primary-button next-action"
        disabled={isWorking}
        onClick={onRecommend}
      >
        {isWorking ? "Checking review path..." : "Harmonize data"}
      </button>
    </section>
  );
}

function EvidenceCoveragePanel({
  summary,
}: {
  summary?: EvidenceCoverageSummary;
}) {
  if (!summary) return null;
  return (
    <section
      className="evidence-coverage-panel"
      aria-labelledby="evidence-coverage-heading"
      role="status"
      aria-live="polite"
    >
      <div className="evidence-coverage-header">
        <div>
          <p className="eyebrow">Evidence coverage</p>
          <h3 id="evidence-coverage-heading">Evidence coverage</h3>
          <p>
            This checks whether your uploaded files contain the evidence needed
            for the selected decision.
          </p>
        </div>
        <div className="coverage-summary-chips" aria-label="Evidence coverage summary">
          <span>{summary.coveredCount} covered</span>
          <span>{summary.ambiguousCount} need review</span>
          <span>{summary.missingCount} missing</span>
        </div>
      </div>
      <div className="coverage-item-list">
        {summary.items.map((item) => (
          <article className={`coverage-item ${item.status}`} key={item.evidenceNeed}>
            <div className="coverage-item-heading">
              <h4>{item.evidenceNeed}</h4>
              <span>{evidenceCoverageStatusLabel(item.status)}</span>
            </div>
            {item.candidates.length > 0 ? (
              <ul className="coverage-candidates">
                {item.candidates.map((candidate) => (
                  <li key={`${candidate.datasetId}-${candidate.columnName}`}>
                    <span>
                      <strong>{candidate.datasetName}</strong>{" "}
                      <code className="inline-code">{candidate.columnName}</code>
                    </span>
                    <span>
                      {candidate.missingPercentage}% missing,{" "}
                      {Math.round(candidate.confidence * 100)}% field-match confidence
                    </span>
                    <span>{candidate.rationale}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="coverage-empty">No matching field was detected.</p>
            )}
            <p className="coverage-caveat">{item.caveat}</p>
            <p className="coverage-next-action">
              <strong>Easiest safe fix</strong>
              <span>{item.nextAction}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileCard({ dataset }: { dataset: Dataset }) {
  const profile = dataset.profile;
  return (
    <article className="card profile-card">
      <div>
        <p className="eyebrow">{dataset.fileType.toUpperCase()}</p>
        <h3>{dataset.name}</h3>
      </div>
      <div className="profile-summary">
        <span>{profile?.rowCount ?? dataset.rowCount ?? 0} rows</span>
        <span>{profile?.columnCount ?? dataset.columnCount ?? 0} columns</span>
        <span>{profile?.duplicateRowCount ?? 0} duplicates</span>
      </div>
      <details>
        <summary>Candidate fields</summary>
        <ul className="labeled-list profile-recommendations">
          <li>
            <strong>Candidate join fields</strong>
            <span>{formatFieldList(profile?.potentialJoinFields)}. Review before use.</span>
          </li>
          <li>
            <strong>Candidate metrics</strong>
            <span>{formatFieldList(profile?.potentialMetricFields)}. Review before use.</span>
          </li>
          <li>
            <strong>Candidate groupings</strong>
            <span>
              {formatFieldList([
                ...(profile?.potentialGeographicFields ?? []),
                ...(profile?.potentialDemographicFields ?? []),
              ])}. Review before use.
            </span>
          </li>
        </ul>
      </details>
      <details>
        <summary>Column details and samples</summary>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Missing</th>
                <th>Unique</th>
                <th>Stats</th>
                <th>Samples</th>
              </tr>
            </thead>
            <tbody>
              {profile?.columns.map((column) => (
                <tr key={column.columnName}>
                  <td>
                    <span className="field-name-cell">
                      <strong>{fieldDisplayLabel(column.columnName)}</strong>
                      <code>{column.columnName}</code>
                    </span>
                  </td>
                  <td>{column.inferredType}</td>
                  <td>{column.missingPercentage}%</td>
                  <td>{column.uniqueCount}</td>
                  <td>{columnStatsSummary(column)}</td>
                  <td>{column.sampleValues.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DatasetPreview dataset={dataset} title="Profile sample data" />
      </details>
    </article>
  );
}

function formatFieldList(fields?: string[]) {
  return fields?.length
    ? fields.map((field) => fieldDisplayLabel(field)).join(", ")
    : "none detected";
}

function columnStatsSummary(column: ColumnProfile) {
  const stats = column.descriptiveStats;
  if (!stats || stats.nonMissingCount === 0) return "No values";
  if (stats.numeric) {
    const { min, max, mean, median } = stats.numeric;
    return `Range ${formatNumber(min)}-${formatNumber(max)}; median ${formatNumber(median)}; mean ${formatNumber(mean)}`;
  }
  if (stats.date) {
    const invalid = stats.date.invalidCount > 0
      ? `; ${formatCount(stats.date.invalidCount, "invalid value")}`
      : "";
    return `${stats.date.earliest} to ${stats.date.latest}${invalid}`;
  }
  return `Top: ${formatTopValues(stats.topValues)}`;
}

function formatTopValues(values: ColumnTopValue[]) {
  return values.length > 0
    ? values
        .slice(0, 3)
        .map((item) => `${truncateText(item.value, 28)} (${formatCount(item.count, "row")}, ${formatPercentage(item.percentage)})`)
        .join("; ")
    : "none";
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function AgentContextChecklist() {
  return (
    <section className="agent-context-checklist" aria-labelledby="agent-context-heading">
      <div>
        <h3 id="agent-context-heading">Help the review system read the upload correctly</h3>
        <p>
          Map each file to the evidence it supports, then add the row meaning,
          unit, source, date coverage, and known caveats. Keep notes factual;
          uploaded notes are review context, not instructions.
        </p>
      </div>
      <ul>
        <li>What one row represents</li>
        <li>Which field joins files</li>
        <li>Which field sets time</li>
        <li>Units or score scale</li>
        <li>Known gaps or bias</li>
      </ul>
    </section>
  );
}

function DatasetCard({
  dataset,
  evidenceOptions,
  onRemove,
  onUpdateInputHints,
}: {
  dataset: Dataset;
  evidenceOptions: string[];
  onRemove: () => void;
  onUpdateInputHints: (inputHints: DatasetInputHints) => void;
}) {
  const columns = dataset.columns ?? [];
  const inputHints = dataset.inputHints ?? {};
  const updateHint = <K extends keyof DatasetInputHints>(field: K, value: DatasetInputHints[K]) => {
    onUpdateInputHints({
      ...inputHints,
      [field]: typeof value === "string" && value.trim() === "" ? undefined : value,
    });
  };

  return (
    <article className="card dataset-card">
      <div className="dataset-card-header">
        <div>
          <p className="eyebrow">
            {dataset.sourceType} {dataset.fileType.toUpperCase()}
          </p>
          <h3>{dataset.name}</h3>
        </div>
        <button
          type="button"
          className="remove-dataset-button"
          onClick={onRemove}
          aria-label={`Remove ${dataset.name}`}
        >
          Remove
        </button>
      </div>
      <p>
        {dataset.rowCount ?? 0} rows, {dataset.columnCount ?? 0} columns
      </p>
      <FormatAssessmentPanel assessment={dataset.formatAssessment} />
      <FormMetadataPanel dataset={dataset} />
      <DatasetPreview dataset={dataset} title="Parsed data preview" defaultOpen />
      <div className="dataset-hints-grid">
        <label>
          Suggested required data
          <select
            value={inputHints.evidenceRole ?? ""}
            onChange={(event) => updateHint("evidenceRole", event.target.value)}
          >
            <option value="">Not mapped yet</option>
            {evidenceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value="Supporting context">Supporting context</option>
          </select>
        </label>
        <label>
          Join or ID field
          <select
            value={inputHints.joinField ?? ""}
            onChange={(event) => updateHint("joinField", event.target.value)}
          >
            <option value="">Not selected</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
        <label>
          Main field
          <select
            value={inputHints.primaryField ?? ""}
            onChange={(event) => updateHint("primaryField", event.target.value)}
          >
            <option value="">Not selected</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date or period field
          <select
            value={inputHints.timeField ?? ""}
            onChange={(event) => updateHint("timeField", event.target.value)}
          >
            <option value="">Not selected</option>
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
        </label>
        <label>
          Unit or scale
          <input
            value={inputHints.measurementUnit ?? ""}
            onChange={(event) => updateHint("measurementUnit", event.target.value)}
            placeholder="people, households, 0-100 score"
          />
        </label>
        <label className="dataset-note-field">
          Upload context for reviewers
          <textarea
            value={inputHints.semanticNotes ?? ""}
            onChange={(event) => updateHint("semanticNotes", event.target.value)}
            rows={3}
            placeholder="Rows are districts; severity_score is 0-100; data came from rapid assessment round 2."
          />
        </label>
      </div>
    </article>
  );
}

function FormatAssessmentPanel({
  assessment,
}: {
  assessment?: DatasetFormatAssessment;
}) {
  if (!assessment) return null;
  const visibleIssues = assessment.issues.slice(0, 4);
  const tips = assessment.learningTips.slice(0, 3);
  return (
    <div className={`format-assessment ${assessment.status}`}>
      <div className="format-assessment-header">
        <strong>{assessment.fileType.toUpperCase()} format check</strong>
        <span>{formatAssessmentStatusLabel(assessment.status)}</span>
      </div>
      <p>{assessment.summary}</p>
      {assessment.sheetName || assessment.sheetCount ? (
        <p className="format-meta">
          {assessment.sheetName ? `Sheet: ${assessment.sheetName}` : "Sheet not named"}
          {assessment.sheetCount ? ` - ${assessment.sheetCount} sheet${assessment.sheetCount === 1 ? "" : "s"}` : ""}
        </p>
      ) : null}
      {visibleIssues.length > 0 ? (
        <ul>
          {visibleIssues.map((issue) => (
            <li key={`${issue.title}-${issue.detail}`}>
              <strong>{issue.title}</strong>
              <span>{issue.suggestedAction ?? issue.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {tips.length > 0 ? (
        <div className="format-tips">
          <strong>Good Excel habit</strong>
          <span>{tips.join(" ")}</span>
        </div>
      ) : null}
    </div>
  );
}

function formatAssessmentStatusLabel(status: DatasetFormatAssessment["status"]) {
  return {
    accepted: "Ready for review",
    review: "Needs review",
    rejected: "Rejected",
  }[status];
}

function FormMetadataPanel({ dataset }: { dataset: Dataset }) {
  const metadata = dataset.inputHints?.formMetadata;
  if (!metadata) return null;
  return (
    <div className={`form-metadata-panel ${metadata.detection.status}`}>
      <div className="form-metadata-header">
        <strong>{metadata.family.replaceAll("_", " ")} form metadata</strong>
        <span>
          {metadata.detection.status.replaceAll("_", " ")} ·{" "}
          {Math.round(metadata.detection.confidence * 100)}% confidence
        </span>
      </div>
      <p>
        {metadata.schemaSummary.fieldCount} fields,{" "}
        {metadata.schemaSummary.requiredFieldCount} required,{" "}
        {metadata.evidenceMappings.length} evidence mappings.{" "}
        {metadata.privacyAudit.metadataOnly
          ? "Form metadata excludes raw row values."
          : "Review privacy audit before continuing."}
      </p>
      {metadata.evidenceMappings.length > 0 ? (
        <div className="form-mapping-chips">
          {metadata.evidenceMappings.slice(0, 6).map((mapping) => (
            <span key={`${dataset.id}-${mapping.evidenceNeed}`}>
              {mapping.evidenceNeed}: {mapping.status.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      ) : null}
      {metadata.caveats.length > 0 ? (
        <ul>
          {metadata.caveats.slice(0, 3).map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function RecommendationStep({
  aiGuardrail,
  recommendations,
  joins = [],
  datasets,
  cleaningRecommendations,
  onAccept,
}: {
  aiGuardrail: AiGuardrailExplanation;
  recommendations: AIRecommendationResponse;
  joins?: JoinRecommendation[];
  datasets: Dataset[];
  cleaningRecommendations: CleaningRecommendation[];
  onAccept: (joins?: JoinRecommendation[]) => void;
}) {
  const [showAdjust, setShowAdjust] = useState(false);
  const join = joins.length === 1 ? joins[0] : undefined;
  const hasJoinPlan = joins.length > 0;
  const source = datasets.find(
    (dataset) => dataset.id === join?.sourceDatasetId,
  );
  const target = datasets.find(
    (dataset) => dataset.id === join?.targetDatasetId,
  );
  const [joinType, setJoinType] = useState<JoinRecommendation["joinType"]>(
    join?.joinType ?? "left",
  );
  const [sourceColumn, setSourceColumn] = useState(
    join?.sourceColumns[0] ?? "",
  );
  const [targetColumn, setTargetColumn] = useState(
    join?.targetColumns[0] ?? "",
  );
  const joinSummaryWarningId = useId();
  useEffect(() => {
    setShowAdjust(false);
    setJoinType(join?.joinType ?? "left");
    setSourceColumn(join?.sourceColumns[0] ?? "");
    setTargetColumn(join?.targetColumns[0] ?? "");
  }, [
    join?.id,
    join?.sourceDatasetId,
    join?.targetDatasetId,
    join?.joinType,
    join?.sourceColumns[0],
    join?.targetColumns[0],
  ]);
  const adjustedJoin = join
    ? {
        ...join,
        id: `${join.id}-adjusted`,
        sourceColumns: [sourceColumn || join.sourceColumns[0]],
        targetColumns: [targetColumn || join.targetColumns[0]],
        joinType,
        confidenceScore: Math.max(0.35, join.confidenceScore - 0.08),
        rationale: `User adjusted the recommendation to use ${sourceColumn || join.sourceColumns[0]} = ${targetColumn || join.targetColumns[0]} with a ${joinType} join.`,
      }
    : undefined;
  const recommendedJoinSummaries = joins.flatMap((item, index) => {
    const itemSource = datasets.find((dataset) => dataset.id === item.sourceDatasetId);
    const itemTarget = datasets.find((dataset) => dataset.id === item.targetDatasetId);
    if (!itemSource?.data || !itemTarget?.data) return [];
    return [{
      id: item.id,
      label: joins.length > 1 ? `Join ${index + 1}` : undefined,
      summary: summarizeJoinMatch(
        itemSource.data,
        itemTarget.data,
        item.sourceColumns[0],
        item.targetColumns[0],
      ),
    }];
  });
  const hasCompleteJoinSummaries =
    !hasJoinPlan || recommendedJoinSummaries.length === joins.length;
  const adjustedJoinSummary =
    adjustedJoin && source?.data && target?.data
      ? summarizeJoinMatch(
          source.data,
          target.data,
          adjustedJoin.sourceColumns[0],
          adjustedJoin.targetColumns[0],
        )
      : undefined;
  const highlightTerms = datasetTextTerms(datasets);

  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Step 4</p>
        <h2>Review before combining files</h2>
      </div>
      <AiGuardrailPanel explanation={aiGuardrail} />
      <div className="recommendation-card">
        <p className="eyebrow">Candidate review path</p>
        <h2>{recommendations.recommendedPath.title}</h2>
        <p>{recommendations.summary}</p>
        <div className="why-box">
          <strong>Why:</strong> {recommendations.recommendedPath.rationale}
        </div>
        {recommendedJoinSummaries.length > 0 ? (
          <JoinTrustSummaryList summaries={recommendedJoinSummaries} />
        ) : null}
        {hasJoinPlan && !hasCompleteJoinSummaries ? (
          <p className="helper-text" id={joinSummaryWarningId}>
            Join match summary is unavailable for one or more dataset pairs.
            Review the input data before accepting this plan.
          </p>
        ) : null}
        <div className="action-row">
          <button
            aria-describedby={
              hasJoinPlan && !hasCompleteJoinSummaries
                ? joinSummaryWarningId
                : undefined
            }
            className="primary-button"
            disabled={!hasCompleteJoinSummaries}
            onClick={() => onAccept(joins)}
          >
            {hasJoinPlan ? "Accept recommendation" : "Prepare dataset"}
          </button>
          {join && (
            <button onClick={() => setShowAdjust((value) => !value)}>
              Adjust join
            </button>
          )}
        </div>
      </div>
      {showAdjust && join && source && target && (
        <article className="card reveal-panel">
          <h3>Join/combine adjustment</h3>
          <p>Change the combine field or join type.</p>
          <div className="control-grid">
            <label>
              Source field
              <select
                value={sourceColumn}
                onChange={(event) => setSourceColumn(event.target.value)}
              >
                {(source.columns ?? []).map((column) => (
                  <option key={column} value={column}>
                    {fieldDisplayLabel(column)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target field
              <select
                value={targetColumn}
                onChange={(event) => setTargetColumn(event.target.value)}
              >
                {(target.columns ?? []).map((column) => (
                  <option key={column} value={column}>
                    {fieldDisplayLabel(column)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Join type
              <select
                value={joinType}
                onChange={(event) =>
                  setJoinType(
                    event.target.value as JoinRecommendation["joinType"],
                  )
                }
              >
                <option value="left">Left join</option>
                <option value="inner">Inner join</option>
                <option value="outer">Outer join</option>
              </select>
            </label>
          </div>
          {adjustedJoinSummary ? (
            <JoinTrustSummaryPanel summary={adjustedJoinSummary} />
          ) : null}
          <div className="action-row">
            <button
              className="primary-button"
              disabled={!adjustedJoinSummary}
              onClick={() =>
                adjustedJoin && adjustedJoinSummary && onAccept([adjustedJoin])
              }
            >
              Use adjusted join for review
            </button>
          </div>
        </article>
      )}
      {hasJoinPlan && <JoinReviewCard joins={joins} datasets={datasets} />}
      <CleaningRecommendationsPanel
        recommendations={cleaningRecommendations}
      />
    </section>
  );
}

function JoinReviewCard({
  joins,
  datasets,
}: {
  joins: JoinRecommendation[];
  datasets: Dataset[];
}) {
  const coveredDatasetIds = new Set(
    joins.flatMap((join) => [join.sourceDatasetId, join.targetDatasetId]),
  );
  const matchRates = joins
    .map((join) => join.estimatedMatchRate)
    .filter((value): value is number => value !== undefined);
  const averageMatchRate =
    matchRates.length > 0
      ? matchRates.reduce((sum, value) => sum + value, 0) / matchRates.length
      : undefined;
  const planMeta =
    joins.length > 1
      ? `${formatCount(joins.length, "join")}, ${coveredDatasetIds.size} of ${datasets.length} sources`
      : averageMatchRate === undefined
        ? "Match rate not estimated"
        : `${formatPercentage(averageMatchRate)} match rate`;
  return (
    <details className="card profile-accordion">
      <summary>
        <span>{joins.length === 1 ? "Review candidate join/combine path" : "Review join/combine plan"}</span>
        <span className="accordion-meta">{planMeta}</span>
      </summary>
      <div className="accordion-content">
        <ol className="join-plan-list">
          {joins.map((join, index) => {
            const source = datasets.find(
              (dataset) => dataset.id === join.sourceDatasetId,
            );
            const target = datasets.find(
              (dataset) => dataset.id === join.targetDatasetId,
            );
            const sourceName = source?.name ?? "source dataset";
            const targetName = target?.name ?? "target dataset";
            return (
              <li key={join.id}>
                <p>
                  <strong>Join {index + 1}</strong>{" "}
                  <code className="inline-code">{sourceName}</code> to{" "}
                  <code className="inline-code">{targetName}</code> using{" "}
                  <code className="inline-code">{join.sourceColumns[0]}</code>
                  {" = "}
                  <code className="inline-code">{join.targetColumns[0]}</code>.
                </p>
                <p>
                  Expected match rate:{" "}
                  {join.estimatedMatchRate === undefined
                    ? "Not estimated"
                    : formatPercentage(join.estimatedMatchRate)}
                </p>
                <p>{join.rationale}</p>
                {join.risks.length > 0 && (
                  <p>Risk: {join.risks.join(" ")}</p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </details>
  );
}

function JoinTrustSummaryList({
  summaries,
}: {
  summaries: { id: string; label?: string; summary: JoinMatchSummary }[];
}) {
  return (
    <div className="join-trust-summary-list">
      {summaries.map((item) => (
        <JoinTrustSummaryPanel
          key={item.id}
          label={item.label}
          summary={item.summary}
        />
      ))}
    </div>
  );
}

function JoinTrustSummaryPanel({
  label,
  summary,
}: {
  label?: string;
  summary: JoinMatchSummary;
}) {
  const unmatchedCount =
    summary.unmatchedLeftCount + summary.unmatchedRightCount;
  const duplicateCount =
    summary.duplicateLeftKeyCount + summary.duplicateRightKeyCount;
  const blankKeyCount = summary.blankLeftKeyCount + summary.blankRightKeyCount;
  return (
    <div className="why-box">
      <strong>{label ? `${label} trust summary:` : "Join trust summary:"}</strong>{" "}
      {formatCount(summary.matchedCount, "source row")} matched across{" "}
      {formatCount(summary.leftCount, "source row")} and{" "}
      {formatCount(summary.rightCount, "target row")}.{" "}
      {unmatchedCount > 0 || duplicateCount > 0 || blankKeyCount > 0
        ? `${formatCount(unmatchedCount, "unmatched row")}, ${formatCount(duplicateCount, "duplicate key row")}, and ${formatCount(blankKeyCount, "blank key row")} need review.`
        : "No unmatched, duplicate, or blank keys were detected."}
      {summary.unmatchedLeftKeys.length > 0 ? (
        <p>
          Source unmatched key samples:{" "}
          {summary.unmatchedLeftKeys.map((key) => (
            <code className="inline-code" key={`left-${key}`}>
              {key}
            </code>
          ))}
        </p>
      ) : null}
      {summary.unmatchedRightKeys.length > 0 ? (
        <p>
          Target unmatched key samples:{" "}
          {summary.unmatchedRightKeys.map((key) => (
            <code className="inline-code" key={`right-${key}`}>
              {key}
            </code>
          ))}
        </p>
      ) : null}
      {summary.duplicateLeftKeys.length > 0 ? (
        <p>
          Source duplicate key samples:{" "}
          {summary.duplicateLeftKeys.map((key) => (
            <code className="inline-code" key={`left-duplicate-${key}`}>
              {key}
            </code>
          ))}
        </p>
      ) : null}
      {summary.duplicateRightKeys.length > 0 ? (
        <p>
          Target duplicate key samples:{" "}
          {summary.duplicateRightKeys.map((key) => (
            <code className="inline-code" key={`right-duplicate-${key}`}>
              {key}
            </code>
          ))}
        </p>
      ) : null}
    </div>
  );
}

export function ValidationStep({
  aiGuardrail,
  acknowledgedBlockerIds,
  canGenerateDashboard,
  dataset,
  decisionReadiness,
  evidenceCoverage,
  joins,
  quality,
  readinessBlockers,
  transformationLog,
  isWorking = false,
  onBlockerAcknowledgementChange,
  onProceed,
  repairActions = [],
}: {
  aiGuardrail: AiGuardrailExplanation;
  acknowledgedBlockerIds: string[];
  canGenerateDashboard: boolean;
  dataset: Dataset;
  decisionReadiness?: DecisionReadinessResult;
  evidenceCoverage: EvidenceCoverageSummary;
  joins?: JoinRecommendation[];
  quality: QualityCheckResult[];
  readinessBlockers: ReadinessBlocker[];
  transformationLog: TransformationStep[];
  isWorking?: boolean;
  onBlockerAcknowledgementChange: (blockerId: string, acknowledged: boolean) => void;
  onProceed: () => void;
  repairActions?: RepairAction[];
}) {
  const blocking = quality.filter((issue) => issue.status === "fail");
  const isDecisionUnsafe = decisionReadiness?.status === "decision_unsafe";
  const acknowledgedBlockerIdSet = new Set(acknowledgedBlockerIds);
  const logHighlightTerms = [
    ...datasetTextTerms([dataset]),
    ...transformationTextTerms(transformationLog),
  ];
  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Step 5</p>
        <h2>{joins?.length ? "Review Combined Dataset" : "Review Prepared Dataset"}</h2>
      </div>
      <EvidenceControlTowerPanel
        evidenceCoverage={evidenceCoverage}
        readiness={decisionReadiness}
      />
      <RepairActionsPanel actions={repairActions} />
      <AiGuardrailPanel explanation={aiGuardrail} />
      {isDecisionUnsafe ? (
        <article
          aria-labelledby="readiness-blocker-checklist-heading"
          className="decision-readiness high"
        >
          <div>
            <p className="eyebrow">Review-only dashboard gate</p>
            <h3 id="readiness-blocker-checklist-heading">Dashboard is review-only: unresolved evidence gaps remain</h3>
            <p>
              Acknowledge each unresolved blocker before generating a
              review-only dashboard. This does not mark the evidence ready for
              action.
            </p>
          </div>
          <div className="evidence-choice-grid">
            {readinessBlockers.length > 0 ? (
              readinessBlockers.map((blocker) => (
                <label
                  className="checkbox-row"
                  key={`${blocker.id}:${blocker.label}`}
                >
                  <input
                    checked={acknowledgedBlockerIdSet.has(blocker.id)}
                    onChange={(event) =>
                      onBlockerAcknowledgementChange(
                        blocker.id,
                        event.target.checked,
                      )
                    }
                    type="checkbox"
                  />
                  <span>{blocker.label}</span>
                </label>
              ))
            ) : (
              <p className="helper-text">
                Readiness is unsafe but no blocker labels were available. Rerun
                validation or review the prepared data before generating a
                dashboard.
              </p>
            )}
          </div>
        </article>
      ) : null}
      <article className="recommendation-card">
        <p className="eyebrow">Next review step</p>
        <h2>
          {blocking.length > 0
            ? "Resolve blockers before decision use"
            : "Generate review dashboard"}
        </h2>
        <p>
          {blocking.length > 0
            ? `${blocking.length} high-severity issue${blocking.length === 1 ? "" : "s"} were identified during profiling.`
            : "No blocking quality issues were found."}
        </p>
        <div className="action-row">
          <button
            className="primary-button"
            disabled={isWorking || !canGenerateDashboard}
            onClick={onProceed}
          >
            {isWorking
              ? "Generating..."
              : blocking.length > 0
                ? "Generate caveated review dashboard"
                : "Generate review dashboard"}
          </button>
        </div>
      </article>
      <DatasetPreview dataset={dataset} title="Final prepared data preview" defaultOpen />
      <TransformationLogPanel
        log={transformationLog}
      />
    </section>
  );
}

function RepairActionsPanel({ actions }: { actions: RepairAction[] }) {
  if (actions.length === 0) return null;
  return (
    <article className="repair-actions-panel" aria-labelledby="repair-actions-title">
      <div>
        <p className="eyebrow">Decision repair</p>
        <h3 id="repair-actions-title">Next best repair actions</h3>
        <p>
          These session-only checks show the easiest review path. They do not
          replace owner review or handoff caveats.
        </p>
      </div>
      <div className="repair-action-list">
        {actions.slice(0, 3).map((action) => (
          <section className={`repair-action ${action.severity}`} key={action.id}>
            <div className="repair-action-heading">
              <h4>{action.title}</h4>
              <span>{action.severity}</span>
            </div>
            <p>{action.whyItMatters}</p>
            <div className="repair-action-detail">
              <strong>Easiest safe fix</strong>
              <span>{action.easiestFix}</span>
            </div>
            <div className="repair-action-detail">
              <strong>App can help</strong>
              <span>{action.appCanHelpWith.join(" ")}</span>
            </div>
            <div className="repair-action-detail">
              <strong>Human review</strong>
              <span>{action.humanMustReview}</span>
            </div>
            <div className="repair-action-meta">
              <span>{repairActionAutomationLabel(action.safeAutomationLevel)}</span>
              <span>{action.estimatedEffort.replaceAll("_", " ")}</span>
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

function DecisionReadinessPanel({
  readiness,
  compact = false,
}: {
  readiness?: DecisionReadinessResult;
  compact?: boolean;
}) {
  if (!readiness) return null;
  const tone =
    readiness.status === "decision_unsafe"
      ? "high"
      : readiness.status === "review_needed"
        ? "medium"
        : "low";
  return (
    <article className={`decision-readiness ${tone}`}>
      <div>
        <p className="eyebrow">Decision readiness</p>
        <p className="status-label">{readinessStatusLabel(readiness.status)}</p>
        <h3>{readiness.title}</h3>
        <p>{readiness.summary}</p>
      </div>
      {!compact ? (
        <div className="readiness-grid">
          <div>
            <span>Covered evidence</span>
            <strong>{readiness.requiredEvidenceCovered.length}</strong>
          </div>
          <div>
            <span>Missing evidence</span>
            <strong>{readiness.requiredEvidenceMissing.length}</strong>
          </div>
          <div>
            <span>Blockers</span>
            <strong>{readiness.blockerCount}</strong>
          </div>
        </div>
      ) : null}
      {readiness.caveats.length > 0 ? (
        <ul className="caveat-list">
          {readiness.caveats.slice(0, compact ? 2 : 4).map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function EvidenceControlTowerPanel({
  evidenceCoverage,
  readiness,
}: {
  evidenceCoverage: EvidenceCoverageSummary;
  readiness?: DecisionReadinessResult;
}) {
  if (!readiness) return null;
  const controlTower = buildEvidenceReadinessControlTower({
    evidenceCoverage,
    readiness,
  });
  const tone =
    controlTower.actionSafetyState === "blocked_for_action"
      ? "high"
      : controlTower.actionSafetyState === "needs_review"
        ? "medium"
        : "low";

  return (
    <article className={`evidence-control-tower ${tone}`}>
      <div className="control-tower-header">
        <div>
          <p className="eyebrow">Evidence readiness control tower</p>
          <p className="status-label">{readinessStatusLabel(controlTower.status)}</p>
          <h3>{readiness.title}</h3>
          <p>{controlTower.reviewState}</p>
        </div>
        <div className="control-tower-confidence">
          <span>Evidence-match confidence</span>
          <strong>{controlTower.sourceConfidence}</strong>
          <p>{controlTower.sourceConfidenceRationale} Not a source reliability score.</p>
        </div>
      </div>
      <div className="control-tower-grid">
        <div>
          <span>Covered</span>
          <strong>{controlTower.evidenceCovered.length}</strong>
          <p>{formatEvidenceList(controlTower.evidenceCovered)}</p>
        </div>
        <div>
          <span>Ambiguous</span>
          <strong>{controlTower.ambiguousEvidence.length}</strong>
          <p>{formatEvidenceList(controlTower.ambiguousEvidence)}</p>
        </div>
        <div>
          <span>Missing</span>
          <strong>{controlTower.missingEvidence.length}</strong>
          <p>{formatEvidenceList(controlTower.missingEvidence)}</p>
        </div>
        <div>
          <span>Blockers</span>
          <strong>{controlTower.blockers.length}</strong>
          <p>{controlTower.blockers[0] ?? "No blocker detected."}</p>
        </div>
      </div>
      {controlTower.nextCollectionAsks.length > 0 ? (
        <div className="control-tower-next-asks">
          <h4>Next collection asks</h4>
          <ul className="compact-list">
            {controlTower.nextCollectionAsks.map((ask) => (
              <li key={ask}>{ask}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

function formatEvidenceList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "None";
}

function AiGuardrailPanel({
  explanation,
}: {
  explanation: AiGuardrailExplanation;
}) {
  const statusLabel = {
    fallback: "Deterministic fallback",
    not_requested: "AI not used",
    returned: "AI draft returned",
  }[explanation.aiRecommendationStatus];
  const validationLabel = {
    accepted: "Allowed for review by deterministic checks",
    partially_accepted: "Needs deterministic review",
    rejected: "Rejected by deterministic checks",
  }[explanation.deterministicValidation];
  const tone =
    explanation.deterministicValidation === "rejected"
      ? "high"
      : explanation.deterministicValidation === "partially_accepted"
        ? "medium"
        : "low";

  return (
    <article className={`ai-guardrail-panel ${tone}`}>
      <div className="ai-guardrail-header">
        <div>
          <p className="eyebrow">AI guardrails</p>
          <h3>Advisory output, deterministic authority</h3>
          <p>{explanation.deterministicAuthorityStatement}</p>
        </div>
        <div className="ai-guardrail-status">
          <span>{statusLabel}</span>
          <strong>{validationLabel}</strong>
        </div>
      </div>
      <div className="ai-guardrail-grid">
        <div>
          <span>AI status</span>
          <strong>{statusLabel}</strong>
          {explanation.fallbackReason ? (
            <p>Fallback reason: {explanation.fallbackReason.replaceAll("_", " ")}</p>
          ) : (
            <p>Fallback reason: none recorded.</p>
          )}
        </div>
        <div>
          <span>Deterministic validation</span>
          <strong>{validationLabel}</strong>
          <p>
            {explanation.deterministicValidation === "accepted"
              ? "No blocking deterministic caveats are attached to this step."
              : "Review caveats before using the output for action or handoff."}
          </p>
        </div>
      </div>
      {explanation.validationCaveats.length > 0 ? (
        <ul className="compact-list">
          {explanation.validationCaveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      ) : null}
      {explanation.unsupportedSuggestions.length > 0 ? (
        <p className="helper-text">
          Unsupported suggestions retained for review:{" "}
          {explanation.unsupportedSuggestions.join(" ")}
        </p>
      ) : null}
    </article>
  );
}

function CleaningRecommendationsPanel({
  recommendations,
}: {
  recommendations: CleaningRecommendation[];
}) {
  if (recommendations.length === 0) return null;
  return (
    <article className="cleaning-panel">
      <div>
        <p className="eyebrow">Harmonization</p>
        <h2>Automated Data Cleaning</h2>
      </div>
      <p>
        When the dataset is harmonized, safe normalization will also be checked.
        Only values that need changes are updated and recorded in the
        transformation log:
      </p>
      <ul className="labeled-list">
        {recommendations.map((recommendation) => (
          <li key={recommendation.id}>
            <strong>{recommendation.title}</strong>
            <span>
              {recommendation.suggestedAction}
              {recommendation.affectedColumns.length > 0 ? (
                <>
                  {" "}
                  Columns:{" "}
                  {renderInlineCodeList(recommendation.affectedColumns)}.
                </>
              ) : null}
              {` Transform: ${cleaningTransformLabel(recommendation.transform.type)}.`}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function DashboardStep({
  refNode,
  dataset,
  decisionReadiness,
  recommendation,
  onExport,
}: {
  refNode: React.RefObject<HTMLDivElement | null>;
  dataset: Dataset;
  decisionReadiness?: DecisionReadinessResult;
  recommendation: DashboardRecommendation;
  onExport: () => void;
}) {
  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Review dashboard</p>
        <h2>{dataset.name}</h2>
      </div>
      <DashboardPreview
        refNode={refNode}
        dataset={dataset}
        decisionReadiness={decisionReadiness}
        recommendation={recommendation}
      />
      <button
        type="button"
        className="primary-button next-action"
        onClick={onExport}
      >
        Export review artifacts
      </button>
    </section>
  );
}

export function DashboardPreview({
  refNode,
  dataset,
  decisionReadiness,
  recommendation,
  expandInsights = false,
  exportMode = false,
  interactive = true,
  showInsightLinks = true,
}: {
  refNode: React.RefObject<HTMLDivElement | null>;
  dataset: Dataset;
  decisionReadiness?: DecisionReadinessResult;
  recommendation: DashboardRecommendation;
  expandInsights?: boolean;
  exportMode?: boolean;
  interactive?: boolean;
  showInsightLinks?: boolean;
}) {
  const [highlightedChartId, setHighlightedChartId] = useState<string>();
  const [activeMobilePanel, setActiveMobilePanel] = useState("overview");
  const chartSections = groupChartsBySection(recommendation.charts);
  const mobilePanels = [
    { id: "overview", title: "Overview" },
    { id: "insights", title: "Insights" },
    ...chartSections.map((section) => ({
      id: chartSectionPanelId(section.id),
      title: section.id === "overview" ? "Overview charts" : section.title,
    })),
  ];

  function selectInsightChart(chartId: string) {
    setHighlightedChartId(chartId);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`chart-${chartId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function focusMobilePanelTab(panelId: string) {
    window.requestAnimationFrame(() => {
      document.getElementById(`dashboard-mobile-tab-${panelId}`)?.focus();
    });
  }

  function handleMobilePanelKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    panelId: string,
  ) {
    const currentIndex = mobilePanels.findIndex((panel) => panel.id === panelId);
    if (currentIndex < 0) return;

    const keyOffset: Record<string, number> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    const offset = keyOffset[event.key];
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? mobilePanels.length - 1
          : offset === undefined
            ? undefined
            : (currentIndex + offset + mobilePanels.length) %
              mobilePanels.length;

    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextPanelId = mobilePanels[nextIndex].id;
    setActiveMobilePanel(nextPanelId);
    focusMobilePanelTab(nextPanelId);
  }

  return (
    <div
      ref={refNode}
      className={exportMode ? "dashboard dashboard-export-layout" : "dashboard"}
    >
      {!exportMode && (
        <div className="dashboard-mobile-tabs" role="tablist" aria-label="Dashboard sections">
          {mobilePanels.map((panel) => (
            <button
              aria-controls={`dashboard-mobile-panel-${panel.id}`}
              aria-selected={activeMobilePanel === panel.id}
              className={activeMobilePanel === panel.id ? "selected" : undefined}
              id={`dashboard-mobile-tab-${panel.id}`}
              key={panel.id}
              onClick={() => setActiveMobilePanel(panel.id)}
              onKeyDown={(event) => handleMobilePanelKeyDown(event, panel.id)}
              role="tab"
              tabIndex={activeMobilePanel === panel.id ? 0 : -1}
              type="button"
            >
              {panel.title}
            </button>
          ))}
        </div>
      )}
      <section
        aria-label={exportMode ? "Overview" : undefined}
        aria-labelledby={exportMode ? undefined : "dashboard-mobile-tab-overview"}
        className={`dashboard-mobile-panel ${exportMode || activeMobilePanel === "overview" ? "active" : ""}`}
        id="dashboard-mobile-panel-overview"
        role="tabpanel"
      >
        <DecisionReadinessPanel readiness={decisionReadiness} compact />
        <SummaryMetrics
          dataset={dataset}
          metrics={recommendation.summaryMetrics}
        />
      </section>
      <section
        aria-label={exportMode ? "Insights" : undefined}
        aria-labelledby={exportMode ? undefined : "dashboard-mobile-tab-insights"}
        className={`dashboard-mobile-panel ${exportMode || activeMobilePanel === "insights" ? "active" : ""}`}
        id="dashboard-mobile-panel-insights"
        role="tabpanel"
      >
        <DashboardInsights
          insights={recommendation.insights ?? []}
          activeChartId={highlightedChartId}
          onInsightSelect={selectInsightChart}
          defaultOpen={expandInsights}
          showChartLinks={showInsightLinks && interactive}
        />
      </section>
      {chartSections.map((section) => {
        const panelId = chartSectionPanelId(section.id);
        const hasFeaturedCard =
          section.id === "comparisons" && section.charts.length > 0;
        const hasOrphanCard = hasFeaturedCard
          ? section.charts.length % 2 === 0
          : section.charts.length % 2 === 1;
        return (
          <section
            aria-label={exportMode ? section.title : undefined}
            aria-labelledby={exportMode ? undefined : `dashboard-mobile-tab-${panelId}`}
            className={`dashboard-section dashboard-mobile-panel ${exportMode || activeMobilePanel === panelId ? "active" : ""}`}
            id={`dashboard-mobile-panel-${panelId}`}
            key={panelId}
            role="tabpanel"
          >
            <div className="dashboard-section-heading">
              <h2>{section.title}</h2>
            </div>
            <div
              className={[
                "dashboard-grid",
                `dashboard-grid-${section.id}`,
                hasOrphanCard ? "dashboard-grid-has-orphan" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {section.charts.map((chart, index) => (
                <ChartPanel
                  key={chart.id}
                  dataset={dataset}
                  chart={chart}
                  featured={section.id === "comparisons" && index === 0}
                  highlighted={chart.id === highlightedChartId}
                  interactive={interactive}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function chartSectionPanelId(sectionId: string) {
  return `charts-${sectionId}`;
}

function DashboardInsights({
  insights,
  activeChartId,
  onInsightSelect,
  defaultOpen = false,
  showChartLinks = true,
}: {
  insights: NonNullable<DashboardRecommendation["insights"]>;
  activeChartId?: string;
  onInsightSelect: (chartId: string) => void;
  defaultOpen?: boolean;
  showChartLinks?: boolean;
}) {
  if (insights.length === 0) return null;
  return (
    <details
      className="card dashboard-insights"
      open={defaultOpen || undefined}
    >
      <summary className="dashboard-insights-summary">
        <span>
          <strong>Review prompts</strong>
          <span>Evidence-backed observations and review prompts.</span>
        </span>
        <span className="accordion-meta">
          {insights.length} insight{insights.length === 1 ? "" : "s"}
        </span>
      </summary>
      <div className="accordion-content">
        <ul className="insight-list">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className={[
                "insight-item",
                insight.severity,
                insight.linkedChartId === activeChartId ? "active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="insight-item-header">
                <strong>{insight.title}</strong>
                {insight.insightType && (
                  <span className="insight-type-pill">
                    {formatInsightType(insight.insightType)}
                  </span>
                )}
              </div>
              <span>{insight.description}</span>
              {insight.evidence && insight.evidence.length > 0 && (
                <ul className="evidence-list">
                  {insight.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {insight.recommendedAction && (
                <p className="insight-action">
                  <strong>Review action</strong>
                  <span>{insight.recommendedAction}</span>
                </p>
              )}
              {showChartLinks && insight.linkedChartId && (
                <button
                  type="button"
                  className="insight-chart-link"
                  onClick={() => onInsightSelect(insight.linkedChartId!)}
                >
                  Show supporting chart
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function groupChartsBySection(charts: DashboardRecommendation["charts"]) {
  const sectionConfig = [
    {
      id: "overview",
      title: "Overview",
      description:
        "Headline signals and summary views for the prepared dataset.",
    },
    {
      id: "location",
      title: "Location",
      description:
        "Local coordinate and administrative-area views from uploaded fields.",
    },
    {
      id: "comparisons",
      title: "Key Comparisons",
      description:
        "The strongest group, metric, trend, and distribution views.",
    },
    {
      id: "quality",
      title: "Data Quality and Coverage",
      description:
        "Views that help interpret missingness, joins, and reliability.",
    },
    {
      id: "details",
      title: "Detail Review",
      description:
        "Ranked rows and transparent records behind the aggregate charts.",
    },
  ] as const;

  return sectionConfig
    .map((section) => ({
      ...section,
      charts: charts
        .filter(
          (chart) =>
            (chart.section ?? defaultChartSection(chart.chartType)) ===
            section.id,
        )
        .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50)),
    }))
    .filter((section) => section.charts.length > 0);
}

function defaultChartSection(
  chartType: DashboardRecommendation["charts"][number]["chartType"],
) {
  if (chartType === "summary") return "overview";
  if (chartType === "map" || chartType === "area" || chartType === "choropleth") return "location";
  if (chartType === "table") return "details";
  if (chartType === "missingness") return "quality";
  return "comparisons";
}

function formatInsightType(
  type: NonNullable<DashboardRecommendation["insights"]>[number]["insightType"],
) {
  return String(type ?? "insight").replaceAll("_", " ");
}

function SummaryMetrics({
  dataset,
  metrics,
}: {
  dataset: Dataset;
  metrics: string[];
}) {
  const rows = dataset.data ?? [];
  return (
    <div className="metric-grid">
      {metrics.map((metric) => {
        const aggregation =
          metric === "Total records" ? "count" : inferMetricAggregation(metric);
        const value =
          metric === "Total records"
            ? rows.length
            : aggregateField(rows, metric, aggregation);
        return (
          <div className="metric" key={metric}>
            <span>
              {metric === "Total records"
                ? metric
                : metricDisplayLabel(metric, aggregation)}
            </span>
            <strong>{formatNumber(value)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function ChartPanel({
  dataset,
  chart,
  featured = false,
  highlighted = false,
  interactive = true,
}: {
  dataset: Dataset;
  chart: DashboardRecommendation["charts"][number];
  featured?: boolean;
  highlighted?: boolean;
  interactive?: boolean;
}) {
  const rows = dataset.data ?? [];
  const groupField = chart.groupByField ?? chart.xField;
  const metricField = chart.metricField ?? chart.yField;
  const recommendedAggregation =
    chart.aggregation ?? inferMetricAggregation(metricField);
  const effectiveAggregation =
    chart.chartType === "pie" && recommendedAggregation === "average"
      ? "count"
      : recommendedAggregation;
  const groupLabel = groupField
    ? fieldDisplayLabel(groupField)
    : "Dataset summary";
  const metricLabel = metricDisplayLabel(metricField, effectiveAggregation);
  const grouped = groupField
    ? aggregateRows(rows, groupField, metricField, effectiveAggregation)
    : [];
  const sortedGrouped = sortGroupedMetricValues(grouped, chart.sortBy);
  const categoryLimit = chartCategoryLimit(chart);
  const chartClassName = [
    featured ? "featured" : "",
    highlighted ? "highlighted" : "",
    `chart-card-${chart.chartType}`,
    chart.mobileBehavior ? `mobile-${chart.mobileBehavior}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const chartBody =
    chart.chartType === "summary" ? (
      <SummaryChart
        dataset={dataset}
        groupField={groupField}
        metricField={metricField}
        aggregation={effectiveAggregation}
        interactive={interactive}
      />
    ) : chart.chartType === "table" ? (
      <RankedTable dataset={dataset} chart={chart} />
    ) : chart.chartType === "pie" ? (
      <PieChart
        grouped={sortedGrouped}
        maxCategories={categoryLimit ?? 5}
        metricLabel={metricLabel}
        title={chart.title}
        interactive={interactive}
      />
    ) : chart.chartType === "line" ? (
      <LineChart
        grouped={sortedGrouped}
        groupLabel={groupLabel}
        metricLabel={metricLabel}
        title={chart.title}
        maxPoints={categoryLimit ?? 14}
        interactive={interactive}
      />
    ) : chart.chartType === "map" ? (
      <MapChart
        dataset={dataset}
        latitudeField={chart.yField}
        longitudeField={chart.xField}
        labelField={chart.groupByField}
        metricField={metricField}
        metricLabel={metricLabel}
        title={chart.title}
        interactive={interactive}
      />
    ) : chart.chartType === "area" ? (
      <AreaIntensityChart
        grouped={sortedGrouped}
        groupLabel={groupLabel}
        metricLabel={metricLabel}
        title={chart.title}
        maxCategories={categoryLimit ?? 12}
        interactive={interactive}
      />
    ) : chart.chartType === "scatter" ? (
      <ScatterChart
        dataset={dataset}
        groupField={groupField}
        title={chart.title}
        xField={chart.xField}
        yField={chart.yField ?? metricField}
        interactive={interactive}
      />
    ) : chart.chartType === "missingness" ? (
      <MissingnessChart dataset={dataset} title={chart.title} interactive={interactive} />
    ) : grouped.length === 0 ? (
      metricField ? (
        <SummaryChart
          dataset={dataset}
          metricField={metricField}
          aggregation={effectiveAggregation}
          interactive={interactive}
        />
      ) : (
        <DatasetPreview dataset={dataset} />
      )
    ) : (
      <BarChart
        grouped={sortedGrouped}
        groupLabel={groupLabel}
        metricLabel={metricLabel}
        title={chart.title}
        maxCategories={categoryLimit ?? 10}
        interactive={interactive}
      />
    );

  return (
    <ChartFrame
      className={chartClassName}
      id={`chart-${chart.id}`}
      qualityBadge={chart.qualityBadge}
      screenReaderSummary={chart.screenReaderSummary}
      sourceNote={chart.sourceNote}
      subtitle={chart.subtitle}
      title={chart.title}
    >
      <p className="chart-rationale">{chart.rationale}</p>
      {chartBody}
    </ChartFrame>
  );
}

function BarChart({
  grouped,
  groupLabel,
  interactive = true,
  maxCategories = 10,
  metricLabel,
  title,
}: {
  grouped: GroupedMetricValue[];
  groupLabel: string;
  interactive?: boolean;
  maxCategories?: number;
  metricLabel: string;
  title: string;
}) {
  const visible = grouped.slice(0, maxCategories);
  const max = Math.max(...visible.map((item) => item.value), 1);
  const chartTabIndex = interactive ? 0 : -1;
  return (
    <div
      className="bars"
      role="list"
      aria-label={`${title}. ${metricLabel} by ${groupLabel}. Highest value ${formatNumber(max)}.`}
    >
      {visible.map((item) => (
        <div
          aria-label={chartValueDescription(item, metricLabel)}
          className="bar-row chart-mark"
          data-tooltip={chartValueDescription(item, metricLabel)}
          key={item.label}
          role="listitem"
          tabIndex={chartTabIndex}
        >
          <span title={item.label}>{item.label}</span>
          <div className="bar-track">
            <div
              className="chart-bar"
              style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
            >
              {formatNumber(item.value)}
            </div>
          </div>
        </div>
      ))}
      <div className="bar-axis" aria-hidden="true">
        <span>0</span>
        <span>{formatAxisNumber(max / 2)}</span>
        <span>{formatAxisNumber(max)}</span>
      </div>
    </div>
  );
}

function PieChart({
  grouped,
  interactive = true,
  maxCategories = 5,
  metricLabel,
  title,
}: {
  grouped: GroupedMetricValue[];
  interactive?: boolean;
  maxCategories?: number;
  metricLabel: string;
  title: string;
}) {
  const chartId = useId();
  const [activeIndex, setActiveIndex] = useState<number>();
  const chartTabIndex = interactive ? 0 : -1;
  const total = grouped.reduce((sum, item) => sum + item.value, 0);
  const visible = grouped.slice(0, maxCategories);
  const otherValue = grouped
    .slice(maxCategories)
    .reduce((sum, item) => sum + item.value, 0);
  const slices =
    otherValue > 0
      ? [
          ...visible,
          {
            label: "Other",
            value: otherValue,
            count: grouped.slice(maxCategories).reduce((sum, item) => sum + item.count, 0),
            total: grouped.slice(maxCategories).reduce((sum, item) => sum + item.total, 0),
            aggregation: grouped[0]?.aggregation ?? "count",
          },
        ]
      : visible;
  if (slices.length === 0 || total <= 0) {
    return <div className="mini-empty">No part-to-whole values found.</div>;
  }
  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = slices.map((item, index) => {
    const percent = item.value / total;
    const dashLength = percent * circumference;
    const midpointAngle =
      ((offset + dashLength / 2) / circumference) * Math.PI * 2 - Math.PI / 2;
    const segment = {
      ...item,
      color: CHART_PALETTE[index % CHART_PALETTE.length],
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: -offset,
      percent,
      tooltipX: 100 + Math.cos(midpointAngle) * radius,
      tooltipY: 100 + Math.sin(midpointAngle) * radius,
    };
    offset += dashLength;
    return segment;
  });
  const activeSegment =
    activeIndex === undefined ? undefined : segments[activeIndex];

  return (
    <div className="pie-layout">
      <div className="pie-plot">
        <svg
          aria-describedby={`${chartId}-description`}
          aria-labelledby={`${chartId}-title`}
          className="pie-svg"
          fill="none"
          role="img"
          viewBox="0 0 200 200"
        >
          <title id={`${chartId}-title`}>{title}</title>
          <desc id={`${chartId}-description`}>
            Donut chart showing {metricLabel} across{" "}
            {formatCount(slices.length, "group")}. Values are also listed in the
            legend.
          </desc>
          <circle
            className="pie-track"
            cx="100"
            cy="100"
            fill="none"
            r={radius}
            stroke="#ecece7"
            strokeWidth="30"
          />
          {segments.map((item, index) => (
            <circle
              aria-label={`${item.label}, ${formatNumber(item.value)}, ${Math.round(item.percent * 100)} percent`}
              className="pie-segment"
              cx="100"
              cy="100"
              fill="none"
              key={item.label}
              onBlur={() => setActiveIndex(undefined)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              r={radius}
              stroke={item.color}
              strokeDasharray={item.dashArray}
              strokeDashoffset={item.dashOffset}
              strokeLinecap="butt"
              strokeWidth="30"
              tabIndex={chartTabIndex}
              transform="rotate(-90 100 100)"
            >
              <title>{chartValueDescription(item, metricLabel, total)}</title>
            </circle>
          ))}
          <text
            className="pie-total-label"
            fill="#5f656d"
            fontSize="13"
            fontWeight="700"
            textAnchor="middle"
            x="100"
            y="95"
          >
            Total
          </text>
          <text
            className="pie-total-value"
            fill="#171717"
            fontSize="17"
            fontWeight="780"
            textAnchor="middle"
            x="100"
            y="116"
          >
            {formatAxisNumber(total)}
          </text>
        </svg>
        {activeSegment && (
          <div
            className="chart-tooltip pie-tooltip"
            style={{
              left: `${(activeSegment.tooltipX / 200) * 100}%`,
              top: `${(activeSegment.tooltipY / 200) * 100}%`,
            }}
          >
            <strong>{activeSegment.label}</strong>
            <span>
              {formatNumber(activeSegment.value)} {metricLabel}
            </span>
            <span>{Math.round(activeSegment.percent * 100)}% of total</span>
          </div>
        )}
      </div>
      <ul className="chart-legend">
        {segments.map((item) => (
          <li
            aria-label={chartValueDescription(item, metricLabel, total)}
            className="chart-mark"
            data-tooltip={chartValueDescription(item, metricLabel, total)}
            key={item.label}
            tabIndex={chartTabIndex}
          >
            <i style={{ background: item.color }} />
            <span>{item.label}</span>
            <strong>{Math.round(item.percent * 100)}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LineChart({
  grouped,
  groupLabel,
  interactive = true,
  maxPoints = 14,
  metricLabel,
  title,
}: {
  grouped: GroupedMetricValue[];
  groupLabel: string;
  interactive?: boolean;
  maxPoints?: number;
  metricLabel: string;
  title: string;
}) {
  const chartId = useId();
  const [activeIndex, setActiveIndex] = useState<number>();
  const chartTabIndex = interactive ? 0 : -1;
  const points = grouped.slice().sort(compareChartLabels).slice(0, maxPoints);
  if (points.length < 2) {
    return (
      <BarChart
        grouped={grouped}
        groupLabel={groupLabel}
        interactive={interactive}
        metricLabel={metricLabel}
        title={title}
      />
    );
  }
  const width = 560;
  const height = 270;
  const padding = { top: 24, right: 28, bottom: 48, left: 62 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const max = Math.max(...points.map((point) => point.value), 1);
  const min = Math.min(...points.map((point) => point.value), 0);
  const range = Math.max(max - min, 1);
  const coords = points.map((point, index) => {
    const x =
      padding.left + (index / Math.max(points.length - 1, 1)) * plotWidth;
    const y = padding.top + ((max - point.value) / range) * plotHeight;
    return { ...point, x, y };
  });
  const path = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = `${padding.left},${height - padding.bottom} ${path} ${width - padding.right},${height - padding.bottom}`;
  const yTicks = chartTickValues(min, max, 4);
  const xTickIndexes = chartLabelIndexes(points.length, 5);
  const activePoint =
    activeIndex === undefined ? undefined : coords[activeIndex];

  return (
    <div className="line-chart">
      <div className="line-plot">
        <svg
          aria-describedby={`${chartId}-description`}
          aria-labelledby={`${chartId}-title`}
          fill="none"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
        >
          <title id={`${chartId}-title`}>{title}</title>
          <desc id={`${chartId}-description`}>
            Line chart showing {metricLabel} by {groupLabel}. The y-axis ranges
            from {formatNumber(min)} to {formatNumber(max)}.
          </desc>
          {yTicks.map((tick) => {
            const y = padding.top + ((max - tick) / range) * plotHeight;
            return (
              <g key={tick}>
                <line
                  className="chart-grid-line"
                  fill="none"
                  stroke="rgba(23, 23, 23, 0.12)"
                  strokeDasharray="3 5"
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                />
                <text
                  className="chart-axis-label"
                  fill="#5f656d"
                  fontSize="11"
                  textAnchor="end"
                  x={padding.left - 10}
                  y={y + 4}
                >
                  {formatAxisNumber(tick)}
                </text>
              </g>
            );
          })}
          <line
            className="chart-axis-line"
            fill="none"
            stroke="rgba(23, 23, 23, 0.38)"
            strokeWidth="1"
            x1={padding.left}
            x2={width - padding.right}
            y1={height - padding.bottom}
            y2={height - padding.bottom}
          />
          <line
            className="chart-axis-line"
            fill="none"
            stroke="rgba(23, 23, 23, 0.38)"
            strokeWidth="1"
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={height - padding.bottom}
          />
          {xTickIndexes.map((index) => {
            const point = coords[index];
            return (
              <text
                className="chart-axis-label"
                fill="#5f656d"
                fontSize="11"
                key={point.label}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === points.length - 1
                      ? "end"
                      : "middle"
                }
                x={point.x}
                y={height - 16}
              >
                {truncateChartLabel(point.label)}
              </text>
            );
          })}
          <polyline
            className="line-chart-area"
            fill="rgba(0, 90, 181, 0.1)"
            points={areaPath}
            stroke="none"
          />
          <polyline
            className="line-chart-line"
            fill="none"
            points={path}
            stroke="#005ab5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
          {coords.map((point, index) => (
            <g
              aria-label={chartValueDescription(point, metricLabel)}
              className="line-point"
              key={point.label}
              onBlur={() => setActiveIndex(undefined)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              tabIndex={chartTabIndex}
            >
              <circle
                cx={point.x}
                cy={point.y}
                fill={activeIndex === index ? "var(--chart-accent)" : "var(--chart-primary)"}
                r={activeIndex === index ? 7 : 5}
                stroke="#ffffff"
                strokeWidth={activeIndex === index ? 3 : 2}
              />
              <title>{chartValueDescription(point, metricLabel)}</title>
            </g>
          ))}
        </svg>
        {activePoint && (
          <div
            className="chart-tooltip line-tooltip"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${(activePoint.y / height) * 100}%`,
            }}
          >
            <strong>{activePoint.label}</strong>
            <span>
              {formatNumber(activePoint.value)} {metricLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ScatterChart({
  dataset,
  groupField,
  interactive = true,
  title,
  xField,
  yField,
}: {
  dataset: Dataset;
  groupField?: string;
  interactive?: boolean;
  title: string;
  xField?: string;
  yField?: string;
}) {
  const chartId = useId();
  const [activeIndex, setActiveIndex] = useState<number>();
  const chartTabIndex = interactive ? 0 : -1;
  if (!xField || !yField || xField === yField) {
    return (
      <div className="mini-empty">
        Two numeric fields are needed for a scatter plot.
      </div>
    );
  }
  type ScatterPoint = { group: string | undefined; x: number; y: number };
  const points = (dataset.data ?? [])
    .map((row) => {
      const x = finiteChartNumber(row[xField]);
      const y = finiteChartNumber(row[yField]);
      if (x === undefined || y === undefined) return null;
      return {
        group: groupField ? String(row[groupField] ?? "Missing") : undefined,
        x,
        y,
      };
    })
    .filter((point): point is ScatterPoint => point !== null)
    .slice(0, 120);
  if (points.length < 2) {
    return (
      <div className="mini-empty">Not enough paired numeric values found.</div>
    );
  }

  const width = 560;
  const height = 270;
  const padding = { top: 24, right: 28, bottom: 50, left: 62 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xMin = Math.min(...points.map((point) => point.x));
  const xMax = Math.max(...points.map((point) => point.x));
  const yMin = Math.min(...points.map((point) => point.y));
  const yMax = Math.max(...points.map((point) => point.y));
  const xRange = Math.max(xMax - xMin, 1);
  const yRange = Math.max(yMax - yMin, 1);
  const coords = points.map((point) => ({
    ...point,
    cx: padding.left + ((point.x - xMin) / xRange) * plotWidth,
    cy: padding.top + ((yMax - point.y) / yRange) * plotHeight,
  }));
  const activePoint =
    activeIndex === undefined ? undefined : coords[activeIndex];
  const xLabel = fieldDisplayLabel(xField);
  const yLabel = fieldDisplayLabel(yField);
  const xTicks = chartTickValues(xMin, xMax, 4);
  const yTicks = chartTickValues(yMin, yMax, 4);

  return (
    <div className="scatter-chart">
      <div className="line-plot">
        <svg
          aria-describedby={`${chartId}-description`}
          aria-labelledby={`${chartId}-title`}
          fill="none"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <title id={`${chartId}-title`}>{title}</title>
          <desc id={`${chartId}-description`}>
            Scatter plot showing {yLabel} against {xLabel} across{" "}
            {formatCount(points.length, "record")}.
          </desc>
          {yTicks.map((tick) => {
            const y = padding.top + ((yMax - tick) / yRange) * plotHeight;
            return (
              <g key={`y-${tick}`}>
                <line
                  className="chart-grid-line"
                  fill="none"
                  stroke="rgba(23, 23, 23, 0.12)"
                  strokeDasharray="3 5"
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                />
                <text
                  className="chart-axis-label"
                  fill="#5f656d"
                  fontSize="11"
                  textAnchor="end"
                  x={padding.left - 10}
                  y={y + 4}
                >
                  {formatAxisNumber(tick)}
                </text>
              </g>
            );
          })}
          {xTicks.map((tick) => {
            const x = padding.left + ((tick - xMin) / xRange) * plotWidth;
            return (
              <text
                className="chart-axis-label"
                fill="#5f656d"
                fontSize="11"
                key={`x-${tick}`}
                textAnchor="middle"
                x={x}
                y={height - 18}
              >
                {formatAxisNumber(tick)}
              </text>
            );
          })}
          <line
            className="chart-axis-line"
            fill="none"
            stroke="rgba(23, 23, 23, 0.38)"
            strokeWidth="1"
            x1={padding.left}
            x2={width - padding.right}
            y1={height - padding.bottom}
            y2={height - padding.bottom}
          />
          <line
            className="chart-axis-line"
            fill="none"
            stroke="rgba(23, 23, 23, 0.38)"
            strokeWidth="1"
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={height - padding.bottom}
          />
          {coords.map((point, index) => (
            <g
              aria-label={`${yLabel}: ${formatNumber(point.y)}; ${xLabel}: ${formatNumber(point.x)}${point.group ? `; ${point.group}` : ""}.`}
              className="scatter-point"
              key={`${point.x}-${point.y}-${index}`}
              onBlur={() => setActiveIndex(undefined)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              tabIndex={chartTabIndex}
            >
              <circle
                cx={point.cx}
                cy={point.cy}
                fill={activeIndex === index ? "var(--chart-accent)" : "var(--chart-primary)"}
                fillOpacity={activeIndex === index ? "0.96" : "0.68"}
                r={activeIndex === index ? 7 : 5}
                stroke="#ffffff"
                strokeWidth={activeIndex === index ? 3 : 2}
              />
              <title>
                {yLabel}: {formatNumber(point.y)}; {xLabel}:{" "}
                {formatNumber(point.x)}
                {point.group ? `; ${point.group}` : ""}
              </title>
            </g>
          ))}
          <text
            className="chart-axis-label"
            fill="#5f656d"
            fontSize="11"
            textAnchor="middle"
            x={padding.left + plotWidth / 2}
            y={height - 4}
          >
            {xLabel}
          </text>
          <text
            className="chart-axis-label"
            fontSize="11"
            textAnchor="start"
            x={padding.left}
            y={padding.top - 8}
          >
            {yLabel}
          </text>
        </svg>
        {activePoint && (
          <div
            className="chart-tooltip line-tooltip"
            style={{
              left: `${(activePoint.cx / width) * 100}%`,
              top: `${(activePoint.cy / height) * 100}%`,
            }}
          >
            <strong>{activePoint.group ?? "Record"}</strong>
            <span>
              {xLabel}: {formatNumber(activePoint.x)}
            </span>
            <span>
              {yLabel}: {formatNumber(activePoint.y)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MapChart({
  dataset,
  interactive = true,
  latitudeField,
  longitudeField,
  labelField,
  metricField,
  metricLabel,
  title,
}: {
  dataset: Dataset;
  interactive?: boolean;
  latitudeField?: string;
  longitudeField?: string;
  labelField?: string;
  metricField?: string;
  metricLabel: string;
  title: string;
}) {
  const chartId = useId();
  const [activeIndex, setActiveIndex] = useState<number>();
  const chartTabIndex = interactive ? 0 : -1;
  if (!latitudeField || !longitudeField) {
    return (
      <div className="mini-empty">
        Latitude and longitude fields are needed for a location map.
      </div>
    );
  }

  type MapPoint = {
    label: string;
    latitude: number;
    longitude: number;
    metricValue: number | undefined;
  };
  const points = (dataset.data ?? [])
    .map((row, index) => {
      if (
        !isValidLatitude(row[latitudeField]) ||
        !isValidLongitude(row[longitudeField])
      ) {
        return null;
      }
      const latitude = finiteChartNumber(row[latitudeField]);
      const longitude = finiteChartNumber(row[longitudeField]);
      if (latitude === undefined || longitude === undefined) return null;
      return {
        label: labelField
          ? String(row[labelField] ?? "Missing")
          : `Record ${index + 1}`,
        latitude,
        longitude,
        metricValue: metricField ? finiteChartNumber(row[metricField]) : undefined,
      };
    })
    .filter((point): point is MapPoint => point !== null)
    .slice(0, 160);
  if (points.length < 2) {
    return (
      <div className="mini-empty">
        At least two usable coordinate pairs are needed for a location map.
      </div>
    );
  }

  const width = 560;
  const height = 300;
  const padding = { top: 26, right: 32, bottom: 46, left: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const latMin = Math.min(...points.map((point) => point.latitude));
  const latMax = Math.max(...points.map((point) => point.latitude));
  const lonMin = Math.min(...points.map((point) => point.longitude));
  const lonMax = Math.max(...points.map((point) => point.longitude));
  const latRange = latMax - latMin;
  const lonRange = lonMax - lonMin;
  const metricValues = points
    .map((point) => point.metricValue)
    .filter((value): value is number => value !== undefined && value > 0);
  const metricMax = Math.max(...metricValues, 1);
  const coords = points.map((point) => {
    const cx =
      lonRange === 0
        ? padding.left + plotWidth / 2
        : padding.left + ((point.longitude - lonMin) / lonRange) * plotWidth;
    const cy =
      latRange === 0
        ? padding.top + plotHeight / 2
        : padding.top + ((latMax - point.latitude) / latRange) * plotHeight;
    const radius =
      point.metricValue === undefined
        ? 5
        : Math.max(5, Math.min(13, 5 + (point.metricValue / metricMax) * 8));
    return { ...point, cx, cy, radius };
  });
  const activePoint =
    activeIndex === undefined ? undefined : coords[activeIndex];

  return (
    <div className="map-chart">
      <div className="line-plot">
        <svg
          aria-describedby={`${chartId}-description`}
          aria-labelledby={`${chartId}-title`}
          fill="none"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <title id={`${chartId}-title`}>{title}</title>
          <desc id={`${chartId}-description`}>
            Local coordinate plot showing {formatCount(points.length, "record")}{" "}
            with usable latitude and longitude values. This view does not use
            geocoding, basemap tiles, or boundary geometry.
          </desc>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const x = padding.left + ratio * plotWidth;
            const y = padding.top + ratio * plotHeight;
            return (
              <g key={ratio}>
                <line
                  className="chart-grid-line"
                  x1={x}
                  x2={x}
                  y1={padding.top}
                  y2={height - padding.bottom}
                />
                <line
                  className="chart-grid-line"
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                />
              </g>
            );
          })}
          <rect
            className="map-frame"
            height={plotHeight}
            width={plotWidth}
            x={padding.left}
            y={padding.top}
          />
          {coords.map((point, index) => (
            <g
              aria-label={`${point.label}: latitude ${formatNumber(point.latitude)}, longitude ${formatNumber(point.longitude)}${point.metricValue === undefined ? "" : `, ${metricLabel} ${formatNumber(point.metricValue)}`}.`}
              className="map-point"
              key={`${point.latitude}-${point.longitude}-${index}`}
              onBlur={() => setActiveIndex(undefined)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(undefined)}
              tabIndex={chartTabIndex}
            >
              <circle
                cx={point.cx}
                cy={point.cy}
                fill={activeIndex === index ? "var(--chart-accent)" : "var(--chart-primary)"}
                fillOpacity={activeIndex === index ? "0.94" : "0.64"}
                r={activeIndex === index ? point.radius + 2 : point.radius}
                stroke="#ffffff"
                strokeWidth={activeIndex === index ? 3 : 2}
              />
              <title>
                {point.label}: {formatNumber(point.latitude)},{" "}
                {formatNumber(point.longitude)}
                {point.metricValue === undefined
                  ? ""
                  : `; ${metricLabel}: ${formatNumber(point.metricValue)}`}
              </title>
            </g>
          ))}
          <text
            className="chart-axis-label"
            textAnchor="middle"
            x={padding.left + plotWidth / 2}
            y={height - 12}
          >
            Longitude {formatNumber(lonMin)} to {formatNumber(lonMax)}
          </text>
          <text
            className="chart-axis-label"
            textAnchor="start"
            x={padding.left}
            y={padding.top - 8}
          >
            Latitude {formatNumber(latMin)} to {formatNumber(latMax)}
          </text>
        </svg>
        {activePoint && (
          <div
            className="chart-tooltip line-tooltip"
            style={{
              left: `${(activePoint.cx / width) * 100}%`,
              top: `${(activePoint.cy / height) * 100}%`,
            }}
          >
            <strong>{activePoint.label}</strong>
            <span>Lat: {formatNumber(activePoint.latitude)}</span>
            <span>Lon: {formatNumber(activePoint.longitude)}</span>
            {activePoint.metricValue !== undefined && (
              <span>
                {metricLabel}: {formatNumber(activePoint.metricValue)}
              </span>
            )}
          </div>
        )}
      </div>
      <p className="chart-note">
        Local coordinate view only. It does not verify boundaries, routes, or
        administrative coverage.
      </p>
    </div>
  );
}

function AreaIntensityChart({
  grouped,
  groupLabel,
  interactive = true,
  maxCategories = 12,
  metricLabel,
  title,
}: {
  grouped: GroupedMetricValue[];
  groupLabel: string;
  interactive?: boolean;
  maxCategories?: number;
  metricLabel: string;
  title: string;
}) {
  const visible = grouped.slice(0, maxCategories);
  const max = Math.max(...visible.map((item) => item.value), 1);
  const chartTabIndex = interactive ? 0 : -1;
  if (visible.length === 0) {
    return (
      <div className="mini-empty">
        No administrative area values were found for this view.
      </div>
    );
  }
  return (
    <div
      aria-label={`${title}. ${metricLabel} across ${groupLabel}.`}
      className="area-intensity-chart"
      role="list"
    >
      {visible.map((item) => {
        const intensity = Math.max(0.14, Math.min(0.82, item.value / max));
        const description = chartValueDescription(item, metricLabel);
        return (
          <div
            aria-label={description}
            className="area-tile chart-mark"
            data-tooltip={description}
            key={item.label}
            role="listitem"
            style={{
              backgroundColor: `rgba(0, 90, 181, ${intensity})`,
              borderColor:
                intensity > 0.45
                  ? "rgba(0, 67, 135, 0.62)"
                  : "var(--blue-border-alt)",
              color: intensity > 0.45 ? "white" : "var(--color-text-primary)",
            }}
            tabIndex={chartTabIndex}
          >
            <span title={item.label}>{item.label}</span>
            <strong>{formatNumber(item.value)}</strong>
            <small>{formatCount(item.count, "record")}</small>
          </div>
        );
      })}
      <p className="chart-note">
        Area intensity uses uploaded area labels only. Add verified local
        boundary geometry before treating this as a choropleth map.
      </p>
    </div>
  );
}

function MissingnessChart({
  dataset,
  interactive = true,
  title,
}: {
  dataset: Dataset;
  interactive?: boolean;
  title: string;
}) {
  const chartTabIndex = interactive ? 0 : -1;
  const totalRows =
    dataset.profile?.rowCount ?? dataset.rowCount ?? dataset.data?.length ?? 0;
  const columns = (dataset.profile?.columns ?? [])
    .filter((column) => column.missingCount > 0)
    .sort((a, b) => b.missingCount - a.missingCount)
    .slice(0, 10);
  if (columns.length === 0 || totalRows === 0) {
    return <div className="mini-empty">No missing values were detected.</div>;
  }
  const maxMissing = Math.max(
    ...columns.map((column) => column.missingCount),
    1,
  );

  return (
    <div
      aria-label={`${title}. Missing values across ${formatCount(columns.length, "column")}.`}
      className="missingness-chart"
      role="list"
    >
      {columns.map((column) => {
        const percent =
          Math.round((column.missingCount / totalRows) * 1000) / 10;
        const label = fieldDisplayLabel(column.columnName);
        const description = `${label}: ${formatCount(column.missingCount, "missing value")} (${percent}%).`;
        return (
          <div
            aria-label={description}
            className="missingness-row chart-mark"
            data-tooltip={description}
            key={column.columnName}
            role="listitem"
            tabIndex={chartTabIndex}
          >
            <span title={column.columnName}>{label}</span>
            <div className="bar-track">
              <div
                className="missingness-bar"
                style={{
                  width: `${Math.max(8, (column.missingCount / maxMissing) * 100)}%`,
                }}
              >
                {percent}%
              </div>
            </div>
          </div>
        );
      })}
      <p>{formatCount(totalRows, "row")} checked for missing values.</p>
    </div>
  );
}

function SummaryChart({
  dataset,
  groupField,
  interactive = true,
  metricField,
  aggregation,
}: {
  dataset: Dataset;
  groupField?: string;
  interactive?: boolean;
  metricField?: string;
  aggregation?: MetricAggregation;
}) {
  const chartTabIndex = interactive ? 0 : -1;
  const rows = dataset.data ?? [];
  const resolvedAggregation =
    aggregation ?? inferMetricAggregation(metricField);
  const metricTotal = metricField
    ? aggregateField(rows, metricField, resolvedAggregation)
    : rows.length;
  const metricAverage =
    metricField && resolvedAggregation !== "average" && rows.length > 0
      ? aggregateField(rows, metricField, "average")
      : undefined;
  const uniqueGroups = groupField
    ? new Set(rows.map((row) => String(row[groupField] ?? "Missing"))).size
    : undefined;
  const missingCells = dataset.profile?.columns.reduce(
    (sum, column) => sum + column.missingCount,
    0,
  );

  return (
    <div
      className="summary-chart-grid"
      role="list"
      aria-label="Summary metrics"
    >
      <div
        aria-label={`${
          metricField
            ? metricDisplayLabel(metricField, resolvedAggregation)
            : "Records"
        }: ${formatNumber(metricTotal)}`}
        className="chart-mark"
        data-tooltip={`${
          metricField
            ? metricDisplayLabel(metricField, resolvedAggregation)
            : "Records"
        }: ${formatNumber(metricTotal)}`}
        role="listitem"
        tabIndex={chartTabIndex}
      >
        <span>
          {metricField
            ? metricDisplayLabel(metricField, resolvedAggregation)
            : "Records"}
        </span>
        <strong>{formatNumber(metricTotal)}</strong>
      </div>
      {metricAverage !== undefined && (
        <div
          aria-label={`${metricDisplayLabel(metricField, "average")}: ${formatNumber(metricAverage)}`}
          className="chart-mark"
          data-tooltip={`${metricDisplayLabel(metricField, "average")}: ${formatNumber(metricAverage)}`}
          role="listitem"
          tabIndex={chartTabIndex}
        >
          <span>{metricDisplayLabel(metricField, "average")}</span>
          <strong>{formatNumber(metricAverage)}</strong>
        </div>
      )}
      {uniqueGroups !== undefined && (
        <div
          aria-label={`${fieldDisplayLabel(groupField)}: ${formatNumber(uniqueGroups)}`}
          className="chart-mark"
          data-tooltip={`${fieldDisplayLabel(groupField)}: ${formatNumber(uniqueGroups)}`}
          role="listitem"
          tabIndex={chartTabIndex}
        >
          <span>{fieldDisplayLabel(groupField)}</span>
          <strong>{uniqueGroups}</strong>
        </div>
      )}
      {missingCells !== undefined && (
        <div
          aria-label={`Missing cells: ${formatNumber(missingCells)}`}
          className="chart-mark"
          data-tooltip={`Missing cells: ${formatNumber(missingCells)}`}
          role="listitem"
          tabIndex={chartTabIndex}
        >
          <span>Missing cells</span>
          <strong>{missingCells}</strong>
        </div>
      )}
    </div>
  );
}

function RankedTable({
  dataset,
  chart,
}: {
  dataset: Dataset;
  chart: DashboardRecommendation["charts"][number];
}) {
  const rows = dataset.data ?? [];
  const metricField = chart.metricField ?? chart.yField;
  const preferredColumns = [
    chart.groupByField,
    chart.xField,
    metricField,
    ...(dataset.columns ?? []),
  ].filter((field): field is string => Boolean(field));
  const columns = Array.from(new Set(preferredColumns)).slice(0, 5);
  const rowLimit = chartCategoryLimit(chart) ?? 6;
  const rankedRows = sortRowsByChartPolicy(rows, chart, metricField).slice(
    0,
    rowLimit,
  );

  if (columns.length === 0 || rankedRows.length === 0) {
    return <DatasetPreview dataset={dataset} />;
  }

  return (
    <div className="table-wrap compact-table">
      <table aria-label={chart.title}>
        <caption className="sr-only">{chart.title}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} title={column}>
                {fieldDisplayLabel(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rankedRows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column}>{String(row[column] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualityPanel({
  quality,
  defaultOpen = false,
}: {
  quality: QualityCheckResult[];
  defaultOpen?: boolean;
}) {
  const actionable = quality.filter((issue) => issue.status !== "pass");
  return (
    <details
      className="card full-width profile-accordion quality-panel"
      open={defaultOpen || undefined}
    >
      <summary>
        <span>Data quality checks</span>
        <span className="accordion-meta">
          {actionable.length === 0
            ? "No automated flags"
            : `${actionable.length} flagged`}
        </span>
      </summary>
      <div className="accordion-content">
        {actionable.length === 0 ? (
          <div className="quality-empty">
            <strong>No automated quality flags</strong>
            <p>Reviewer judgment is still required before operational use.</p>
          </div>
        ) : null}
        {actionable.length > 0
          ? actionable.slice(0, 6).map((issue) => (
              <div className={`quality ${issue.severity}`} key={issue.id}>
                <strong>
                  {issue.status.toUpperCase()}: {issue.checkType}
                </strong>
                <p>{issue.description}</p>
                {issue.affectedColumns?.length ? (
                  <p>
                    Affected fields: {renderInlineCodeList(issue.affectedColumns)}.
                  </p>
                ) : null}
                {issue.suggestedAction ? (
                  <p>Suggested review: {issue.suggestedAction}</p>
                ) : null}
              </div>
            ))
          : null}
      </div>
    </details>
  );
}

function renderInlineCodeList(values: string[]) {
  return values.map((value, index) => (
    <span key={`${value}-${index}`}>
      {index > 0 ? ", " : ""}
      <code className="inline-code">{value}</code>
    </span>
  ));
}

function MetadataPanel({ datasets }: { datasets: Dataset[] }) {
  const totalRows = datasets.reduce(
    (sum, dataset) =>
      sum + (dataset.profile?.rowCount ?? dataset.rowCount ?? 0),
    0,
  );
  const totalColumns = datasets.reduce(
    (sum, dataset) =>
      sum + (dataset.profile?.columnCount ?? dataset.columnCount ?? 0),
    0,
  );
  const joinFields = uniqueValues(
    datasets.flatMap((dataset) => dataset.profile?.potentialJoinFields ?? []),
  );
  const locationFields = uniqueValues(
    datasets.flatMap(
      (dataset) => dataset.profile?.potentialGeographicFields ?? [],
    ),
  );
  const metricFields = uniqueValues(
    datasets.flatMap((dataset) => dataset.profile?.potentialMetricFields ?? []),
  );

  return (
    <details className="card full-width profile-accordion">
      <summary>
        <span>Metadata and assumptions</span>
        <span className="accordion-meta">
          {datasets.length} source{datasets.length === 1 ? "" : "s"}
        </span>
      </summary>
      <div className="accordion-content">
        <ul className="labeled-list metadata-list">
          <li>
            <strong>Sources</strong>
            <span>
              {datasets.length} source dataset{datasets.length === 1 ? "" : "s"}{" "}
              profiled. Rows: {totalRows.toLocaleString()}. Columns:{" "}
              {totalColumns.toLocaleString()}.
            </span>
          </li>
          <li>
            <strong>Detected fields</strong>
            <span>
              {formatFieldList(joinFields)} {formatFieldList(locationFields)}{" "}
              {formatFieldList(metricFields)}
            </span>
          </li>
          <li>
            <strong>Inference assumptions</strong>
            <span>
              Field types and dashboard roles are inferred from parsed values,
              column names, and sample rows.
            </span>
          </li>
          <li>
            <strong>Session storage</strong>
            <span>Uploaded data is held in browser session memory only.</span>
          </li>
        </ul>
      </div>
    </details>
  );
}

function buildProfileQualityResults(datasets: Dataset[], decisionBrief?: DecisionBrief) {
  return datasets
    .flatMap((dataset) =>
      runQualityChecks(dataset, decisionBrief).map((issue) => ({
        ...issue,
        id: `${dataset.id}-${issue.id}`,
        description: `${dataset.name}: ${issue.description}`,
      })),
    )
    .sort(
      (a, b) =>
        qualitySeverityRank(b.severity) - qualitySeverityRank(a.severity),
    );
}

function qualitySeverityRank(severity: QualityCheckResult["severity"]) {
  return { info: 0, low: 1, medium: 2, high: 3 }[severity];
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function chartCategoryLimit(chart: DashboardRecommendation["charts"][number]) {
  if (chart.maxCategories && chart.maxCategories > 0) return chart.maxCategories;
  if (chart.mobileBehavior === "top5") return 5;
  return undefined;
}

function sortRowsByChartPolicy(
  rows: Record<string, unknown>[],
  chart: DashboardRecommendation["charts"][number],
  metricField?: string,
) {
  const labelField = chart.groupByField ?? chart.xField;
  const values = rows.slice();
  if (
    (chart.sortBy === "label_asc" || chart.sortBy === "time_asc") &&
    labelField
  ) {
    return values.sort((first, second) =>
      compareChartLabelStrings(
        String(first[labelField] ?? ""),
        String(second[labelField] ?? ""),
      ),
    );
  }
  if (metricField) {
    return values.sort(
      (first, second) =>
        toNumber(second[metricField]) - toNumber(first[metricField]),
    );
  }
  return values;
}

function compareChartLabels(
  first: GroupedMetricValue,
  second: GroupedMetricValue,
) {
  return compareChartLabelStrings(first.label, second.label);
}

function compareChartLabelStrings(firstLabel: string, secondLabel: string) {
  const firstDate = parseSortableDate(firstLabel);
  const secondDate = parseSortableDate(secondLabel);
  if (firstDate !== undefined && secondDate !== undefined) {
    return firstDate - secondDate;
  }

  const firstNumber = Number(firstLabel);
  const secondNumber = Number(secondLabel);
  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
    return firstNumber - secondNumber;
  }

  return firstLabel.localeCompare(secondLabel, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function parseSortableDate(label: string) {
  if (
    !/[/-]|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/i.test(
      label,
    )
  ) {
    return undefined;
  }
  const parsed = Date.parse(label);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function chartValueDescription(
  item: Pick<GroupedMetricValue, "aggregation" | "count" | "label" | "value">,
  metricLabel: string,
  total?: number,
) {
  const percentage =
    total && total > 0
      ? `, ${Math.round((item.value / total) * 100)}% of total`
      : "";
  const recordContext =
    item.aggregation === "average"
      ? ` across ${formatCount(item.count, "record")}`
      : "";
  return `${item.label}: ${formatNumber(item.value)} ${metricLabel}${recordContext}${percentage}.`;
}

function finiteChartNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  return undefined;
}

function chartTickValues(min: number, max: number, count: number) {
  if (count <= 1) return [min, max];
  const step = (max - min) / (count - 1 || 1);
  return Array.from(
    { length: count },
    (_, index) => Math.round((min + step * index) * 100) / 100,
  );
}

function chartLabelIndexes(length: number, maxLabels: number) {
  if (length <= maxLabels) {
    return Array.from({ length }, (_, index) => index);
  }
  const indexes = new Set<number>();
  const last = length - 1;
  for (let index = 0; index < maxLabels; index += 1) {
    indexes.add(Math.round((index / (maxLabels - 1)) * last));
  }
  return Array.from(indexes).sort((a, b) => a - b);
}

function formatAxisNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
  }).format(value);
}

function truncateChartLabel(label: string, maxLength = 14) {
  return label.length > maxLength
    ? `${label.slice(0, maxLength - 1)}...`
    : label;
}

function DatasetPreview({
  dataset,
  title = "Sample data",
  defaultOpen = false,
  rowLimit = 10,
  columnLimit = 12,
}: {
  dataset: Dataset;
  title?: string;
  defaultOpen?: boolean;
  rowLimit?: number;
  columnLimit?: number;
}) {
  const allRows = dataset.data ?? dataset.sampleRows ?? [];
  const rows = allRows.slice(0, rowLimit);
  const columns = uniqueValues([
    ...(dataset.columns ?? []),
    ...Object.keys(rows[0] ?? {}),
  ]);
  const visibleColumns = selectVisiblePreviewColumns(
    prioritizePreviewColumns(dataset, columns),
    columnLimit,
  );
  const totalRowCount = dataset.rowCount ?? allRows.length;
  const hiddenColumnCount = Math.max(columns.length - visibleColumns.length, 0);
  const hiddenRowCount = Math.max(totalRowCount - rows.length, 0);
  return (
    <details className="dataset-preview-panel sample-data-card" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        <span className="accordion-meta">
          {formatCount(totalRowCount, "row")},{" "}
          {formatCount(columns.length, "column")}
        </span>
      </summary>
      <div className="accordion-content">
        {columns.length === 0 ? (
          <div className="mini-empty">No preview rows available.</div>
        ) : (
          <>
            <p>
              Showing {formatCount(rows.length, "row")} and{" "}
              {formatCount(visibleColumns.length, "column")}
              {hiddenRowCount > 0
                ? `, with ${formatCount(hiddenRowCount, "additional row")} available in exports`
                : ""}
              {hiddenColumnCount > 0
                ? `${hiddenRowCount > 0 ? " and" : ", with"} ${formatCount(hiddenColumnCount, "additional column")} available in exports.`
                : "."}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {visibleColumns.map((column) => (
                      <th key={column} title={column}>
                        {fieldDisplayLabel(column)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index}>
                      {visibleColumns.map((column) => (
                        <td key={column}>{String(row[column] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </details>
  );
}

function prioritizePreviewColumns(dataset: Dataset, columns: string[]) {
  const preferredColumns = [
    dataset.inputHints?.joinField,
    ...(dataset.profile?.potentialJoinFields ?? []),
    dataset.inputHints?.primaryField,
    dataset.inputHints?.timeField,
    "__join_matched",
    ...(dataset.profile?.potentialGeographicFields ?? []),
    ...(dataset.profile?.potentialMetricFields ?? []),
    ...columns,
  ];
  return uniqueValues(preferredColumns.filter((column): column is string => Boolean(column)))
    .filter((column) => columns.includes(column));
}

function selectVisiblePreviewColumns(columns: string[], limit: number) {
  if (columns.length <= limit) return columns;
  const tailCount = Math.min(3, Math.floor(limit / 4));
  const headCount = Math.max(limit - tailCount, 1);
  return uniqueValues([
    ...columns.slice(0, headCount),
    ...columns.slice(-tailCount),
  ]).slice(0, limit);
}

export function TransformationLogPanel({
  log,
}: {
  log: TransformationStep[];
}) {
  return (
    <section className="transformation-log-panel">
      <p className="eyebrow">Harmonization</p>
      <h2>Transformation Log</h2>
      <div className="log-list">
        {log.length === 0 ? (
          <div className="mini-empty">
            No data transformations were recorded.
          </div>
        ) : (
          log
            .slice()
            .reverse()
            .map((step) => (
              <article key={step.id} className="log-item">
                <strong>{step.stepType.replaceAll("_", " ")}</strong>
                <p>{step.description}</p>
                <details>
                  <summary>Details</summary>
                  <dl className="log-details">
                    <dt>Time</dt>
                    <dd>{new Date(step.timestamp).toLocaleString()}</dd>
                    {step.inputs?.length ? (
                      <>
                        <dt>Inputs</dt>
                        <dd>{step.inputs.join(", ")}</dd>
                      </>
                    ) : null}
                    {step.outputs?.length ? (
                      <>
                        <dt>Outputs</dt>
                        <dd>{step.outputs.join(", ")}</dd>
                      </>
                    ) : null}
                    {step.affectedColumns?.length ? (
                      <>
                        <dt>Columns</dt>
                        <dd>{step.affectedColumns.join(", ")}</dd>
                      </>
                    ) : null}
                    {step.operations?.length ? (
                      <>
                        <dt>Operations</dt>
                        <dd>
                          {step.operations
                            .map(
                              (operation) =>
                                `${cleaningTransformLabel(operation.type)}: ${operation.changedCells} changed of ${operation.scannedCells} checked cell${operation.scannedCells === 1 ? "" : "s"}`,
                            )
                            .join("; ")}
                        </dd>
                      </>
                    ) : null}
                    {step.assumptions?.length ? (
                      <>
                        <dt>Assumptions</dt>
                        <dd>{step.assumptions.join(" ")}</dd>
                      </>
                    ) : null}
                  </dl>
                </details>
              </article>
            ))
        )}
      </div>
    </section>
  );
}

export function ExportStep({
  ready,
  dashboardReady,
  logReady,
  rowCount,
  chartCount,
  qualityIssueCount,
  decisionReadiness,
  handoffSummary,
  handoffLoading = false,
  transformationCount,
  onCsv,
  onHandoffSummary,
  onReport,
  onPng,
  onLog,
  onProjectKit,
}: {
  ready: boolean;
  dashboardReady: boolean;
  logReady: boolean;
  rowCount: number;
  chartCount: number;
  qualityIssueCount: number;
  decisionReadiness?: DecisionReadinessResult;
  handoffSummary?: DecisionHandoffSummary;
  handoffLoading?: boolean;
  transformationCount: number;
  onCsv: () => void;
  onHandoffSummary: () => void;
  onReport: () => void;
  onPng: () => void;
  onLog: () => void;
  onProjectKit: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const needsAcknowledgement =
    decisionReadiness !== undefined && decisionReadiness.status !== "ready";
  const exportReady = !needsAcknowledgement || acknowledged;
  return (
    <section className="workflow-step export-page">
      <div className="section-heading">
        <p className="eyebrow">Step 7</p>
        <h2>Export Review Artifacts</h2>
      </div>
      <DecisionReadinessPanel readiness={decisionReadiness} />
      {needsAcknowledgement ? (
        <label className="export-acknowledgement">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          <span>I reviewed the decision-readiness caveats before exporting.</span>
        </label>
      ) : null}
      <article className="card handoff-copilot-card">
        <div>
          <p className="eyebrow">Decision handoff summary</p>
          <h3>Review summary</h3>
          <p>
            Generate a review-ready narrative from readiness, quality, transformation, and dashboard facts.
          </p>
        </div>
        <button
          type="button"
          className="primary-action"
          disabled={!dashboardReady || !exportReady || handoffLoading}
          onClick={onHandoffSummary}
        >
          {handoffLoading ? "Generating handoff..." : "Generate handoff summary"}
        </button>
        {handoffSummary ? (
          <HandoffSummaryPanel summary={handoffSummary} />
        ) : null}
      </article>
      <article className="card export-options-card">
        <div className="export-options-header">
          <p className="eyebrow">Review-only exports</p>
        </div>
        <div className="export-grid">
          <button className="export-option" disabled={!ready || !exportReady} onClick={onCsv}>
            <span className="export-option-type">CSV</span>
            <span className="export-option-label">Review dataset</span>
            <span className="export-option-meta">
              Downloads the harmonized rows used to generate the dashboard.
              Review caveats before sharing or acting.
            </span>
            <span className="export-option-detail">
              {formatCount(rowCount, "row")} prepared for analysis.
            </span>
          </button>
          <button
            className="export-option"
            disabled={!logReady || !exportReady}
            onClick={onLog}
          >
            <span className="export-option-type">JSON</span>
            <span className="export-option-label">Decision review log</span>
            <span className="export-option-meta">
              Includes evidence coverage, join review, quality caveats, and
              transformation history.
            </span>
            <span className="export-option-detail">
              {transformationCount > 0
                ? `${formatCount(transformationCount, "recorded step")} available.`
                : "No transformation steps were recorded."}
            </span>
          </button>
          <button
            className="export-option"
            disabled={!dashboardReady || !ready || !exportReady}
            onClick={onProjectKit}
          >
            <span className="export-option-type">KIT</span>
            <span className="export-option-label">Review project kit</span>
            <span className="export-option-meta">
              Downloads a JSON kit with README text, prepared CSV, schema, chart config, and review log.
            </span>
            <span className="export-option-detail">
              Built for second-pass review without saving data in the app.
            </span>
          </button>
          <button
            className="export-option"
            disabled={!dashboardReady || !exportReady}
            onClick={onPng}
          >
            <span className="export-option-type">PNG</span>
            <span className="export-option-label">Review dashboard image</span>
            <span className="export-option-meta">
              Captures the full generated dashboard as a static image with caveats retained.
            </span>
            <span className="export-option-detail">
              {formatCount(chartCount, "chart")} with review prompts
              expanded.
            </span>
          </button>
          <button
            className="export-option"
            disabled={!dashboardReady || !exportReady}
            onClick={onReport}
          >
            <span className="export-option-type">PDF</span>
            <span className="export-option-label">Review dashboard report</span>
            <span className="export-option-meta">
              Packages the dashboard, quality checks, and transformation summary
              for review.
            </span>
            <span className="export-option-detail">
              Includes {formatCount(qualityIssueCount, "quality issue")} and{" "}
              {formatCount(transformationCount, "transformation")}.
            </span>
          </button>
        </div>
      </article>
    </section>
  );
}

function HandoffSummaryPanel({ summary }: { summary: DecisionHandoffSummary }) {
  return (
    <section className="handoff-summary-panel" aria-label="Generated handoff summary">
      <div className="handoff-summary-header">
        <span className={`quality-pill ${summary.source === "llm" ? "success" : "warn"}`}>
          {summary.source === "llm" ? "AI drafted" : "Deterministic fallback"}
        </span>
        {summary.fallbackReason ? (
          <span className="helper-text">
            Fallback reason: {summary.fallbackReason.replaceAll("_", " ")}
          </span>
        ) : null}
      </div>
      <div className="handoff-summary-grid">
        <article>
          <h4>Readiness</h4>
          <p>{summary.readinessExplanation}</p>
        </article>
        <article>
          <h4>Handoff narrative</h4>
          <p>{summary.handoffNarrative}</p>
        </article>
      </div>
      {summary.repairActions.length > 0 ? (
        <div>
          <h4>Repair priorities</h4>
          <ul className="handoff-action-list">
            {summary.repairActions.map((action) => (
              <li key={`${action.priority}-${action.title}`}>
                <strong>{action.title}</strong>
                <span>{action.rationale}</span>
                <small>
                  {action.priority} priority - {action.ownerHint}
                </small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {summary.caveats.length > 0 ? (
        <div>
          <h4>Caveats retained</h4>
          <ul className="compact-list">
            {summary.caveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {summary.assumptions.length > 0 ? (
        <p className="helper-text">{summary.assumptions.join(" ")}</p>
      ) : null}
    </section>
  );
}

export function LandingHero({
  loading = false,
  llmEnabled,
  llmAvailable = true,
  onLlmEnabledChange,
  showLlmToggle = true,
  usageSlot,
  ctaSlot,
}: {
  loading?: boolean;
  llmEnabled: boolean;
  llmAvailable?: boolean;
  onLlmEnabledChange: (enabled: boolean) => void;
  showLlmToggle?: boolean;
  usageSlot?: ReactNode;
  ctaSlot?: ReactNode;
}) {
  return (
    <header className={`app-header${loading ? " loading" : ""}`}>
      <div className="app-header-inner">
        <div className="header-brand">
          <h1>Dashboard Copilot</h1>
          <a className="header-nav-link" href="/about">
            About
          </a>
          <a className="header-nav-link" href="/progress">
            Progress
          </a>
        </div>
        <div className="header-actions">
          <div className="header-status-slot">
            {loading && <LoadingStatus />}
          </div>
          {usageSlot}
          {ctaSlot}
          {showLlmToggle !== false ? (
            <label className="llm-toggle">
              <input
                type="checkbox"
                checked={llmEnabled}
                disabled={!llmAvailable}
                onChange={(event) => onLlmEnabledChange(event.target.checked)}
              />
              <span className="llm-toggle-copy">
                <span>AI</span>
                <strong>{llmEnabled ? "On" : "Off"}</strong>
              </span>
              <span className="llm-toggle-track" aria-hidden="true">
                <span className="llm-toggle-thumb" />
              </span>
            </label>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function formatNumber(value: number) {
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatPercentage(value: number) {
  return `${formatNumber(value)}%`;
}

function formatCount(count: number, noun: string) {
  return `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;
}
