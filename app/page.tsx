"use client";

import { useRef, useState } from "react";
import type { Dataset, DatasetInputHints } from "@/types/dataset";
import type { DecisionBrief, DecisionReadinessResult } from "@/types/decision";
import type { AIRecommendationResponse, DashboardRecommendation, JoinRecommendation, QualityConcern } from "@/types/recommendations";
import type { QualityCheckResult } from "@/types/quality";
import type { TransformationStep } from "@/types/transformations";
import type { WorkflowStep } from "@/lib/config";
import { loadSampleDatasets, parseFile, type SampleDatasetKind } from "@/lib/fileParsers";
import { profileDataset } from "@/lib/profiling";
import { AIRecommendationRequestError, generateFallbackRecommendations, requestAIRecommendations } from "@/lib/recommendations";
import { applyJoinRecommendations, prepareSingleDataset, selectJoinPlan } from "@/lib/harmonization";
import { reconcileCleaningRecommendationsForDatasetColumns } from "@/lib/cleaningTransforms";
import { runQualityChecks } from "@/lib/validation";
import { assessDecisionReadiness, buildEvidenceCoverageSummary, createDefaultDecisionBrief, validateDecisionBrief } from "@/lib/decisionContext";
import {
  generateDeterministicDashboardRecommendation,
  reconcileDashboardRecommendation
} from "@/lib/dashboardRecommendations";
import { computeDashboardInsightFacts } from "@/lib/dashboardInsights";
import { downloadText, toCsv } from "@/lib/exportCsv";
import { exportElementAsPng } from "@/lib/exportPng";
import { exportElementAsPdf } from "@/lib/exportPdf";
import { buildDecisionHandoffPacket, type DecisionHandoffAiMode } from "@/lib/workflowExport";
import {
  DashboardPreview,
  DashboardStep,
  ExportStep,
  LandingHero,
  Notice,
  DecisionBriefStep,
  ProfileStep,
  RecommendationStep,
  StepIndicator,
  UploadStep,
  ValidationStep
} from "@/components/WorkflowComponents";

type WorkflowState = {
  decisionBrief: DecisionBrief;
  decisionReadiness?: DecisionReadinessResult;
  datasets: Dataset[];
  profilesReady: boolean;
  aiRecommendations?: AIRecommendationResponse;
  selectedJoinRecommendations?: JoinRecommendation[];
  preparedDataset?: Dataset;
  qualityResults: QualityCheckResult[];
  dashboardRecommendation?: DashboardRecommendation;
  transformationLog: TransformationStep[];
  currentStep: WorkflowStep;
  warning?: string;
};

const initialState: WorkflowState = {
  decisionBrief: createDefaultDecisionBrief(),
  datasets: [],
  profilesReady: false,
  qualityResults: [],
  transformationLog: [],
  currentStep: "brief"
};

