"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { DecisionHandoffAiMode, DecisionHandoffSummary } from "@/types/copilot";
import type { Dataset, DatasetInputHints } from "@/types/dataset";
import type { DecisionBrief, DecisionReadinessResult } from "@/types/decision";
import type { AIRecommendationResponse, DashboardRecommendation, JoinRecommendation, QualityConcern } from "@/types/recommendations";
import type { QualityCheckResult } from "@/types/quality";
import type { TransformationStep } from "@/types/transformations";
import type { WorkflowStep } from "@/lib/config";
import { buildDeterministicDecisionHandoffSummary } from "@/lib/copilotHandoff";
import { loadSampleDatasets, parseFile, type SampleDatasetKind } from "@/lib/fileParsers";
import { createFormDatasetFromRows } from "@/lib/formIntake";
import { profileDataset } from "@/lib/profiling";
import { AIRecommendationRequestError, generateFallbackRecommendations, requestAIRecommendations, requestDecisionHandoffCopilotSummary } from "@/lib/recommendations";
import { applyJoinRecommendations, prepareSingleDataset, selectJoinPlan } from "@/lib/harmonization";
import { reconcileCleaningRecommendationsForDatasetColumns } from "@/lib/cleaningTransforms";
import { runQualityChecks } from "@/lib/validation";
import {
  assessDecisionReadiness,
  buildAiGuardrailExplanation,
  buildEvidenceCoverageSummary,
  createDefaultDecisionBrief,
  validateDecisionBrief,
} from "@/lib/decisionContext";
import {
  generateDeterministicDashboardRecommendation,
  reconcileDashboardRecommendation
} from "@/lib/dashboardRecommendations";
import { computeDashboardInsightFacts } from "@/lib/dashboardInsights";
import { downloadText, toCsv } from "@/lib/exportCsv";
import { exportElementAsPng } from "@/lib/exportPng";
import { exportElementAsPdf } from "@/lib/exportPdf";
import { buildDashboardProjectKit, buildDecisionHandoffPacket } from "@/lib/workflowExport";
import { UsageMeter } from "@/components/UsageMeter";
import { FeedbackForm } from "@/components/FeedbackForm";
import { AiCoachPanel } from "@/components/AiCoachPanel";
import { deterministicCoachHints } from "@/lib/coach";
import { buildRepairActions } from "@/lib/repairActions";
import {
  isStepCompatibleWithWorkspacePath,
  isWorkspaceWorkflowPath,
  workspaceDefaultStepFromPath,
  workspacePathForStep,
} from "@/components/workflow/workspaceRoutes";
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
  handoffSummary?: DecisionHandoffSummary;
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

const copilotApiEnabled = process.env.NEXT_PUBLIC_COPILOT_API_ENABLED === "true";

export type DashboardCopilotAppProps = {
  forceDeterministic?: boolean;
  workspaceMode?: boolean;
};

