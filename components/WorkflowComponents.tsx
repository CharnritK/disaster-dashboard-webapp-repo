"use client";

import { useId, useState } from "react";
import type { Dataset } from "@/types/dataset";
import type {
  AIRecommendationResponse,
  CleaningRecommendation,
  DashboardRecommendation,
  JoinRecommendation,
  MetricAggregation,
} from "@/types/recommendations";
import type { QualityCheckResult } from "@/types/quality";
import type { TransformationStep } from "@/types/transformations";
import {
  MAX_UPLOAD_SIZE_MB,
  SUPPORTED_FILE_TYPES,
  WORKFLOW_STEPS,
  type WorkflowStep,
} from "@/lib/config";
import { runQualityChecks } from "@/lib/validation";
import {
  aggregateField,
  aggregateRows,
  fieldDisplayLabel,
  inferMetricAggregation,
  metricDisplayLabel,
  toNumber,
  type GroupedMetricValue,
} from "@/lib/chartMetrics";
import { cleaningTransformLabel } from "@/lib/cleaningTransforms";

const STEP_LABELS: Record<WorkflowStep, string> = {
  upload: "Upload",
  profile: "Profile",
  recommend: "Harmonize",
  validate: "Dataset",
  dashboard: "Dashboard",
  export: "Export",
};