export default function DashboardCopilotApp() {
  const [state, setState] = useState<WorkflowState>(initialState);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [llmEnabled, setLlmEnabled] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const activeDataset = state.preparedDataset ?? state.datasets.find((dataset) => dataset.data?.length) ?? state.datasets[0];
  const joinRecommendations = state.aiRecommendations?.joinRecommendations ?? [];
  const joinPlan = selectJoinPlan(state.datasets, joinRecommendations);
  const missingDecisionFields = validateDecisionBrief(state.decisionBrief);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setLoading(true);
    try {
      const results = await Promise.all(Array.from(files).map(parseFile));
      const parsed = results.flatMap((result) => (result.dataset ? [result.dataset] : []));
      setErrors(results.flatMap((result) => (result.error ? [result.error] : [])));
      setState((current) => ({
        ...current,
        datasets: [...current.datasets, ...parsed],
        profilesReady: false,
        aiRecommendations: undefined,
        selectedJoinRecommendations: undefined,
        preparedDataset: undefined,
        decisionReadiness: undefined,
        qualityResults: [],
        dashboardRecommendation: undefined,
        transformationLog: [],
        currentStep: "upload",
        warning: undefined
      }));
    } catch {
      setErrors(["One or more files could not be loaded. Check the files and try again."]);
    } finally {
      setLoading(false);
    }
  }

  async function useSamples(kind: SampleDatasetKind) {
    setLoading(true);
    try {
      const datasets = await loadSampleDatasets(kind);
      setErrors([]);
      setState((current) => ({
        ...current,
        datasets,
        profilesReady: false,
        aiRecommendations: undefined,
        selectedJoinRecommendations: undefined,
        preparedDataset: undefined,
        decisionReadiness: undefined,
        qualityResults: [],
        dashboardRecommendation: undefined,
        transformationLog: [],
        currentStep: "upload",
        warning: undefined
      }));
    } catch {
      setErrors(["Sample data could not be loaded. Try again."]);
    } finally {
      setLoading(false);
    }
  }

  function removeDataset(datasetId: string) {
    setErrors([]);
    setState((current) => {
      const datasets = current.datasets.filter((dataset) => dataset.id !== datasetId);
      return {
        ...current,
        datasets,
        profilesReady: false,
        aiRecommendations: undefined,
        selectedJoinRecommendations: undefined,
        preparedDataset: undefined,
        decisionReadiness: undefined,
        qualityResults: [],
        dashboardRecommendation: undefined,
        transformationLog: [],
        currentStep: "upload",
        warning: undefined
      };
    });
  }

  function updateDatasetInputHints(datasetId: string, inputHints: DatasetInputHints) {
    setState((current) => ({
      ...current,
      datasets: current.datasets.map((dataset) =>
        dataset.id === datasetId ? { ...dataset, inputHints } : dataset
      ),
      profilesReady: false,
      aiRecommendations: undefined,
      selectedJoinRecommendations: undefined,
      preparedDataset: undefined,
      decisionReadiness: undefined,
      qualityResults: [],
      dashboardRecommendation: undefined,
      transformationLog: [],
      currentStep: "upload",
      warning: undefined
    }));
  }

  function profileDatasets() {
    if (state.datasets.length === 0) return;
    const profiled = state.datasets.map((dataset) => ({ ...dataset, profile: profileDataset(dataset) }));
    setState((current) => ({
      ...current,
      datasets: profiled,
      profilesReady: true,
      aiRecommendations: undefined,
      selectedJoinRecommendations: undefined,
      preparedDataset: undefined,
      decisionReadiness: undefined,
      qualityResults: [],
      dashboardRecommendation: undefined,
      transformationLog: [],
      warning: undefined,
      currentStep: "profile"
    }));
  }

  async function requestRecommendations() {
    if (loading) return;
    setLoading(true);
    try {
      const profiled = state.datasets.every((dataset) => dataset.profile)
        ? state.datasets
        : state.datasets.map((dataset) => ({ ...dataset, profile: profileDataset(dataset) }));
      const fallback = generateFallbackRecommendations(profiled);
      let recommendations = fallback;
      let warning: string | undefined;
      const context = {
        mode: profiled.filter((dataset) => dataset.data?.length).length > 1 ? "multi" as const : "single" as const,
        profiles: profiled.map((dataset) => dataset.profile!),
        decisionContext: state.decisionBrief
      };
      if (llmEnabled) {
        try {
          const ai = await requestAIRecommendations(context, true, "workflow");
          recommendations = mergeRecommendationResponse(fallback, ai, profiled);
          if (ai.source !== "llm") {
            warning = llmFallbackWarning(ai, "recommendations");
          }
        } catch (error) {
          warning = llmFallbackWarning(
            fallbackWithRecommendationError(fallback, error),
            "recommendations"
          );
        }
      } else {
        warning = "AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard recommendations remain available.";
      }
      setState((current) => ({
        ...current,
        datasets: profiled,
        profilesReady: true,
        aiRecommendations: recommendations,
        selectedJoinRecommendations: undefined,
        preparedDataset: undefined,
        decisionReadiness: undefined,
        qualityResults: [],
        dashboardRecommendation: undefined,
        transformationLog: [],
        warning,
        currentStep: "recommend"
      }));
    } catch {
      setErrors(["Recommendations could not be prepared. Try again."]);
    } finally {
      setLoading(false);
    }
  }

  function acceptRecommendation(approvedJoins?: JoinRecommendation[]) {
    const joins = approvedJoins ?? joinPlan;
    const cleaningRecommendations = state.aiRecommendations?.cleaningRecommendations ?? [];
    if (joins.length > 0) {
      const result = applyJoinRecommendations(state.datasets, joins, cleaningRecommendations);
      const profiledPrepared = { ...result.dataset, profile: profileDataset(result.dataset) };
      const readinessResult = assessDecisionReadiness(
        profiledPrepared,
        state.decisionBrief,
        runQualityChecks(profiledPrepared)
      );
      const qualityResults = withAiQualityConcerns(
        readinessResult.qualityResults,
        llmQualityConcerns(state.aiRecommendations)
      );
      setState((current) => ({
        ...current,
        selectedJoinRecommendations: result.appliedJoinRecommendations,
        preparedDataset: profiledPrepared,
        decisionReadiness: readinessResult.readiness,
        qualityResults,
        dashboardRecommendation: undefined,
        currentStep: "validate",
        transformationLog: result.transformations
      }));
      return;
    }
    prepareActiveDataset();
  }

  function prepareActiveDataset() {
    const datasetToPrepare = activeDataset;
    if (!datasetToPrepare?.data) return;
    const cleaningRecommendations = state.aiRecommendations?.cleaningRecommendations ?? [];
    const result = prepareSingleDataset(datasetToPrepare, cleaningRecommendations);
    const profiledPrepared = { ...result.dataset, profile: profileDataset(result.dataset) };
    const readinessResult = assessDecisionReadiness(
      profiledPrepared,
      state.decisionBrief,
      runQualityChecks(profiledPrepared)
    );
    const qualityResults = withAiQualityConcerns(
      readinessResult.qualityResults,
      llmQualityConcerns(state.aiRecommendations)
    );
    setState((current) => ({
      ...current,
      preparedDataset: profiledPrepared,
      selectedJoinRecommendations: undefined,
      decisionReadiness: readinessResult.readiness,
      qualityResults,
      dashboardRecommendation: undefined,
      currentStep: "validate",
      transformationLog: result.transformations
    }));
  }

  async function generateDashboardFromValidation() {
    if (loading) return;
    if (!state.preparedDataset) return;
    const preparedDataset = state.preparedDataset.profile
      ? state.preparedDataset
      : { ...state.preparedDataset, profile: profileDataset(state.preparedDataset) };
    const dashboardFacts = computeDashboardInsightFacts(
      preparedDataset,
      state.qualityResults,
      state.transformationLog
    );
    const fallbackBase = generateFallbackRecommendations([preparedDataset]);
    const fallback = {
      ...fallbackBase,
      dashboardRecommendations: generateDeterministicDashboardRecommendation(
        preparedDataset,
        {
          dashboardFacts,
          qualityResults: state.qualityResults,
          transformationLog: state.transformationLog,
        }
      )
    };
    let dashboardRecommendation = reconcileDashboardRecommendation(
      preparedDataset,
      fallback.dashboardRecommendations,
      { qualityResults: state.qualityResults }
    );
    let qualityResults = state.qualityResults;
    let warning: string | undefined;

    setLoading(true);
    try {
      try {
        if (llmEnabled) {
          const ai = await requestAIRecommendations(
            {
              mode: "single",
              decisionContext: state.decisionBrief,
              profiles: [preparedDataset.profile!],
              dashboardFacts,
              qualitySummary: state.qualityResults.map((issue) => `${issue.severity}: ${issue.description}`),
              transformationSummary: state.transformationLog.map((step) => step.description)
            },
            true,
            "dashboard"
          );
          qualityResults = withAiQualityConcerns(
            state.qualityResults,
            llmQualityConcerns(ai)
          );
          const updatedDashboardFacts = computeDashboardInsightFacts(
            preparedDataset,
            qualityResults,
            state.transformationLog
          );
          const updatedFallback = {
            ...fallbackBase,
            dashboardRecommendations: generateDeterministicDashboardRecommendation(
              preparedDataset,
              {
                dashboardFacts: updatedDashboardFacts,
                qualityResults,
                transformationLog: state.transformationLog,
              }
            )
          };
          const recommendations = mergeRecommendationResponse(updatedFallback, ai, [preparedDataset]);
          dashboardRecommendation = reconcileDashboardRecommendation(
            preparedDataset,
            recommendations.dashboardRecommendations,
            { qualityResults }
          );
          if (ai.source !== "llm") {
            warning = llmFallbackWarning(ai, "visualizations");
          }
        } else {
          warning = "AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard recommendations remain available.";
        }
      } catch (error) {
        warning = llmFallbackWarning(
          fallbackWithRecommendationError(fallback, error),
          "visualizations"
        );
      }

      setState((current) => ({
        ...current,
        preparedDataset,
        qualityResults,
        dashboardRecommendation,
        warning,
        currentStep: "dashboard"
      }));
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!state.preparedDataset?.data) return;
    downloadText("dashboard-copilot-prepared-data.csv", toCsv(state.preparedDataset.data), "text/csv");
  }

  function exportLog() {
    const datasets = state.datasets.length > 0
      ? state.datasets
      : state.preparedDataset
        ? [state.preparedDataset]
        : [];
    const packet = buildDecisionHandoffPacket({
      decisionBrief: state.decisionBrief,
      evidenceCoverage: buildEvidenceCoverageSummary(datasets, state.decisionBrief),
      decisionReadiness: state.decisionReadiness,
      datasets,
      selectedJoinRecommendations: state.selectedJoinRecommendations ?? [],
      qualityResults: state.qualityResults,
      transformationLog: state.transformationLog,
      aiMode: currentAiMode(llmEnabled, state.aiRecommendations, state.warning),
    });
    downloadText(
      "dashboard-copilot-decision-handoff-log.json",
      JSON.stringify(packet, null, 2),
      "application/json",
    );
  }

  async function exportReport() {
    if (!dashboardRef.current || !state.preparedDataset) return;
    try {
      setLoading(true);
      await exportElementAsPdf(dashboardRef.current, {
        filename: "dashboard-copilot-report.pdf",
        title: `Dashboard Copilot Report: ${state.preparedDataset.name}`,
        metadata: [
          `Rows: ${state.preparedDataset.rowCount ?? 0}`,
          `Columns: ${state.preparedDataset.columnCount ?? 0}`,
          `Generated: ${new Date().toLocaleString()}`
        ],
        qualityResults: state.qualityResults,
        decisionReadiness: state.decisionReadiness,
        transformationLog: state.transformationLog
      });
    } catch {
      setErrors(["PDF export failed. Try again after the dashboard finishes rendering."]);
    } finally {
      setLoading(false);
    }
  }

  async function exportPng() {
    if (!dashboardRef.current) return;
    try {
      setLoading(true);
      await exportElementAsPng(dashboardRef.current, "dashboard-copilot-dashboard.png");
    } catch {
      setErrors(["PNG export failed. Try again after the dashboard finishes rendering."]);
    } finally {
      setLoading(false);
    }
  }

  function canNavigateToStep(step: WorkflowStep) {
    if (step === "brief") return true;
    if (step === "upload") return missingDecisionFields.length === 0;
    if (step === "profile") return state.profilesReady;
    if (step === "recommend") return Boolean(state.aiRecommendations);
    if (step === "validate") return Boolean(state.preparedDataset);
    if (step === "dashboard") return Boolean(state.preparedDataset && state.dashboardRecommendation);
    if (step === "export") return Boolean(state.preparedDataset && state.dashboardRecommendation);
    return false;
  }

  function navigateToStep(step: WorkflowStep) {
    if (!canNavigateToStep(step)) return;
    setState((current) => ({ ...current, currentStep: step }));
  }

  function handleLlmEnabledChange(enabled: boolean) {
    setLlmEnabled(enabled);
    setState((current) => ({
      ...current,
      warning: enabled
        ? undefined
        : current.aiRecommendations?.source === "llm" || current.dashboardRecommendation
          ? "AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard recommendations remain available. Existing generated recommendations remain until you rerun the workflow or change data."
          : "AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard recommendations remain available."
    }));
  }

  function updateDecisionBrief(nextBrief: DecisionBrief) {
    setState((current) => ({
      ...current,
      decisionBrief: nextBrief,
      decisionReadiness: undefined,
      aiRecommendations: undefined,
      selectedJoinRecommendations: undefined,
      preparedDataset: undefined,
      qualityResults: [],
      dashboardRecommendation: undefined,
      transformationLog: [],
      currentStep: "brief",
      warning: undefined
    }));
  }

  function proceedFromDecisionBrief() {
    if (missingDecisionFields.length > 0) return;
    setState((current) => ({ ...current, currentStep: "upload" }));
  }

  return (
    <main>
      <LandingHero
        loading={loading}
        llmEnabled={llmEnabled}
        onLlmEnabledChange={handleLlmEnabledChange}
      />
      <div className="app-shell">
        <StepIndicator currentStep={state.currentStep} canNavigateTo={canNavigateToStep} onNavigate={navigateToStep} />
        {errors.length > 0 && <Notice tone="error" items={errors} />}
        {state.warning && <Notice tone="warn" items={[state.warning]} />}

        <section className="workflow-grid">
          <div className="main-panel">
            {state.currentStep === "brief" && (
              <DecisionBriefStep
                brief={state.decisionBrief}
                missingFields={missingDecisionFields}
                onChange={updateDecisionBrief}
                onContinue={proceedFromDecisionBrief}
              />
            )}
            {state.currentStep === "upload" && (
              <UploadStep
                datasets={state.datasets}
                decisionBrief={state.decisionBrief}
                onProfile={profileDatasets}
                onFiles={addFiles}
                onSamples={useSamples}
                onRemoveDataset={removeDataset}
                onUpdateDatasetInputHints={updateDatasetInputHints}
              />
            )}
            {state.currentStep === "profile" && (
              <ProfileStep datasets={state.datasets} decisionBrief={state.decisionBrief} isWorking={loading} onRecommend={requestRecommendations} />
            )}
            {state.currentStep === "recommend" && state.aiRecommendations && (
              <RecommendationStep
                recommendations={state.aiRecommendations}
                joins={joinPlan}
                datasets={state.datasets}
                cleaningRecommendations={state.aiRecommendations.cleaningRecommendations ?? []}
                onAccept={acceptRecommendation}
              />
            )}
            {state.currentStep === "validate" && state.preparedDataset && (
              <ValidationStep
                dataset={state.preparedDataset}
                joins={state.selectedJoinRecommendations}
                quality={state.qualityResults}
                decisionReadiness={state.decisionReadiness}
                transformationLog={state.transformationLog}
                isWorking={loading}
                onProceed={generateDashboardFromValidation}
              />
            )}
            {state.currentStep === "dashboard" && state.preparedDataset && state.dashboardRecommendation && (
              <DashboardStep
                refNode={dashboardRef}
                dataset={state.preparedDataset}
                decisionReadiness={state.decisionReadiness}
                recommendation={state.dashboardRecommendation}
                onExport={() => navigateToStep("export")}
              />
            )}
            {state.currentStep === "export" && state.preparedDataset && state.dashboardRecommendation && (
              <>
                <ExportStep
                  ready={Boolean(state.preparedDataset)}
                  dashboardReady={Boolean(state.dashboardRecommendation)}
                  logReady={Boolean(state.preparedDataset)}
                  rowCount={state.preparedDataset.rowCount ?? state.preparedDataset.data?.length ?? 0}
                  chartCount={state.dashboardRecommendation.charts.length}
                  qualityIssueCount={state.qualityResults.filter((issue) => issue.status !== "pass").length}
                  decisionReadiness={state.decisionReadiness}
                  transformationCount={state.transformationLog.length}
                  onCsv={exportCsv}
                  onReport={exportReport}
                  onPng={exportPng}
                  onLog={exportLog}
                />
                <div className="export-render-target" aria-hidden="true">
                  <DashboardPreview
                    refNode={dashboardRef}
                    dataset={state.preparedDataset}
                    decisionReadiness={state.decisionReadiness}
                    recommendation={state.dashboardRecommendation}
                    expandInsights
                    showInsightLinks={false}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function mergeRecommendationResponse(
  fallback: AIRecommendationResponse,
  ai: AIRecommendationResponse,
  datasets: Dataset[]
): AIRecommendationResponse {
  const joinRecommendations = (ai.joinRecommendations ?? []).filter((join) =>
    isUsableJoinRecommendation(join, datasets)
  );
  return {
    ...fallback,
    ...ai,
    source: ai.source ?? fallback.source,
    joinRecommendations: joinRecommendations.length
      ? joinRecommendations
      : fallback.joinRecommendations,
    cleaningRecommendations: reconcileCleaningRecommendationsForDatasetColumns(
      datasets,
      ai.cleaningRecommendations?.length
        ? ai.cleaningRecommendations
        : fallback.cleaningRecommendations
    ),
    dashboardRecommendations: ai.dashboardRecommendations?.charts.length
      ? ai.dashboardRecommendations
      : fallback.dashboardRecommendations,
    qualityConcerns: ai.qualityConcerns?.length
      ? ai.qualityConcerns
      : fallback.qualityConcerns,
    assumptions: ai.assumptions?.length ? ai.assumptions : fallback.assumptions
  };
}

function isUsableJoinRecommendation(join: JoinRecommendation, datasets: Dataset[]) {
  if (join.sourceDatasetId === join.targetDatasetId) return false;
  const source = datasets.find((dataset) => dataset.id === join.sourceDatasetId);
  const target = datasets.find((dataset) => dataset.id === join.targetDatasetId);
  if (!source || !target) return false;
  const sourceColumns = new Set(source.columns ?? source.profile?.columns.map((column) => column.columnName) ?? []);
  const targetColumns = new Set(target.columns ?? target.profile?.columns.map((column) => column.columnName) ?? []);
  return (
    join.sourceColumns.length > 0 &&
    join.targetColumns.length > 0 &&
    join.sourceColumns.every((column) => sourceColumns.has(column)) &&
    join.targetColumns.every((column) => targetColumns.has(column))
  );
}

function withAiQualityConcerns(
  qualityResults: QualityCheckResult[],
  concerns: QualityConcern[] = []
) {
  if (concerns.length === 0) return qualityResults;
  const aiChecks: QualityCheckResult[] = concerns.map((concern, index) => ({
    id: `ai-quality-${slugify(concern.title)}-${index}`,
    checkType: "LLM review concern",
    status:
      concern.severity === "high"
        ? "fail"
        : concern.severity === "medium" || concern.severity === "low"
          ? "warning"
          : "pass",
    severity: concern.severity,
    description: concern.title,
    suggestedAction: concern.rationale
  }));
  const byId = new Map<string, QualityCheckResult>();
  for (const issue of [...qualityResults, ...aiChecks]) {
    byId.set(issue.id, issue);
  }
  return Array.from(byId.values()).sort(
    (a, b) => qualitySeverityRank(b.severity) - qualitySeverityRank(a.severity)
  );
}

function llmQualityConcerns(recommendations?: AIRecommendationResponse) {
  return recommendations?.source === "llm" ? recommendations.qualityConcerns : undefined;
}

function currentAiMode(
  llmEnabled: boolean,
  recommendations?: AIRecommendationResponse,
  warning?: string,
): DecisionHandoffAiMode {
  if (!llmEnabled) return "disabled";
  if (recommendations?.source === "llm") return "llm";
  if (recommendations?.fallbackReason || warning) return "fallback";
  return "deterministic";
}

function qualitySeverityRank(severity: QualityCheckResult["severity"]) {
  return { info: 0, low: 1, medium: 2, high: 3 }[severity];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function llmFallbackWarning(
  response: AIRecommendationResponse,
  outputLabel: "recommendations" | "visualizations"
) {
  const genericUnavailable =
    "AI recommendations were unavailable. The app used deterministic recommendations. Review joins and caveats before action.";
  if (response.fallbackReason === "app_rate_limit") {
    const retry = response.retryAfterSeconds
      ? ` Try again in about ${formatRetryAfter(response.retryAfterSeconds)}.`
      : " Try again shortly.";
    return `The app recommendation rate limit was reached, so deterministic ${outputLabel} are being used.${retry}`;
  }
  if (response.fallbackReason === "provider_rate_limit") {
    const retry = response.retryAfterSeconds
      ? ` Try again in about ${formatRetryAfter(response.retryAfterSeconds)}.`
      : " Try again shortly.";
    return `The LLM provider rate limit was reached, so deterministic ${outputLabel} are being used.${retry}`;
  }
  if (response.fallbackReason === "missing_api_key") {
    return `LLM API calls are on, but no server API key is configured, so deterministic ${outputLabel} are being used.`;
  }
  if (response.fallbackReason === "unsupported_provider") {
    return `The configured LLM provider is not supported by this app, so deterministic ${outputLabel} are being used.`;
  }
  if (response.fallbackReason === "invalid_request") {
    return `The recommendation request could not be accepted, so deterministic ${outputLabel} are being used.${fallbackDetail(response)}`;
  }
  if (response.fallbackReason === "request_too_large") {
    return `The recommendation request was too large for the app limits, so deterministic ${outputLabel} are being used.${fallbackDetail(response)}`;
  }
  if (response.fallbackReason === "request_timeout") {
    return genericUnavailable;
  }
  if (response.fallbackReason === "network_error") {
    return genericUnavailable;
  }
  if (response.fallbackReason === "provider_unavailable") {
    return genericUnavailable;
  }
  if (response.fallbackReason === "model_response_truncated") {
    const jsonLabel = outputLabel === "visualizations" ? "dashboard JSON" : "recommendation JSON";
    return `The LLM response was truncated before the ${jsonLabel} finished, so deterministic ${outputLabel} are being used. Increase LLM_MAX_COMPLETION_TOKENS and retry.`;
  }
  if (response.fallbackReason === "model_response_invalid") {
    return `The LLM returned a response that did not match the dashboard format, so deterministic ${outputLabel} are being used.`;
  }
  if (outputLabel === "visualizations") {
    return genericUnavailable;
  }
  return genericUnavailable;
}

function formatRetryAfter(seconds: number) {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function fallbackDetail(response: AIRecommendationResponse) {
  return response.fallbackMessage ? ` ${response.fallbackMessage}` : "";
}

function fallbackWithRecommendationError(
  fallback: AIRecommendationResponse,
  error: unknown
): AIRecommendationResponse {
  if (error instanceof AIRecommendationRequestError) {
    return {
      ...fallback,
      fallbackReason: error.fallbackReason,
      retryAfterSeconds: error.retryAfterSeconds,
      fallbackMessage: error.message
    };
  }
  return { ...fallback, fallbackReason: "network_error" };
}