export default function DashboardCopilotApp({
  forceDeterministic = false,
  workspaceMode = false,
}: DashboardCopilotAppProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const aiApiAvailable = copilotApiEnabled && !forceDeterministic;
  const demoMode = forceDeterministic && !workspaceMode;
  const [state, setState] = useState<WorkflowState>(initialState);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [llmEnabled, setLlmEnabled] = useState(aiApiAvailable);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const workflowShellRef = useRef<HTMLDivElement>(null);

  const activeDataset = state.preparedDataset ?? state.datasets.find((dataset) => dataset.data?.length) ?? state.datasets[0];
  const joinRecommendations = state.aiRecommendations?.joinRecommendations ?? [];
  const joinPlan = selectJoinPlan(state.datasets, joinRecommendations);
  const missingDecisionFields = validateDecisionBrief(state.decisionBrief);
  const evidenceCoverage = useMemo(
    () =>
      state.datasets.length > 0
        ? buildEvidenceCoverageSummary(state.datasets, state.decisionBrief)
        : undefined,
    [state.datasets, state.decisionBrief],
  );
  const repairActions = useMemo(
    () =>
      workspaceMode
        ? buildRepairActions({
            aiFallbackReason: state.aiRecommendations?.fallbackReason,
            evidenceCoverage,
            qualityResults: state.qualityResults,
            readiness: state.decisionReadiness,
            workflowStep: state.currentStep,
          })
        : [],
    [
      evidenceCoverage,
      state.aiRecommendations?.fallbackReason,
      state.currentStep,
      state.decisionReadiness,
      state.qualityResults,
      workspaceMode,
    ],
  );

  useEffect(() => {
    workflowShellRef.current?.scrollIntoView({ block: "start" });
  }, [state.currentStep]);

  useEffect(() => {
    if (!workspaceMode || !isWorkspaceWorkflowPath(pathname)) return;
    const routeStep = workspaceDefaultStepFromPath(pathname);
    if (!routeStep) return;

    setState((current) => {
      if (isStepCompatibleWithWorkspacePath(current.currentStep, pathname)) {
        return current;
      }
      if (canNavigateToStepFromState(current, routeStep)) {
        return {
          ...current,
          currentStep: routeStep,
          warning: undefined,
        };
      }
      return {
        ...current,
        warning: "Complete the earlier workflow steps before opening this workspace view.",
      };
    });
  }, [pathname, workspaceMode]);

  function syncWorkspaceRoute(step: WorkflowStep) {
    if (!workspaceMode) return;
    const nextPath = workspacePathForStep(step);
    if (pathname !== nextPath) router.push(nextPath);
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setLoading(true);
    try {
      const results = await Promise.all(Array.from(files).map(parseFile));
      const parsed = results.flatMap((result) =>
        result.dataset ? [formAwareDataset(result.dataset)] : [],
      );
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
        handoffSummary: undefined,
        transformationLog: [],
        currentStep: "upload",
        warning: undefined
      }));
      syncWorkspaceRoute("upload");
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
        handoffSummary: undefined,
        transformationLog: [],
        currentStep: "upload",
        warning: undefined
      }));
      syncWorkspaceRoute("upload");
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
        handoffSummary: undefined,
        transformationLog: [],
        currentStep: "upload",
        warning: undefined
      };
    });
    syncWorkspaceRoute("upload");
  }

  function addFormDataset(dataset: Dataset) {
    setErrors([]);
    setState((current) => ({
      ...current,
      datasets: [...current.datasets, dataset],
      profilesReady: false,
      aiRecommendations: undefined,
      selectedJoinRecommendations: undefined,
      preparedDataset: undefined,
      decisionReadiness: undefined,
      qualityResults: [],
      dashboardRecommendation: undefined,
      handoffSummary: undefined,
      transformationLog: [],
      currentStep: "upload",
      warning: undefined
    }));
    syncWorkspaceRoute("upload");
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
      handoffSummary: undefined,
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
      handoffSummary: undefined,
      transformationLog: [],
      warning: undefined,
      currentStep: "profile"
    }));
    syncWorkspaceRoute("profile");
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
      if (llmEnabled && aiApiAvailable) {
        try {
          const ai = await requestAIRecommendations(context, true, "workflow");
          recommendations = mergeRecommendationResponse(fallback, ai, profiled);
          if (ai.source !== "llm") {
            warning = llmFallbackWarning(ai, "review guidance");
          }
        } catch (error) {
          warning = llmFallbackWarning(
            fallbackWithRecommendationError(fallback, error),
            "review guidance"
          );
        }
      } else {
        warning = "AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard review guidance remain available.";
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
        handoffSummary: undefined,
        transformationLog: [],
        warning,
        currentStep: "recommend"
      }));
      syncWorkspaceRoute("recommend");
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
        handoffSummary: undefined,
        currentStep: "validate",
        transformationLog: result.transformations
      }));
      syncWorkspaceRoute("validate");
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
      handoffSummary: undefined,
      currentStep: "validate",
      transformationLog: result.transformations
    }));
    syncWorkspaceRoute("validate");
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
        if (llmEnabled && aiApiAvailable) {
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
            warning = llmFallbackWarning(ai, "dashboard view");
          }
        } else {
          warning = "AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard review guidance remain available.";
        }
      } catch (error) {
        warning = llmFallbackWarning(
          fallbackWithRecommendationError(fallback, error),
          "dashboard view"
        );
      }

      setState((current) => ({
        ...current,
        preparedDataset,
        qualityResults,
        dashboardRecommendation,
        handoffSummary: undefined,
        warning,
        currentStep: "dashboard"
      }));
      syncWorkspaceRoute("dashboard");
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

  function exportProjectKit() {
    if (!state.preparedDataset || !state.dashboardRecommendation) return;
    const datasets = state.datasets.length > 0
      ? state.datasets
      : [state.preparedDataset];
    const kit = buildDashboardProjectKit({
      decisionBrief: state.decisionBrief,
      evidenceCoverage: buildEvidenceCoverageSummary(datasets, state.decisionBrief),
      decisionReadiness: state.decisionReadiness,
      datasets,
      preparedDataset: state.preparedDataset,
      dashboardRecommendation: state.dashboardRecommendation,
      selectedJoinRecommendations: state.selectedJoinRecommendations ?? [],
      qualityResults: state.qualityResults,
      transformationLog: state.transformationLog,
      aiMode: currentAiMode(llmEnabled, state.aiRecommendations, state.warning),
      aiFallbackReason: state.aiRecommendations?.fallbackReason,
      aiFallbackMessage: state.aiRecommendations?.fallbackMessage,
    });
    downloadText(
      "dashboard-copilot-project-kit.json",
      JSON.stringify(kit, null, 2),
      "application/json",
    );
  }

  async function generateHandoffSummary() {
    if (handoffLoading || !state.preparedDataset || !state.dashboardRecommendation) return;
    setHandoffLoading(true);
    try {
      const datasets = state.datasets.length > 0
        ? state.datasets
        : [state.preparedDataset];
      const evidenceCoverage = buildEvidenceCoverageSummary(datasets, state.decisionBrief);
      const aiMode = currentAiMode(llmEnabled, state.aiRecommendations, state.warning);
      const packet = buildDecisionHandoffPacket({
        decisionBrief: state.decisionBrief,
        evidenceCoverage,
        decisionReadiness: state.decisionReadiness,
        datasets,
        selectedJoinRecommendations: state.selectedJoinRecommendations ?? [],
        qualityResults: state.qualityResults,
        transformationLog: state.transformationLog,
        aiMode,
      });
      const dashboardFacts = computeDashboardInsightFacts(
        state.preparedDataset,
        state.qualityResults,
        state.transformationLog,
      );
      const handoffContext = {
        taskType: "decision_handoff_summary" as const,
        decisionBrief: state.decisionBrief,
        decisionReadiness: state.decisionReadiness,
        evidenceCoverage,
        qualitySummary: state.qualityResults
          .filter((issue) => issue.status !== "pass")
          .map(qualityIssueSummary),
        transformationSummary: state.transformationLog.map((step) => step.description),
        dashboardFacts,
        aiMode,
        reviewNotice: packet.reviewNotice,
        limitations: packet.limitations,
      };
      const summary = aiApiAvailable
        ? await requestDecisionHandoffCopilotSummary(handoffContext, llmEnabled)
        : buildDeterministicDecisionHandoffSummary(handoffContext);
      setState((current) => ({
        ...current,
        handoffSummary: summary,
      }));
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : "Decision handoff summary could not be generated.",
      ]);
    } finally {
      setHandoffLoading(false);
    }
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
    syncWorkspaceRoute(step);
  }

  function handleLlmEnabledChange(enabled: boolean) {
    if (!aiApiAvailable) {
      setLlmEnabled(false);
      setState((current) => ({
        ...current,
        warning: "AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard review guidance remain available."
      }));
      return;
    }
    setLlmEnabled(enabled);
    setState((current) => ({
      ...current,
      warning: enabled
        ? undefined
        : current.aiRecommendations?.source === "llm" || current.dashboardRecommendation
          ? "AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard review guidance remain available. Existing generated guidance remains until you rerun the workflow or change data."
          : "AI is off. Deterministic profiling, evidence coverage, readiness checks, and dashboard review guidance remain available."
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
      handoffSummary: undefined,
      transformationLog: [],
      currentStep: "brief",
      warning: undefined
    }));
    syncWorkspaceRoute("brief");
  }

  function proceedFromDecisionBrief() {
    if (missingDecisionFields.length > 0) return;
    setState((current) => ({ ...current, currentStep: "upload" }));
    syncWorkspaceRoute("upload");
  }

  return (
    <main className={workspaceMode ? "workspace-workflow-main" : undefined}>
      {!workspaceMode && (
        <LandingHero
          loading={loading}
          llmEnabled={llmEnabled}
          llmAvailable={aiApiAvailable}
          onLlmEnabledChange={handleLlmEnabledChange}
          usageSlot={<UsageMeter enabled={aiApiAvailable} />}
          ctaSlot={demoMode ? (
            <a className="primary-action compact" href="/login?next=/app/data">
              Sign in to use AI-assisted workflow
            </a>
          ) : undefined}
        />
      )}
      <div className="app-shell" ref={workflowShellRef}>
        <StepIndicator currentStep={state.currentStep} canNavigateTo={canNavigateToStep} onNavigate={navigateToStep} />
        {errors.length > 0 && <Notice tone="error" items={errors} />}
        {state.warning && <Notice tone="warn" items={[state.warning]} />}

        <section className="workflow-grid">
          <div className="main-panel">
            {state.currentStep === "brief" && (
              <DecisionBriefStep
                aiAssistedAvailable={aiApiAvailable}
                aiAssistedEnabled={llmEnabled}
                brief={state.decisionBrief}
                missingFields={missingDecisionFields}
                onAiAssistedEnabledChange={handleLlmEnabledChange}
                onChange={updateDecisionBrief}
                onContinue={proceedFromDecisionBrief}
              />
            )}
            {state.currentStep === "upload" && (
              <UploadStep
                datasets={state.datasets}
                decisionBrief={state.decisionBrief}
                onProfile={profileDatasets}
                onFiles={demoMode ? undefined : addFiles}
                onSamples={useSamples}
                onRemoveDataset={removeDataset}
                onUpdateDatasetInputHints={updateDatasetInputHints}
                onCreateFormDataset={addFormDataset}
                sampleOnly={demoMode}
              />
            )}
            {state.currentStep === "profile" && (
              <ProfileStep datasets={state.datasets} decisionBrief={state.decisionBrief} isWorking={loading} onRecommend={requestRecommendations} />
            )}
            {state.currentStep === "recommend" && state.aiRecommendations && (
              <RecommendationStep
                aiGuardrail={buildAiGuardrailExplanation({
                  recommendations: state.aiRecommendations,
                })}
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
                evidenceCoverage={
                  evidenceCoverage ??
                  buildEvidenceCoverageSummary(state.datasets, state.decisionBrief)
                }
                aiGuardrail={buildAiGuardrailExplanation({
                  recommendations: state.aiRecommendations,
                  qualityResults: state.qualityResults,
                })}
                decisionReadiness={state.decisionReadiness}
                repairActions={repairActions}
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
                  handoffSummary={state.handoffSummary}
                  handoffLoading={handoffLoading}
                  transformationCount={state.transformationLog.length}
                  onCsv={exportCsv}
                  onHandoffSummary={generateHandoffSummary}
                  onReport={exportReport}
                  onPng={exportPng}
                  onLog={exportLog}
                  onProjectKit={exportProjectKit}
                />
                <FeedbackForm enabled={aiApiAvailable} />
                <div className="export-render-target" aria-hidden="true" inert>
                  <DashboardPreview
                    refNode={dashboardRef}
                    dataset={state.preparedDataset}
                    decisionReadiness={state.decisionReadiness}
                    recommendation={state.dashboardRecommendation}
                    expandInsights
                    interactive={false}
                    showInsightLinks={false}
                  />
                </div>
              </>
            )}
          </div>
          <AiCoachPanel
            hints={deterministicCoachHints(
              state.currentStep,
              state.decisionReadiness,
              repairActions,
            )}
          />
        </section>
      </div>
    </main>
  );
}