const CHART_PALETTE = [
  "#005ab5",
  "#d55e00",
  "#009e73",
  "#7b3294",
  "#b35c00",
  "#4b5563",
];

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
        const canNavigate = canNavigateTo(step) && !isCurrent;
        return (
          <button
            type="button"
            className={["step", stateClass].filter(Boolean).join(" ")}
            key={step}
            aria-current={isCurrent ? "step" : undefined}
            disabled={!canNavigate}
            onClick={() => onNavigate(step)}
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

export function UploadStep({
  datasets,
  onProfile,
  onFiles,
  onSamples,
  onRemoveDataset,
}: {
  datasets: Dataset[];
  onProfile: () => void;
  onFiles: (files: FileList | null) => void;
  onSamples: (kind: "single" | "multi") => void;
  onRemoveDataset: (datasetId: string) => void;
}) {
  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Step 1</p>
        <h2>Upload Data</h2>
      </div>
      <div className="sensitive-data-note" role="note">
        <strong>Carefully consider data sources</strong>
        <p>
          Do not upload sensitive personal, medical, financial, or restricted
          data. When AI recommendations are <em>on</em>, dataset details and
          sample values may be sent to the configured LLM provider.
        </p>
      </div>
      {datasets.length === 0 ? (
        <div className="empty-state upload-empty">
          <h3>Add data to begin</h3>
          <p>
            {SUPPORTED_FILE_TYPES.map((type) => type.toUpperCase()).join(
              " or ",
            )}{" "}
            files, up to {MAX_UPLOAD_SIZE_MB}MB each.
          </p>
          <div className="action-row">
            <label className="primary-action compact">
              Upload files
              <input
                type="file"
                multiple
                accept=".csv,.xlsx"
                onChange={(event) => onFiles(event.target.files)}
              />
            </label>
            <button onClick={() => onSamples("multi")}>Use sample data</button>
          </div>
        </div>
      ) : (
        <>
          <div className="action-row toolbar-row">
            <label className="primary-action compact">
              Upload files
              <input
                type="file"
                multiple
                accept=".csv,.xlsx"
                onChange={(event) => onFiles(event.target.files)}
              />
            </label>
            <button onClick={() => onSamples("multi")}>
              Replace with sample data
            </button>
          </div>
          <div className="dataset-grid">
            {datasets.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onRemove={() => onRemoveDataset(dataset.id)}
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

export function ProfileStep({
  datasets,
  isWorking = false,
  onRecommend,
}: {
  datasets: Dataset[];
  isWorking?: boolean;
  onRecommend: () => void;
}) {
  const quality = buildProfileQualityResults(datasets);
  const highlightTerms = datasetTextTerms(datasets);
  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Step 2</p>
        <h2>Review Data Profiling</h2>
      </div>
      <div className="dataset-grid">
        {datasets.map((dataset) => (
          <ProfileCard key={dataset.id} dataset={dataset} />
        ))}
      </div>
      <QualityPanel quality={quality} highlightTerms={highlightTerms} />
      <MetadataPanel datasets={datasets} />
      <button
        className="primary-button next-action"
        disabled={isWorking}
        onClick={onRecommend}
      >
        {isWorking ? "Generating recommendations..." : "Harmonize data"}
      </button>
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
        <summary>Recommendations</summary>
        <ul className="labeled-list profile-recommendations">
          <li>
            <strong>Recommended join fields</strong>
            <span>{formatFieldList(profile?.potentialJoinFields)}</span>
          </li>
          <li>
            <strong>Recommended metrics</strong>
            <span>{formatFieldList(profile?.potentialMetricFields)}</span>
          </li>
          <li>
            <strong>Recommended groupings</strong>
            <span>
              {formatFieldList([
                ...(profile?.potentialGeographicFields ?? []),
                ...(profile?.potentialDemographicFields ?? []),
              ])}
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
                  <td>{column.sampleValues.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DatasetPreview dataset={dataset} />
      </details>
    </article>
  );
}

function formatFieldList(fields?: string[]) {
  return fields?.length
    ? fields.map((field) => fieldDisplayLabel(field)).join(", ")
    : "none detected";
}

function DatasetCard({
  dataset,
  onRemove,
}: {
  dataset: Dataset;
  onRemove: () => void;
}) {
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
    </article>
  );
}

export function RecommendationStep({
  recommendations,
  joins = [],
  datasets,
  cleaningRecommendations,
  onAccept,
}: {
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
  const highlightTerms = datasetTextTerms(datasets);

  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Step 3</p>
        <h2>Harmonize Data</h2>
      </div>
      <div className="recommendation-card">
        <p className="eyebrow">Recommended</p>
        <h2>{recommendations.recommendedPath.title}</h2>
        <p>{renderInlineCodeText(recommendations.summary, highlightTerms)}</p>
        <div className="why-box">
          <strong>Why:</strong>{" "}
          {renderInlineCodeText(
            recommendations.recommendedPath.rationale,
            highlightTerms,
          )}
        </div>
        <div className="action-row">
          <button className="primary-button" onClick={() => onAccept(joins)}>
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
          <h3>Join adjustment</h3>
          <p>Change the join field or join type.</p>
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
          <div className="action-row">
            <button
              className="primary-button"
              onClick={() => adjustedJoin && onAccept([adjustedJoin])}
            >
              Accept adjusted join
            </button>
          </div>
        </article>
      )}
      {hasJoinPlan && <JoinReviewCard joins={joins} datasets={datasets} />}
      <CleaningRecommendationsPanel
        recommendations={cleaningRecommendations}
        highlightTerms={highlightTerms}
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
  const terms = Array.from(
    new Set([
      ...datasetTextTerms(datasets),
      ...joins.flatMap((join) => [...join.sourceColumns, ...join.targetColumns]),
    ]),
  );
  return (
    <details className="card profile-accordion">
      <summary>
        <span>{joins.length === 1 ? "Review join recommendation" : "Review join plan"}</span>
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
                <p>{renderInlineCodeText(join.rationale, terms)}</p>
                {join.risks.length > 0 && (
                  <p>
                    Risk: {renderInlineCodeText(join.risks.join(" "), terms)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </details>
  );
}

export function ValidationStep({
  dataset,
  joins,
  quality,
  transformationLog,
  isWorking = false,
  onProceed,
}: {
  dataset: Dataset;
  joins?: JoinRecommendation[];
  quality: QualityCheckResult[];
  transformationLog: TransformationStep[];
  isWorking?: boolean;
  onProceed: () => void;
}) {
  const blocking = quality.filter((issue) => issue.status === "fail");
  const logHighlightTerms = [
    ...datasetTextTerms([dataset]),
    ...transformationTextTerms(transformationLog),
  ];
  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Step 4</p>
        <h2>{joins?.length ? "Review Joined Dataset" : "Review Prepared Dataset"}</h2>
      </div>
      <article className="recommendation-card">
        <p className="eyebrow">Recommended</p>
        <h2>
          {blocking.length > 0
            ? "Proceed After Reviewing High-severity Issues"
            : "Proceed With Dashboard Generation"}
        </h2>
        <p>
          {blocking.length > 0
            ? `${blocking.length} high-severity issue${blocking.length === 1 ? "" : "s"} were identified during profiling.`
            : "No blocking quality issues were found."}
        </p>
        <div className="action-row">
          <button
            className="primary-button"
            disabled={isWorking}
            onClick={onProceed}
          >
            {isWorking ? "Generating..." : "Generate dashboard"}
          </button>
        </div>
      </article>
      <DatasetPreview dataset={dataset} />
      <TransformationLogPanel
        highlightTerms={logHighlightTerms}
        log={transformationLog}
      />
    </section>
  );
}

function CleaningRecommendationsPanel({
  highlightTerms = [],
  recommendations,
}: {
  highlightTerms?: string[];
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
              {renderInlineCodeText(recommendation.suggestedAction, [
                ...highlightTerms,
                ...recommendation.affectedColumns,
                ...recommendation.transform.columns,
              ])}
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
  recommendation,
  onExport,
}: {
  refNode: React.RefObject<HTMLDivElement | null>;
  dataset: Dataset;
  recommendation: DashboardRecommendation;
  onExport: () => void;
}) {
  return (
    <section className="workflow-step">
      <div className="section-heading">
        <p className="eyebrow">Generated dashboard</p>
        <h2>{dataset.name}</h2>
      </div>
      <DashboardPreview
        refNode={refNode}
        dataset={dataset}
        recommendation={recommendation}
      />
      <button
        type="button"
        className="primary-button next-action"
        onClick={onExport}
      >
        Export dashboard
      </button>
    </section>
  );
}

export function DashboardPreview({
  refNode,
  dataset,
  recommendation,
  expandInsights = false,
  showInsightLinks = true,
}: {
  refNode: React.RefObject<HTMLDivElement | null>;
  dataset: Dataset;
  recommendation: DashboardRecommendation;
  expandInsights?: boolean;
  showInsightLinks?: boolean;
}) {
  const [highlightedChartId, setHighlightedChartId] = useState<string>();
  const chartSections = groupChartsBySection(recommendation.charts);
  function selectInsightChart(chartId: string) {
    setHighlightedChartId(chartId);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`chart-${chartId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div ref={refNode} className="dashboard">
      <SummaryMetrics
        dataset={dataset}
        metrics={recommendation.summaryMetrics}
      />
      <DashboardInsights
        insights={recommendation.insights ?? []}
        activeChartId={highlightedChartId}
        onInsightSelect={selectInsightChart}
        defaultOpen={expandInsights}
        showChartLinks={showInsightLinks}
      />
      {chartSections.map((section) => {
        const hasFeaturedCard =
          section.id === "comparisons" && section.charts.length > 0;
        const hasOrphanCard = hasFeaturedCard
          ? section.charts.length % 2 === 0
          : section.charts.length % 2 === 1;
        return (
          <section className="dashboard-section" key={section.id}>
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
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
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
          <strong>Recommended insights</strong>
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
                  <strong>Action</strong>
                  <span>{insight.recommendedAction}</span>
                </p>
              )}
              {showChartLinks && insight.linkedChartId && (
                <button
                  type="button"
                  className="insight-chart-link"
                  onClick={() => onInsightSelect(insight.linkedChartId!)}
                >
                  Highlight chart
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
  if (chartType === "table") return "details";
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
}: {
  dataset: Dataset;
  chart: DashboardRecommendation["charts"][number];
  featured?: boolean;
  highlighted?: boolean;
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
  const chartClassName = [
    "card",
    "chart-card",
    featured ? "featured" : "",
    highlighted ? "highlighted" : "",
    `chart-card-${chart.chartType}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={chartClassName} id={`chart-${chart.id}`}>
      <div className="chart-card-header">
        <h3>{chart.title}</h3>
      </div>
      <p>{chart.rationale}</p>
      {chart.chartType === "summary" ? (
        <SummaryChart
          dataset={dataset}
          groupField={groupField}
          metricField={metricField}
          aggregation={effectiveAggregation}
        />
      ) : chart.chartType === "table" ? (
        <RankedTable dataset={dataset} chart={chart} />
      ) : chart.chartType === "pie" ? (
        <PieChart
          grouped={grouped}
          metricLabel={metricLabel}
          title={chart.title}
        />
      ) : chart.chartType === "line" ? (
        <LineChart
          grouped={grouped}
          groupLabel={groupLabel}
          metricLabel={metricLabel}
          title={chart.title}
        />
      ) : chart.chartType === "scatter" ? (
        <ScatterChart
          dataset={dataset}
          groupField={groupField}
          title={chart.title}
          xField={chart.xField}
          yField={chart.yField ?? metricField}
        />
      ) : chart.chartType === "missingness" ? (
        <MissingnessChart dataset={dataset} title={chart.title} />
      ) : grouped.length === 0 ? (
        metricField ? (
          <SummaryChart
            dataset={dataset}
            metricField={metricField}
            aggregation={effectiveAggregation}
          />
        ) : (
          <DatasetPreview dataset={dataset} />
        )
      ) : (
        <BarChart
          grouped={grouped}
          groupLabel={groupLabel}
          metricLabel={metricLabel}
          title={chart.title}
        />
      )}
    </article>
  );
}

function BarChart({
  grouped,
  groupLabel,
  metricLabel,
  title,
}: {
  grouped: GroupedMetricValue[];
  groupLabel: string;
  metricLabel: string;
  title: string;
}) {
  const visible = grouped.slice(0, 10);
  const max = Math.max(...visible.map((item) => item.value), 1);
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
          tabIndex={0}
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
  metricLabel,
  title,
}: {
  grouped: GroupedMetricValue[];
  metricLabel: string;
  title: string;
}) {
  const chartId = useId();
  const [activeIndex, setActiveIndex] = useState<number>();
  const total = grouped.reduce((sum, item) => sum + item.value, 0);
  const visible = grouped.slice(0, 5);
  const otherValue = grouped
    .slice(5)
    .reduce((sum, item) => sum + item.value, 0);
  const slices =
    otherValue > 0
      ? [
          ...visible,
          {
            label: "Other",
            value: otherValue,
            count: grouped.slice(5).reduce((sum, item) => sum + item.count, 0),
            total: grouped.slice(5).reduce((sum, item) => sum + item.total, 0),
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
              tabIndex={0}
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
            tabIndex={0}
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
  metricLabel,
  title,
}: {
  grouped: GroupedMetricValue[];
  groupLabel: string;
  metricLabel: string;
  title: string;
}) {
  const chartId = useId();
  const [activeIndex, setActiveIndex] = useState<number>();
  const points = grouped.slice().sort(compareChartLabels).slice(0, 14);
  if (points.length < 2) {
    return (
      <BarChart
        grouped={grouped}
        groupLabel={groupLabel}
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
              tabIndex={0}
            >
              <circle
                cx={point.x}
                cy={point.y}
                fill={activeIndex === index ? "#d55e00" : "#005ab5"}
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
  title,
  xField,
  yField,
}: {
  dataset: Dataset;
  groupField?: string;
  title: string;
  xField?: string;
  yField?: string;
}) {
  const chartId = useId();
  const [activeIndex, setActiveIndex] = useState<number>();
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
              tabIndex={0}
            >
              <circle
                cx={point.cx}
                cy={point.cy}
                fill={activeIndex === index ? "#d55e00" : "#005ab5"}
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
            fill="#5f656d"
            fontSize="11"
            textAnchor="middle"
            transform={`translate(14 ${padding.top + plotHeight / 2}) rotate(-90)`}
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

function MissingnessChart({
  dataset,
  title,
}: {
  dataset: Dataset;
  title: string;
}) {
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
            tabIndex={0}
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
  metricField,
  aggregation,
}: {
  dataset: Dataset;
  groupField?: string;
  metricField?: string;
  aggregation?: MetricAggregation;
}) {
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
        tabIndex={0}
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
          tabIndex={0}
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
          tabIndex={0}
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
          tabIndex={0}
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
  const rankedRows = metricField
    ? rows
        .slice()
        .sort((a, b) => toNumber(b[metricField]) - toNumber(a[metricField]))
        .slice(0, 6)
    : rows.slice(0, 6);

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
  highlightTerms = [],
  quality,
  defaultOpen = false,
}: {
  highlightTerms?: string[];
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
            ? "All passed"
            : `${actionable.length} flagged`}
        </span>
      </summary>
      <div className="accordion-content">
        {actionable.length === 0 ? (
          <div className="quality-empty">
            <strong>All checks passed</strong>
            <p>No quality checks require attention.</p>
          </div>
        ) : null}
        {actionable.length > 0
          ? actionable.slice(0, 6).map((issue) => (
              <div className={`quality ${issue.severity}`} key={issue.id}>
                <strong>
                  {issue.status.toUpperCase()}: {issue.checkType}
                </strong>
                <p>
                  {renderInlineCodeText(issue.description, [
                    ...highlightTerms,
                    ...(issue.affectedColumns ?? []),
                  ])}
                </p>
                {issue.suggestedAction ? (
                  <p>
                    Recommended:{" "}
                    {renderInlineCodeText(issue.suggestedAction, [
                      ...highlightTerms,
                      ...(issue.affectedColumns ?? []),
                    ])}
                  </p>
                ) : null}
              </div>
            ))
          : null}
      </div>
    </details>
  );
}

function renderInlineCodeText(text: string, terms: string[] = []) {
  const uniqueTerms = Array.from(
    new Set(terms.map((term) => term.trim()).filter(Boolean)),
  ).sort((a, b) => b.length - a.length);
  if (uniqueTerms.length === 0) return text;
  const parts = [];
  let plain = "";
  let index = 0;

  while (index < text.length) {
    const matchedTerm = uniqueTerms.find(
      (term) =>
        text.startsWith(term, index) &&
        hasTokenBoundary(text[index - 1]) &&
        hasTokenBoundary(text[index + term.length]),
    );
    if (!matchedTerm) {
      plain += text[index];
      index += 1;
      continue;
    }
    if (plain) {
      parts.push(plain);
      plain = "";
    }
    parts.push(
      <code className="inline-code" key={`${matchedTerm}-${index}`}>
        {matchedTerm}
      </code>,
    );
    index += matchedTerm.length;
  }

  if (plain) parts.push(plain);
  return parts.length ? parts : text;
}

function renderInlineCodeList(values: string[]) {
  return values.map((value, index) => (
    <span key={`${value}-${index}`}>
      {index > 0 ? ", " : ""}
      <code className="inline-code">{value}</code>
    </span>
  ));
}

function hasTokenBoundary(value: string | undefined) {
  return !value || !/[A-Za-z0-9_-]/.test(value);
}

function datasetTextTerms(datasets: Dataset[]) {
  return Array.from(new Set(datasets.flatMap(datasetTextTermCandidates)));
}

function datasetTextTermCandidates(dataset: Dataset) {
  const columns =
    dataset.columns ??
    dataset.profile?.columns.map((column) => column.columnName) ??
    [];
  const fieldTerms = columns.flatMap((column) => {
    const displayLabel = fieldDisplayLabel(column);
    return displayLabel && displayLabel !== column
      ? [column, displayLabel]
      : [column];
  });
  return [
    dataset.name,
    dataset.originalFilename,
    ...datasetNameParts(dataset.name),
    ...fieldTerms,
  ].filter((term): term is string => Boolean(term));
}

function datasetNameParts(name: string) {
  const withoutPrepared = name.replace(/\s+prepared$/i, "").trim();
  return Array.from(
    new Set([
      withoutPrepared,
      ...withoutPrepared
        .split("+")
        .map((part) => part.trim())
        .filter(Boolean),
    ]),
  );
}

function transformationTextTerms(log: TransformationStep[]) {
  return Array.from(
    new Set(
      log.flatMap((step) => [
        ...(step.affectedColumns ?? []),
        ...(step.operations?.flatMap((operation) => operation.columns) ?? []),
      ]),
    ),
  );
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

function buildProfileQualityResults(datasets: Dataset[]) {
  return datasets
    .flatMap((dataset) =>
      runQualityChecks(dataset).map((issue) => ({
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

function compareChartLabels(
  first: GroupedMetricValue,
  second: GroupedMetricValue,
) {
  const firstDate = parseSortableDate(first.label);
  const secondDate = parseSortableDate(second.label);
  if (firstDate !== undefined && secondDate !== undefined) {
    return firstDate - secondDate;
  }

  const firstNumber = Number(first.label);
  const secondNumber = Number(second.label);
  if (Number.isFinite(firstNumber) && Number.isFinite(secondNumber)) {
    return firstNumber - secondNumber;
  }

  return first.label.localeCompare(second.label, undefined, {
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

function DatasetPreview({ dataset }: { dataset: Dataset }) {
  const visibleColumnLimit = 12;
  const rows = dataset.sampleRows ?? dataset.data?.slice(0, 5) ?? [];
  const columns = dataset.columns ?? Object.keys(rows[0] ?? {});
  const visibleColumns = columns.slice(0, visibleColumnLimit);
  const hiddenColumnCount = Math.max(columns.length - visibleColumns.length, 0);
  return (
    <details className="card profile-accordion sample-data-card">
      <summary>
        <span>Sample data</span>
        <span className="accordion-meta">
          {formatCount(rows.length, "row")},{" "}
          {formatCount(columns.length, "column")}
        </span>
      </summary>
      <div className="accordion-content">
        {columns.length === 0 ? (
          <div className="mini-empty">No preview rows available.</div>
        ) : (
          <>
            <p>
              Showing {formatCount(visibleColumns.length, "column")}
              {hiddenColumnCount > 0
                ? `, with ${formatCount(hiddenColumnCount, "additional column")} available in exports.`
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

export function TransformationLogPanel({
  highlightTerms = [],
  log,
}: {
  highlightTerms?: string[];
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
                <p>
                  {renderInlineCodeText(step.description, [
                    ...highlightTerms,
                    ...transformationTextTerms([step]),
                  ])}
                </p>
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
  transformationCount,
  onCsv,
  onReport,
  onPng,
  onLog,
}: {
  ready: boolean;
  dashboardReady: boolean;
  logReady: boolean;
  rowCount: number;
  chartCount: number;
  qualityIssueCount: number;
  transformationCount: number;
  onCsv: () => void;
  onReport: () => void;
  onPng: () => void;
  onLog: () => void;
}) {
  return (
    <section className="workflow-step export-page">
      <div className="section-heading">
        <p className="eyebrow">Step 6</p>
        <h2>Export Dashboard Assets</h2>
      </div>
      <article className="card export-options-card">
        <div className="export-options-header">
          <p className="eyebrow">Available exports</p>
        </div>
        <div className="export-grid">
          <button className="export-option" disabled={!ready} onClick={onCsv}>
            <span className="export-option-type">CSV</span>
            <span className="export-option-label">Prepared dataset</span>
            <span className="export-option-meta">
              Downloads the harmonized, cleaned rows used to generate the
              dashboard.
            </span>
            <span className="export-option-detail">
              {formatCount(rowCount, "row")} prepared for analysis.
            </span>
          </button>
          <button
            className="export-option"
            disabled={!logReady}
            onClick={onLog}
          >
            <span className="export-option-type">JSON</span>
            <span className="export-option-label">Transformation log</span>
            <span className="export-option-meta">
              Exports the scoped record of joins, cleaning, and preparation
              steps applied to the data.
            </span>
            <span className="export-option-detail">
              {transformationCount > 0
                ? `${formatCount(transformationCount, "recorded step")} available.`
                : "No transformation steps were recorded."}
            </span>
          </button>
          <button
            className="export-option"
            disabled={!dashboardReady}
            onClick={onPng}
          >
            <span className="export-option-type">PNG</span>
            <span className="export-option-label">Dashboard image</span>
            <span className="export-option-meta">
              Captures the full generated dashboard as a shareable static image.
            </span>
            <span className="export-option-detail">
              {formatCount(chartCount, "chart")} with recommended insights
              expanded.
            </span>
          </button>
          <button
            className="export-option"
            disabled={!dashboardReady}
            onClick={onReport}
          >
            <span className="export-option-type">PDF</span>
            <span className="export-option-label">Dashboard report</span>
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

export function LandingHero({
  loading = false,
  llmEnabled,
  onLlmEnabledChange,
}: {
  loading?: boolean;
  llmEnabled: boolean;
  onLlmEnabledChange: (enabled: boolean) => void;
}) {
  return (
    <header className={`app-header${loading ? " loading" : ""}`}>
      <div className="app-header-inner">
        <div className="header-brand">
          <h1>Dashboard Copilot</h1>
          <a className="header-nav-link" href="/about">
            About
          </a>
        </div>
        <div className="header-actions">
          <div className="header-status-slot">
            {loading && <LoadingStatus />}
          </div>
          <label className="llm-toggle">
            <input
              type="checkbox"
              checked={llmEnabled}
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