function canNavigateToStepFromState(state: WorkflowState, step: WorkflowStep) {
  if (step === "brief") return true;
  if (step === "upload") return validateDecisionBrief(state.decisionBrief).length === 0;
  if (step === "profile") return state.profilesReady;
  if (step === "recommend") return Boolean(state.aiRecommendations);
  if (step === "validate") return Boolean(state.preparedDataset);
  if (step === "dashboard") return Boolean(state.preparedDataset && state.dashboardRecommendation);
  if (step === "export") return Boolean(state.preparedDataset && state.dashboardRecommendation);
  return false;
}

function formAwareDataset(dataset: Dataset): Dataset {
  if (!dataset.data?.length) return dataset;
  const formDataset = createFormDatasetFromRows(
    dataset.originalFilename ?? `${dataset.name}.${dataset.fileType}`,
    dataset.fileType,
    dataset.data,
    {
      datasetId: dataset.id,
      uploadedAt: dataset.uploadedAt,
    },
  );
  const family = formDataset.inputHints?.formMetadata?.family;
  const detected = formDataset.inputHints?.formDetection?.status === "detected";
  if (!detected || family === "generic_table" || family === "suggested_template") {
    return dataset;
  }
  return {
    ...formDataset,
    formatAssessment: dataset.formatAssessment,
  };
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

function qualityIssueSummary(issue: QualityCheckResult) {
  return [
    issue.severity,
    issue.status,
    issue.checkType,
    issue.description,
    issue.caveat,
    issue.suggestedAction,
  ].filter(Boolean).join(": ");
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
  outputLabel: "review guidance" | "dashboard view"
) {
  const genericUnavailable =
    `AI guidance was unavailable. The app used deterministic ${outputLabel}. Review joins and caveats before action.`;
  if (response.fallbackReason === "app_rate_limit") {
    const retry = response.retryAfterSeconds
      ? ` Try again in about ${formatRetryAfter(response.retryAfterSeconds)}.`
      : " Try again shortly.";
    return `The app AI rate limit was reached, so deterministic ${outputLabel} is being used.${retry}`;
  }
  if (response.fallbackReason === "provider_rate_limit") {
    const retry = response.retryAfterSeconds
      ? ` Try again in about ${formatRetryAfter(response.retryAfterSeconds)}.`
      : " Try again shortly.";
    return `The LLM provider rate limit was reached, so deterministic ${outputLabel} is being used.${retry}`;
  }
  if (response.fallbackReason === "missing_api_key") {
    return `LLM API calls are on, but no server API key is configured, so deterministic ${outputLabel} is being used.`;
  }
  if (response.fallbackReason === "ai_disabled") {
    return `AI is disabled on the server, so deterministic ${outputLabel} is being used.`;
  }
  if (response.fallbackReason === "unauthenticated") {
    return `Sign in to use AI-assisted workflow. Deterministic ${outputLabel} is being used for now.`;
  }
  if (response.fallbackReason === "not_entitled") {
    return `AI-assisted workflow is not enabled for this account, so deterministic ${outputLabel} is being used.`;
  }
  if (response.fallbackReason === "quota_exceeded") {
    return `Daily AI quota is exhausted, so deterministic ${outputLabel} is being used. Continue the workflow or try again after the quota resets.`;
  }
  if (response.fallbackReason === "unsupported_provider") {
    return `The configured LLM provider is not supported by this app, so deterministic ${outputLabel} is being used.`;
  }
  if (response.fallbackReason === "invalid_request") {
    return `The AI guidance request could not be accepted, so deterministic ${outputLabel} is being used.${fallbackDetail(response)}`;
  }
  if (response.fallbackReason === "request_too_large") {
    return `The AI guidance request was too large for the app limits, so deterministic ${outputLabel} is being used.${fallbackDetail(response)}`;
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
    const jsonLabel = outputLabel === "dashboard view" ? "dashboard JSON" : "review guidance JSON";
    return `The LLM response was truncated before the ${jsonLabel} finished, so deterministic ${outputLabel} is being used. Increase LLM_MAX_COMPLETION_TOKENS and retry.`;
  }
  if (response.fallbackReason === "model_response_invalid") {
    return `The LLM returned a response that did not match the dashboard format, so deterministic ${outputLabel} is being used.`;
  }
  if (outputLabel === "dashboard view") {
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
