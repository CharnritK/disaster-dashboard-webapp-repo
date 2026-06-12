import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { isValidElement, type ReactElement } from "react";
import type { Dataset } from "@/types/dataset";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { assessExcelTableRows, parseCsv, parseFile, createTabularDataset, loadSampleDatasets } from "@/lib/fileParsers";
import { profileDataset } from "@/lib/profiling";
import { generateDeterministicJoinRecommendations } from "@/lib/deterministicJoinRecommendations";
import { applyJoinRecommendation, applyJoinRecommendations, prepareSingleDataset, selectJoinPlan } from "@/lib/harmonization";
import { runQualityChecks } from "@/lib/validation";
import { minimizeProfiles, parseWorkflowContext, sanitizeAIRecommendationResponse } from "@/lib/recommendationSchema";
import { generateDeterministicDashboardRecommendation, reconcileDashboardRecommendation } from "@/lib/dashboardRecommendations";
import { computeDashboardInsightFacts } from "@/lib/dashboardInsights";
import { checkRateLimit } from "@/lib/apiSecurity";
import { positiveNumberFromConfig } from "@/lib/config";
import { toCsv } from "@/lib/exportCsv";
import { qualityLinesForPdf } from "@/lib/exportPdf";
import { buildRecommendationRequestBody, requestStructuredRecommendations } from "@/lib/llmClient";
import { aggregateField, aggregateRows, fieldDisplayLabel, inferMetricAggregation, metricDisplayLabel } from "@/lib/chartMetrics";
import {
  assessDecisionReadiness,
  buildEvidenceCoverageSummary,
  evidenceCoverageStatusLabel,
  readinessStatusLabel,
  buildSuggestedCollectionTemplateRows,
  buildSuggestedDataCollectionTemplate,
  createDefaultDecisionBrief,
  validateDecisionBrief,
} from "@/lib/decisionContext";
import { buildDecisionHandoffPacket } from "@/lib/workflowExport";
import { generateFallbackRecommendations, requestAIRecommendations } from "@/lib/recommendations";
import { findLocationFields } from "@/lib/locationFields";
import { enforceVizPolicy } from "@/lib/vizPolicy";
import { validateVizSpec } from "@/lib/vizSpecValidator";

describe("data pipeline", () => {
  it("parses and profiles tabular CSV data", () => {
    const rows = parseCsv("district_code,total_population\nD01,100\nD02,\n");
    const dataset = withProfile(createTabularDataset("population.csv", "csv", "sample", rows));

    expect(dataset.rowCount).toBe(2);
    expect(dataset.profile?.potentialJoinFields).toContain("district_code");
    expect(dataset.profile?.potentialMetricFields).toContain("total_population");
    expect(dataset.profile?.columns.find((column) => column.columnName === "total_population")?.missingCount).toBe(1);
  });

  it("keeps duplicate CSV headers and rejects empty uploaded tables", async () => {
    const rows = parseCsv("district_code,value,value\nD01,10,20\n");
    const headerOnly = await parseFile(new File(["district_code,value\n"], "header-only.csv", { type: "text/csv" }));

    expect(rows[0]).toEqual({
      district_code: "D01",
      value: 10,
      value_2: 20
    });
    expect(headerOnly.error).toBe("header-only.csv does not include any data rows.");
  });

  it("rejects Excel sheets with title rows instead of first-row headers", () => {
    const assessment = assessExcelTableRows(
      "rapid-assessment.xlsx",
      [
        ["Rapid Assessment Round 2"],
        ["district_code", "severity_score", "affected_population"],
        ["D01", 78, 1250],
      ],
      { sheetName: "Assessment", sheetCount: 1 },
    );

    expect(assessment.status).toBe("rejected");
    expect(assessment.issues.some((issue) => issue.title === "Row 1 looks like a title, not headers")).toBe(true);
    expect(assessment.learningTips.join(" ")).toContain("plain column headers");
  });

  it("allows but flags Excel workbooks that need format review", () => {
    const assessment = assessExcelTableRows(
      "monthly-needs.xlsx",
      [
        ["district_code", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
        ["D01", 4, null, null, null, null, null, null, null],
        ["D02", null, 8, null, null, null, null, null, null],
      ],
      { sheetName: "Pivot", sheetCount: 2 },
    );

    expect(assessment.status).toBe("review");
    expect(assessment.issues.map((issue) => issue.title)).toEqual(
      expect.arrayContaining(["Workbook has multiple sheets", "Wide period columns detected"]),
    );
    expect(assessment.learningTips.join(" ")).toContain("long-format tables");
  });

  it("recommends and applies compatible joins", () => {
    const needs = withProfile(createTabularDataset("needs.csv", "csv", "sample", parseCsv("district_code,households\nD01,4\nD02,8\n")));
    const population = withProfile(createTabularDataset("population.csv", "csv", "sample", parseCsv("district_code,total_population\nD01,100\nD02,200\n")));
    const [join] = generateDeterministicJoinRecommendations([needs, population]);
    const result = applyJoinRecommendation([needs, population], join);

    expect(join.sourceColumns[0]).toBe("district_code");
    expect(result.dataset.data?.[0].total_population).toBe(100);
    expect(result.dataset.data?.[0].__join_matched).toBe(true);
    expect(result.transformations[0].stepType).toBe("join");
    expect(result.transformations).toHaveLength(1);
  });

  it("applies cleaning transforms to target columns renamed during joins", () => {
    const source = withProfile(createTabularDataset("needs.csv", "csv", "sample", [
      { district_code: "D01", value: " 4 " }
    ]));
    const target = withProfile(createTabularDataset("population.csv", "csv", "sample", [
      { district_code: "D01", value: "100" }
    ]));
    const [join] = generateDeterministicJoinRecommendations([source, target]);
    const result = applyJoinRecommendation([source, target], join, [
      {
        id: "clean-values",
        title: "Convert numeric text",
        affectedColumns: ["value"],
        transform: { type: "convert_numeric_strings", columns: ["value"] },
        suggestedAction: "Convert numeric-looking text values to numbers.",
        rationale: "Numeric conversion keeps joined metrics usable.",
        confidence: 0.9
      }
    ]);

    expect(result.dataset.data?.[0].value).toBe(4);
    expect(result.dataset.data?.[0].population_value).toBe(100);
    expect(result.transformations.find((step) => step.stepType === "cleaning")?.operations?.[0].columns).toEqual([
      "value",
      "population_value"
    ]);
  });

  it("applies a connected join plan across more than two datasets", () => {
    const needs = withProfile(createTabularDataset("needs.csv", "csv", "sample", parseCsv("district_code,households\nD01,4\nD02,8\n")));
    const population = withProfile(createTabularDataset("population.csv", "csv", "sample", parseCsv("district_code,total_population\nD01,100\nD02,200\n")));
    const services = withProfile(createTabularDataset("services.csv", "csv", "sample", parseCsv("district_code,clinics\nD01,2\nD02,1\n")));
    const recommendations = generateDeterministicJoinRecommendations([needs, population, services]);
    const plan = selectJoinPlan([needs, population, services], recommendations);
    const result = applyJoinRecommendations([needs, population, services], recommendations);

    expect(plan).toHaveLength(2);
    expect(result.appliedJoinRecommendations).toHaveLength(2);
    expect(result.dataset.data?.[0].total_population).toBe(100);
    expect(result.dataset.data?.[0].clinics).toBe(2);
    expect(result.transformations.filter((step) => step.stepType === "join")).toHaveLength(2);
  });

  it("reports join completeness in quality checks", () => {
    const needs = withProfile(createTabularDataset("needs.csv", "csv", "sample", parseCsv("district_code,households\nD01,4\nD99,8\n")));
    const population = withProfile(createTabularDataset("population.csv", "csv", "sample", parseCsv("district_code,total_population\nD01,100\nD02,200\n")));
    const [join] = generateDeterministicJoinRecommendations([needs, population]);
    const result = applyJoinRecommendation([needs, population], join);
    const quality = runQualityChecks(withProfile(result.dataset));

    expect(quality.find((issue) => issue.id === "join-completeness")?.description).toContain("50%");
  });

  it("validates workflow context and sanitizes model responses", () => {
    const parsed = parseWorkflowContext({
      mode: "single",
      profiles: [profileDataset(createTabularDataset("needs.csv", "csv", "sample", parseCsv("id,value\nA,1\n")))]
    });
    const fallback = {
      summary: "Fallback",
      recommendedPath: { title: "Use fallback", rationale: "Valid deterministic fallback", confidence: 0.5, actions: ["Accept"] },
      assumptions: ["fallback"]
    };
    const sanitized = sanitizeAIRecommendationResponse({
      summary: "Model summary",
      recommendedPath: { title: "Model path", rationale: "Model rationale", confidence: 2, actions: ["Accept", "Skip join", "Use dataset as-is", "Adjust"] },
      joinRecommendations: [
        {
          id: "llm-join",
          sourceDatasetId: "source",
          targetDatasetId: "target",
          sourceColumns: ["district_code"],
          targetColumns: ["district_code"],
          joinType: "left",
          confidenceScore: 0.9,
          rationale: "Shared district_code values should join.",
          risks: [],
          valueOverlapPercentage: 0.8,
          estimatedMatchRate: 0.95
        }
      ],
      cleaningRecommendations: [
        {
          title: "Convert numeric text",
          affectedColumns: ["value"],
          transform: { type: "convert_numeric_strings", columns: ["value"] },
          suggestedAction: "Convert numeric-looking text values before publishing.",
          rationale: "Numeric strings can distort totals.",
          confidence: 2
        }
      ],
      dashboardRecommendations: {
        summaryMetrics: ["Total records"],
        groupByFields: ["district_name"],
        demographicFields: [],
        metricFields: ["value"],
        charts: [{ id: "ai-chart", chartType: "bar", title: "AI chart", xField: "", yField: "", groupByField: "district_name", metricField: "value", rationale: "Useful split", section: "comparisons", priority: 2 }],
        insights: [{ title: "Monitor coverage", description: "Coverage varies across districts.", severity: "medium", insightType: "comparison", evidence: ["North: 4"], recommendedAction: "Review high-need districts.", confidence: 2, linkedChartId: "ai-chart" }]
      },
      assumptions: ["profile-only"]
    }, fallback);

    expect("error" in parsed).toBe(false);
    expect(sanitized.recommendedPath.confidence).toBe(1);
    expect(sanitized.recommendedPath.actions).toEqual(["Accept", "Adjust"]);
    expect(sanitized.joinRecommendations?.[0].valueOverlapPercentage).toBe(80);
    expect(sanitized.joinRecommendations?.[0].estimatedMatchRate).toBe(95);
    expect(sanitized.cleaningRecommendations?.[0].confidence).toBe(1);
    expect(sanitized.cleaningRecommendations?.[0].transform.type).toBe("convert_numeric_strings");
    expect(sanitized.dashboardRecommendations?.charts[0].id).toBe("ai-chart");
    expect(sanitized.dashboardRecommendations?.charts[0].xField).toBeUndefined();
    expect(sanitized.dashboardRecommendations?.charts[0].section).toBe("comparisons");
    expect(sanitized.dashboardRecommendations?.insights?.[0].severity).toBe("medium");
    expect(sanitized.dashboardRecommendations?.insights?.[0].insightType).toBe("comparison");
    expect(sanitized.dashboardRecommendations?.insights?.[0].evidence).toEqual(["North: 4"]);
    expect(sanitized.dashboardRecommendations?.insights?.[0].confidence).toBe(1);
    expect(sanitized.assumptions).toEqual(["profile-only"]);
  });

  it("sanitizes minimized decision context in recommendation requests", () => {
    const parsed = parseWorkflowContext({
      mode: "single",
      decisionContext: {
        useCaseId: "response_prioritization",
        decisionQuestion: `${"Which districts should receive immediate water support? ".repeat(12)}<script>alert(1)</script>`,
        intendedAction: "Prioritize response teams for the next distribution cycle.",
        decisionMaker: "Emergency operations lead",
        geographyScope: "Districts D01-D07",
        timeframe: "Next 72 hours",
        requiredEvidence: [
          "Admin geography",
          "Need severity",
          "Affected population",
          "Response gap",
          "Capacity signal",
          "Extra evidence that should be trimmed from the minimized payload"
        ]
      },
      profiles: [
        profileDataset(createTabularDataset("needs.csv", "csv", "sample", parseCsv("district_code,needs_score\nD01,78\n")))
      ]
    });

    expect(parsed).not.toHaveProperty("error");
    if ("error" in parsed) throw new Error(parsed.error);

    const context = parsed as typeof parsed & {
      decisionContext?: {
        useCaseId: string;
        decisionQuestion: string;
        requiredEvidence: string[];
      };
    };

    expect(context.decisionContext?.useCaseId).toBe("response_prioritization");
    expect(context.decisionContext?.decisionQuestion).not.toContain("<script>");
    expect(context.decisionContext?.decisionQuestion.length).toBeLessThanOrEqual(240);
    expect(context.decisionContext?.requiredEvidence).toEqual([
      "Admin geography",
      "Need severity",
      "Affected population",
      "Response gap",
      "Capacity signal"
    ]);
  });

  it("pre-fills the response-prioritization decision brief from the selected template", () => {
    const brief = createDefaultDecisionBrief();

    expect(validateDecisionBrief(brief)).toEqual([]);
    expect(brief.useCaseId).toBe("response_prioritization");
    expect(brief.decisionQuestion).toContain("districts");
    expect(brief.intendedAction).toContain("Prioritize");
    expect(brief.decisionMaker).toContain("Emergency operations");
    expect(brief.geographyScope).toContain("districts");
    expect(brief.timeframe).toContain("72 hours");
    expect(brief.requiredEvidence).toEqual([
      "Admin geography",
      "Need severity",
      "Affected population",
      "Response gap",
      "Capacity signal",
    ]);
  });

  it("populates a suggested data collection template from the decision brief", () => {
    const brief = createDefaultDecisionBrief();
    const template = buildSuggestedDataCollectionTemplate(brief);

    expect(template.title).toBe("Suggested response-prioritization data collection template");
    expect(template.decisionQuestion).toBe(brief.decisionQuestion);
    expect(template.geographyScope).toBe(brief.geographyScope);
    expect(template.timeframe).toBe(brief.timeframe);
    expect(template.fields.map((field) => field.name)).toEqual([
      "admin_area",
      "admin_code",
      "observation_date",
      "severity_score",
      "affected_population",
      "population_denominator",
      "response_gap_percent",
      "current_capacity",
      "data_source",
      "notes",
    ]);
    expect(template.fields.find((field) => field.name === "response_gap_percent")).toEqual(
      expect.objectContaining({
        evidenceNeed: "Response gap",
        type: "percent",
        required: true,
        caveat: expect.stringContaining("0-100"),
      })
    );
  });

  it("updates suggested collection fields when required evidence changes", () => {
    const brief = {
      ...createDefaultDecisionBrief(),
      requiredEvidence: ["Admin geography", "Response gap"],
    };
    const template = buildSuggestedDataCollectionTemplate(brief);
    const fieldNames = template.fields.map((field) => field.name);

    expect(fieldNames).toEqual([
      "admin_area",
      "admin_code",
      "observation_date",
      "response_gap_percent",
      "data_source",
      "notes",
    ]);
    expect(fieldNames).not.toContain("severity_score");
    expect(fieldNames).not.toContain("affected_population");
    expect(fieldNames).not.toContain("current_capacity");
  });

  it("builds CSV-ready rows from the suggested collection template", () => {
    const template = buildSuggestedDataCollectionTemplate(createDefaultDecisionBrief());
    const [exampleRow] = buildSuggestedCollectionTemplateRows(template);

    expect(Object.keys(exampleRow)).toEqual(template.fields.map((field) => field.name));
    expect(exampleRow.response_gap_percent).toBe("42");
    expect(toCsv([exampleRow]).split("\n")[0]).toContain("admin_area");
  });

  it("maps fragmented sample datasets to response-prioritization evidence", () => {
    const needs = withProfile(createTabularDataset(
      "demo_needs_assessment.csv",
      "csv",
      "sample",
      parseCsv("admin_pcode,district_name,people_assessed,need_severity_score,response_gap_percent\nADM001,North,642,78,46\nADM002,Central,792,74,41\n")
    ));
    const capacity = withProfile(createTabularDataset(
      "demo_service_capacity.csv",
      "csv",
      "sample",
      parseCsv("district_id,district_name,health_facility_count,evacuation_center_count\nADM001,North,5,7\nADM002,Central,8,9\n")
    ));
    const summary = buildEvidenceCoverageSummary(
      [needs, capacity],
      createDefaultDecisionBrief()
    );

    expect(summary.coveredCount + summary.ambiguousCount).toBe(5);
    expect(summary.missingCount).toBe(0);
    expect(summary.items.find((item) => item.evidenceNeed === "Need severity")).toEqual(
      expect.objectContaining({
        status: "covered",
        candidates: expect.arrayContaining([
          expect.objectContaining({
            datasetName: "demo_needs_assessment",
            columnName: "need_severity_score",
            confidence: expect.any(Number),
          }),
        ]),
      })
    );
    expect(summary.items.find((item) => item.evidenceNeed === "Capacity signal")?.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          datasetName: "demo_service_capacity",
          columnName: "health_facility_count",
        }),
      ])
    );
  });

  it("marks missing required evidence with plain next actions", () => {
    const dataset = withProfile(createTabularDataset(
      "severity_only.csv",
      "csv",
      "sample",
      parseCsv("district_name,need_severity_score\nNorth,78\nSouth,64\n")
    ));
    const summary = buildEvidenceCoverageSummary(
      [dataset],
      responsePrioritizationBrief(["Affected population", "Response gap"])
    );

    expect(summary.missingCount).toBe(2);
    expect(summary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          evidenceNeed: "Affected population",
          status: "missing",
          caveat: expect.stringContaining("affected population"),
          nextAction: expect.stringContaining("Add or combine"),
        }),
        expect.objectContaining({
          evidenceNeed: "Response gap",
          status: "missing",
          nextAction: expect.stringContaining("response gap"),
        }),
      ])
    );
  });

  it("marks ambiguous evidence when multiple candidates are similarly plausible", () => {
    const needs = withProfile(createTabularDataset(
      "needs_one.csv",
      "csv",
      "sample",
      parseCsv("district_code,response_gap_percent\nD01,44\nD02,39\n")
    ));
    const services = withProfile(createTabularDataset(
      "needs_two.csv",
      "csv",
      "sample",
      parseCsv("admin_code,coverage_gap_percent\nD01,42\nD02,40\n")
    ));
    const summary = buildEvidenceCoverageSummary(
      [needs, services],
      responsePrioritizationBrief(["Response gap"])
    );

    expect(summary.ambiguousCount).toBe(1);
    expect(summary.items[0]).toEqual(
      expect.objectContaining({
        evidenceNeed: "Response gap",
        status: "ambiguous",
        candidates: expect.arrayContaining([
          expect.objectContaining({ columnName: "response_gap_percent" }),
          expect.objectContaining({ columnName: "coverage_gap_percent" }),
        ]),
        nextAction: expect.stringContaining("Choose"),
      })
    );
  });

  it("builds evidence coverage without AI or recommendation state", () => {
    const dataset = withProfile(createTabularDataset(
      "local.csv",
      "csv",
      "sample",
      parseCsv("admin_code,affected_population,response_gap_percent\nD01,100,20\n")
    ));
    const summary = buildEvidenceCoverageSummary(
      [dataset],
      responsePrioritizationBrief(["Admin geography", "Affected population", "Response gap"])
    );

    expect(summary.items.map((item) => item.evidenceNeed)).toEqual([
      "Admin geography",
      "Affected population",
      "Response gap",
    ]);
    expect(summary.items.every((item) => item.candidates.every((candidate) => candidate.datasetId === dataset.id))).toBe(true);
  });

  it("labels evidence and readiness statuses for no-code review", () => {
    expect(evidenceCoverageStatusLabel("covered")).toBe("Covered");
    expect(evidenceCoverageStatusLabel("ambiguous")).toBe("Needs review");
    expect(evidenceCoverageStatusLabel("missing")).toBe("Missing");
    expect(readinessStatusLabel("ready")).toBe("Ready for review");
    expect(readinessStatusLabel("review_needed")).toBe("Review needed");
    expect(readinessStatusLabel("decision_unsafe")).toBe("Not safe for action yet");
  });

  it("loads fragmented and risky quality demo sample data", async () => {
    const originalFetch = globalThis.fetch;
    vi.stubGlobal("fetch", async (path: string) => ({
      text: async () => readFileSync(`public${path}`, "utf8"),
    }));

    const fragmented = await loadSampleDatasets("fragmented");
    const risky = await loadSampleDatasets("quality-risk");

    expect(fragmented.map((dataset) => dataset.originalFilename)).toEqual([
      "demo_needs_assessment.csv",
      "demo_population_baseline.csv",
      "demo_service_capacity.csv",
    ]);
    expect(risky).toHaveLength(1);
    expect(risky[0].originalFilename).toBe("demo_quality_risk.csv");
    expect(risky[0].data?.some((row) => row.response_gap_percent === 125)).toBe(true);

    vi.stubGlobal("fetch", originalFetch);
  });

  it("fragmented demo data produces multi-source evidence coverage", () => {
    const needs = withProfile(createTabularDataset(
      "demo_needs_assessment.csv",
      "csv",
      "sample",
      parseCsv(readFileSync("public/samples/demo_needs_assessment.csv", "utf8"))
    ));
    const population = withProfile(createTabularDataset(
      "demo_population_baseline.csv",
      "csv",
      "sample",
      parseCsv(readFileSync("public/samples/demo_population_baseline.csv", "utf8"))
    ));
    const capacity = withProfile(createTabularDataset(
      "demo_service_capacity.csv",
      "csv",
      "sample",
      parseCsv(readFileSync("public/samples/demo_service_capacity.csv", "utf8"))
    ));
    const summary = buildEvidenceCoverageSummary([needs, population, capacity], createDefaultDecisionBrief());
    const candidateDatasetNames = new Set(
      summary.items.flatMap((item) => item.candidates.map((candidate) => candidate.datasetName))
    );

    expect(summary.missingCount).toBe(0);
    expect(candidateDatasetNames).toEqual(
      new Set(["demo_needs_assessment", "demo_population_baseline", "demo_service_capacity"])
    );
  });

  it("quality-risk sample triggers invalid decision values and decision unsafe readiness", () => {
    const dataset = withProfile(createTabularDataset(
      "demo_quality_risk.csv",
      "csv",
      "sample",
      parseCsv(readFileSync("public/samples/demo_quality_risk.csv", "utf8"))
    ));
    const quality = runQualityChecks(dataset, responsePrioritizationBrief(["Admin geography", "Need severity", "Affected population", "Response gap"]));
    const readiness = assessDecisionReadiness(dataset, createDefaultDecisionBrief(), quality).readiness;

    expect(quality).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "decision-invalid-percent-response_gap_percent" }),
        expect.objectContaining({ id: "decision-invalid-negative-count-affected_population" }),
      ])
    );
    expect(readiness.status).toBe("decision_unsafe");
    expect(readinessStatusLabel(readiness.status)).toBe("Not safe for action yet");
  });

  it("builds a decision handoff packet with evidence coverage and lineage", () => {
    const dataset = withProfile(createTabularDataset(
      "demo_needs_assessment.csv",
      "csv",
      "sample",
      parseCsv("admin_pcode,district_name,people_assessed,need_severity_score,response_gap_percent\nADM001,North,642,78,46\n")
    ));
    const brief = createDefaultDecisionBrief();
    const evidenceCoverage = buildEvidenceCoverageSummary([dataset], brief);
    const decisionReadiness = assessDecisionReadiness(dataset, brief, runQualityChecks(dataset, brief)).readiness;
    const packet = buildDecisionHandoffPacket({
      generatedAt: "2026-06-12T00:00:00.000Z",
      decisionBrief: brief,
      evidenceCoverage,
      decisionReadiness,
      datasets: [dataset],
      selectedJoinRecommendations: [],
      qualityResults: [],
      transformationLog: [],
      aiMode: "deterministic",
    });

    expect(packet.decisionContext.question).toBe(brief.decisionQuestion);
    expect(packet.evidenceCoverage.items.length).toBe(brief.requiredEvidence.length);
    expect(packet.datasetLineage).toEqual([
      expect.objectContaining({
        name: "demo_needs_assessment",
        sourceType: "sample",
        rows: 1,
        fields: expect.arrayContaining(["admin_pcode", "people_assessed"]),
      }),
    ]);
  });

  it("handoff packet records deterministic fallback mode", () => {
    const packet = buildDecisionHandoffPacket({
      generatedAt: "2026-06-12T00:00:00.000Z",
      decisionBrief: createDefaultDecisionBrief(),
      evidenceCoverage: buildEvidenceCoverageSummary([], createDefaultDecisionBrief()),
      decisionReadiness: assessDecisionReadiness(
        createTabularDataset("empty.csv", "csv", "sample", []),
        createDefaultDecisionBrief(),
        []
      ).readiness,
      datasets: [],
      selectedJoinRecommendations: [],
      qualityResults: [],
      transformationLog: [],
      aiMode: "fallback",
    });

    expect(packet.aiAssistance.mode).toBe("fallback");
    expect(packet.aiAssistance.summary).toContain("deterministic recommendations");
  });

  it("decision unsafe packet includes review-only language", () => {
    const brief = createDefaultDecisionBrief();
    const dataset = withProfile(createTabularDataset(
      "risk.csv",
      "csv",
      "sample",
      parseCsv("district_code,affected_population,response_gap_percent\nD01,-1,125\n")
    ));
    const decisionReadiness = assessDecisionReadiness(dataset, brief, runQualityChecks(dataset, brief)).readiness;
    const packet = buildDecisionHandoffPacket({
      generatedAt: "2026-06-12T00:00:00.000Z",
      decisionBrief: brief,
      evidenceCoverage: buildEvidenceCoverageSummary([dataset], brief),
      decisionReadiness,
      datasets: [dataset],
      selectedJoinRecommendations: [],
      qualityResults: runQualityChecks(dataset, brief),
      transformationLog: [],
      aiMode: "deterministic",
    });

    expect(packet.decisionReadiness?.status).toBe("decision_unsafe");
    expect(packet.reviewNotice).toContain("Dashboard generation is allowed for review, not for automatic action.");
    expect(packet.limitations).toEqual(
      expect.arrayContaining([
        expect.stringContaining("review-only"),
      ])
    );
  });

  it("flags missing response-prioritization evidence as decision readiness findings", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("district_code,needs_score\nD01,78\nD02,64\n")
    ));
    const quality = (runQualityChecks as unknown as (...args: unknown[]) => ReturnType<typeof runQualityChecks>)(
      dataset,
      {
        useCaseId: "response_prioritization",
        decisionQuestion: "Which districts should receive first response?",
        intendedAction: "Prioritize response teams.",
        decisionMaker: "Emergency operations lead",
        geographyScope: "Districts",
        timeframe: "Next 72 hours",
        requiredEvidence: ["Affected population", "Response gap"]
      }
    );

    expect(quality).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "decision-missing-affected-population",
          status: "fail",
          decisionArea: "Response prioritization",
          evidenceNeed: "Affected population"
        }),
        expect.objectContaining({
          id: "decision-missing-response-gap",
          decisionArea: "Response prioritization",
          evidenceNeed: "Response gap"
        })
      ])
    );
  });

  it("carries decision caveats into dashboard chart recommendations", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("district_name,needs_score,response_gap_percent\nNorth,78,46\nSouth,64,37\n")
    ));
    const recommendation = generateDeterministicDashboardRecommendation(dataset, {
      qualityResults: [
        {
          id: "decision-missing-affected-population",
          checkType: "Decision evidence missing",
          status: "fail",
          severity: "high",
          description: "Affected population evidence is missing.",
          affectedColumns: ["needs_score"],
          decisionArea: "Response prioritization",
          evidenceNeed: "Affected population",
          caveat: "Do not rank districts by need without an affected population denominator."
        }
      ]
    });
    const chart = recommendation.charts.find((item) => item.metricField === "needs_score");

    expect(chart?.rationale).toContain("Do not rank districts by need without an affected population denominator.");
    expect(recommendation.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          insightType: "quality",
          evidence: expect.arrayContaining([
            "Do not rank districts by need without an affected population denominator."
          ])
        })
      ])
    );
  });

  it("validates required decision brief fields before data workflow progression", () => {
    const missing = validateDecisionBrief({
      useCaseId: "response_prioritization",
      decisionQuestion: "Which districts should receive first response?",
      intendedAction: "",
      decisionMaker: "Emergency operations lead",
      geographyScope: "",
      timeframe: "Next 72 hours",
      requiredEvidence: []
    });

    expect(missing).toEqual(["intended action", "geography scope", "required evidence"]);
  });

  it("marks weak join completeness as decision-unsafe with a caveat", () => {
    const needs = withProfile(createTabularDataset("needs.csv", "csv", "sample", parseCsv("district_code,needs_score\nD01,78\nD99,64\n")));
    const population = withProfile(createTabularDataset("population.csv", "csv", "sample", parseCsv("district_code,total_population\nD01,100\nD02,200\n")));
    const [join] = generateDeterministicJoinRecommendations([needs, population]);
    const joined = withProfile(applyJoinRecommendation([needs, population], join).dataset);
    const decisionBrief = responsePrioritizationBrief(["Affected population", "Response gap"]);
    const quality = runQualityChecks(joined, decisionBrief);
    const readiness = assessDecisionReadiness(joined, decisionBrief, quality).readiness;
    const joinCompleteness = quality.find((issue) => issue.id === "join-completeness");

    expect(readiness.status).toBe("decision_unsafe");
    expect(joinCompleteness?.caveat).toBe("Do not use joined rankings for response prioritization until unmatched records are reviewed.");
  });

  it("flags invalid response-prioritization values before recommendations", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("district_code,households_assessed,response_gap_percent\nD01,-5,125\nD02,20,40\n")
    ));
    const quality = runQualityChecks(dataset, responsePrioritizationBrief(["Affected population", "Response gap"]));

    expect(quality).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "decision-invalid-negative-count-households_assessed",
          status: "fail",
          evidenceNeed: "Affected population"
        }),
        expect.objectContaining({
          id: "decision-invalid-percent-response_gap_percent",
          status: "fail",
          evidenceNeed: "Response gap"
        })
      ])
    );
  });

  it("formats PDF quality lines with decision readiness caveats", () => {
    const lines = qualityLinesForPdf([
      {
        id: "decision-invalid-percent-response_gap_percent",
        checkType: "Invalid decision values",
        status: "fail",
        severity: "high",
        description: "Values in response_gap_percent are outside 0-100.",
        evidenceNeed: "Response gap",
        caveat: "Do not use response-gap charts for action until invalid percentages are corrected."
      }
    ]);

    expect(lines[0]).toBe(
      "FAIL: Values in response_gap_percent are outside 0-100. Caveat: Do not use response-gap charts for action until invalid percentages are corrected."
    );
  });

  it("applies typed safe cleaning transforms during harmonization", () => {
    const dataset = createTabularDataset("messy.csv", "csv", "sample", [
      { district_name: " North ", households: "120", active: "true", note: "   " },
      { district_name: "South", households: "80", active: "false", note: "ready" }
    ]);
    const result = prepareSingleDataset(dataset);

    expect(result.dataset.data?.[0].district_name).toBe("North");
    expect(result.dataset.data?.[0].households).toBe(120);
    expect(result.dataset.data?.[0].active).toBe(true);
    expect(result.dataset.data?.[0].note).toBeNull();
    expect(result.transformations[0].description).toContain("Applied typed cleaning transforms");
    expect(result.transformations[0].operations?.find((operation) => operation.type === "trim_whitespace")?.changedCells).toBe(2);
    expect(result.transformations[0].operations?.find((operation) => operation.type === "trim_whitespace")?.scannedCells).toBe(4);
    expect(result.transformations[0].operations?.find((operation) => operation.type === "convert_numeric_strings")?.changedCells).toBe(2);
    expect(result.transformations[0].assumptions?.some((assumption) => assumption.includes("changed cell"))).toBe(true);
  });

  it("shows safe cleaning checks while only logging actual cleaning changes", () => {
    const clean = withProfile(createTabularDataset("clean.csv", "csv", "sample", parseCsv("id,value\nA,1\nB,2\n")));
    const dirty = withProfile(createTabularDataset("dirty.csv", "csv", "sample", [
      { id: " A ", value: "1", active: "true" },
      { id: "B", value: "2", active: "false" }
    ]));

    expect(generateFallbackRecommendations([clean]).cleaningRecommendations?.map((recommendation) => recommendation.transform.type)).toEqual([
      "trim_whitespace",
      "convert_numeric_strings"
    ]);
    expect(prepareSingleDataset(clean, generateFallbackRecommendations([clean]).cleaningRecommendations).transformations).toEqual([]);
    expect(generateFallbackRecommendations([dirty]).cleaningRecommendations?.map((recommendation) => recommendation.transform.type)).toEqual([
      "trim_whitespace",
      "convert_numeric_strings",
      "convert_boolean_strings"
    ]);
  });

  it("enforces recommendation request limits without redacting raw sample values", () => {
    const profile = profileDataset(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("id,value\nA-sensitive-sample,1\nB-sensitive-sample,2\n")
    ));
    const parsed = parseWorkflowContext({
      mode: "single",
      profiles: [profile],
      qualitySummary: ["x".repeat(20), "second"],
      dashboardFacts: [
        {
          id: "fact-long",
          insightType: "coverage",
          title: "Long fact title",
          description: "y".repeat(20),
          severity: "info",
          evidence: ["z".repeat(20)],
          confidence: 1
        }
      ]
    }, {
      maxProfiles: 1,
      maxColumnsPerProfile: 5,
      maxSampleValuesPerColumn: 1,
      maxStringLength: 8,
      maxDashboardFacts: 1,
      maxSummaryItems: 1
    });
    const rejected = parseWorkflowContext({
      mode: "single",
      profiles: [profile, profile]
    }, {
      maxProfiles: 1,
      maxColumnsPerProfile: 5,
      maxSampleValuesPerColumn: 1,
      maxStringLength: 8,
      maxDashboardFacts: 1,
      maxSummaryItems: 1
    });

    expect("error" in parsed).toBe(false);
    if ("error" in parsed) throw new Error(parsed.error);
    expect(parsed.profiles[0].columns[0].sampleValues).toEqual(["A-sensit"]);
    expect(parsed.qualitySummary).toEqual(["xxxxxxxx"]);
    expect(parsed.dashboardFacts?.[0].description).toBe("yyyyyyyy");
    expect("error" in rejected).toBe(true);
  });

  it("builds strict OpenAI request bodies with storage and token controls", () => {
    const profile = profileDataset(createTabularDataset("needs.csv", "csv", "sample", parseCsv("id,value\nA,1\n")));
    const body = buildRecommendationRequestBody({
      mode: "single",
      profiles: [profile]
    }, {
      model: "gpt-4.1-mini",
      maxCompletionTokens: 500,
      safetyIdentifier: "anon_test"
    });

    expect(body.store).toBe(false);
    expect(body.max_completion_tokens).toBe(500);
    expect(body.safety_identifier).toBe("anon_test");
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.messages[0].content).toContain("Dataset to Dashboard");
    expect(body.messages[0].content).toContain("Return joinRecommendations and cleaningRecommendations as empty arrays.");
    expect(
      body.response_format.json_schema.schema.properties.dashboardRecommendations.properties.charts.items.properties.aggregation.enum
    ).toEqual(["sum", "average", "count"]);
    const chartProperties =
      body.response_format.json_schema.schema.properties.dashboardRecommendations.properties.charts.items.properties;
    expect(chartProperties.chartType.enum).toEqual(["map", "area", "choropleth", "bar", "line", "pie", "scatter", "missingness", "table", "summary"]);
    expect(chartProperties.xField.type).toEqual(["string", "null"]);
    expect(chartProperties.metricField.type).toEqual(["string", "null"]);
    expect(
      body.response_format.json_schema.schema.properties.dashboardRecommendations.properties.insights.items.properties.linkedChartId.type
    ).toEqual(["string", "null"]);

    const workflowBody = buildRecommendationRequestBody({
      mode: "single",
      profiles: [profile]
    }, {
      model: "gpt-4.1-mini",
      recommendationScope: "workflow",
      safetyIdentifier: "anon_test"
    });

    expect(workflowBody.max_completion_tokens).toBe(3200);
    expect(workflowBody.messages[0].content).toContain("Profile to Harmonize");
    expect(workflowBody.messages[0].content).toContain("two distinct datasets");
    expect(workflowBody.messages[0].content).toContain("Do not spend tokens planning dashboard charts yet.");
    expect(JSON.parse(workflowBody.messages[1].content).recommendationScope).toBe("workflow");
  });

  it("marks provider rate-limit fallbacks for clearer UI warnings", async () => {
    const profile = profileDataset(createTabularDataset("needs.csv", "csv", "sample", parseCsv("id,value\nA,1\n")));
    const fallback = {
      source: "deterministic" as const,
      summary: "Fallback",
      recommendedPath: { title: "Use fallback", rationale: "Valid deterministic fallback", confidence: 0.5, actions: ["Accept"] },
      assumptions: ["fallback"]
    };

    vi.stubGlobal("fetch", vi.fn(async () => new Response("", {
      status: 429,
      headers: { "retry-after": "12" }
    })));

    try {
      const response = await requestStructuredRecommendations({
        mode: "single",
        profiles: [profile]
      }, fallback, {
        provider: "openai",
        model: "gpt-5.4-mini",
        apiKey: "test-key",
        timeoutMs: 1000
      });

      expect(response.source).toBe("deterministic");
      expect(response.fallbackReason).toBe("provider_rate_limit");
      expect(response.retryAfterSeconds).toBe(12);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("surfaces app recommendation rate limits to the client", async () => {
    const profile = profileDataset(createTabularDataset("needs.csv", "csv", "sample", parseCsv("id,value\nA,1\n")));

    vi.stubGlobal("fetch", vi.fn(async () => Response.json(
      { error: "Too many recommendation requests. Try again later." },
      {
        status: 429,
        headers: { "retry-after": "7" }
      }
    )));

    try {
      await expect(requestAIRecommendations({
        mode: "single",
        profiles: [profile]
      }, true, "workflow")).rejects.toMatchObject({
        fallbackReason: "app_rate_limit",
        retryAfterSeconds: 7
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("surfaces oversized app recommendation requests to the client", async () => {
    const profile = profileDataset(createTabularDataset("needs.csv", "csv", "sample", parseCsv("id,value\nA,1\n")));

    vi.stubGlobal("fetch", vi.fn(async () => Response.json(
      { error: "Recommendation request is too large." },
      { status: 413 }
    )));

    try {
      await requestAIRecommendations({
        mode: "single",
        profiles: [profile]
      }, true, "dashboard");
      throw new Error("Expected requestAIRecommendations to reject.");
    } catch (error) {
      expect(error).toMatchObject({ fallbackReason: "request_too_large" });
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Recommendation request is too large.");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("marks truncated model responses before falling back", async () => {
    const profile = profileDataset(createTabularDataset("needs.csv", "csv", "sample", parseCsv("id,value\nA,1\n")));
    const fallback = {
      source: "deterministic" as const,
      summary: "Fallback",
      recommendedPath: { title: "Use fallback", rationale: "Valid deterministic fallback", confidence: 0.5, actions: ["Accept"] },
      assumptions: ["fallback"]
    };

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      choices: [
        {
          finish_reason: "length",
          message: { content: "{\"summary\":\"unfinished\"" }
        }
      ]
    })));

    try {
      const response = await requestStructuredRecommendations({
        mode: "single",
        profiles: [profile]
      }, fallback, {
        provider: "openai",
        model: "gpt-5.4-mini",
        apiKey: "test-key",
        timeoutMs: 1000
      });

      expect(response.source).toBe("deterministic");
      expect(response.fallbackReason).toBe("model_response_truncated");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rate limits anonymous recommendation buckets", () => {
    const key = `test-key-${crypto.randomUUID()}`;
    const config = { maxRequests: 2, windowMs: 1000 };

    expect(checkRateLimit(key, config, 1000).limited).toBe(false);
    expect(checkRateLimit(key, config, 1100).limited).toBe(false);
    expect(checkRateLimit(key, config, 1200).limited).toBe(true);
    expect(checkRateLimit(key, config, 2101).limited).toBe(false);
  });

  it("neutralizes spreadsheet formulas in CSV exports", () => {
    const csv = toCsv([
      {
        name: "North",
        risky: "=HYPERLINK(\"https://example.com\")",
        alsoRisky: "  +SUM(1,2)",
        "@riskyHeader": "safe"
      }
    ]);

    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("\"'  +SUM(1,2)\"");
    expect(csv.split("\n")[0]).toContain("'@riskyHeader");
  });

  it("falls back on invalid numeric setup config", () => {
    expect(positiveNumberFromConfig(undefined, 1, 0.1)).toBe(1);
    expect(positiveNumberFromConfig("", 1, 0.1)).toBe(1);
    expect(positiveNumberFromConfig("not-a-number", 1, 0.1)).toBe(1);
    expect(positiveNumberFromConfig("-5", 1, 0.1)).toBe(0.1);
    expect(positiveNumberFromConfig("2.5", 1, 0.1)).toBe(2.5);
  });

  it("aggregates dashboard metrics by field semantics", () => {
    const rows = parseCsv(
      "district,total_households,response_gap_percent\nNorth,10,20\nNorth,20,40\nSouth,5,80\nSouth,,\n"
    );

    expect(inferMetricAggregation("response_gap_percent")).toBe("average");
    expect(inferMetricAggregation("total_households")).toBe("sum");
    expect(fieldDisplayLabel("response_gap_percent")).toBe("Response Gap Percent");
    expect(metricDisplayLabel("total_households", "sum")).toBe("Total Households");
    expect(aggregateField(rows, "response_gap_percent", "average")).toBeCloseTo(46.67, 1);
    expect(aggregateRows(rows, "district", "response_gap_percent", "average")).toEqual([
      expect.objectContaining({ label: "South", value: 80, count: 1 }),
      expect.objectContaining({ label: "North", value: 30, count: 2 })
    ]);
    expect(aggregateRows(rows, "district", "total_households", "sum")).toEqual([
      expect.objectContaining({ label: "North", value: 30 }),
      expect.objectContaining({ label: "South", value: 5 })
    ]);
  });

  it("enforces deterministic visualization policy without mutating chart specs", () => {
    const dataset = withProfile(createTabularDataset(
      "synthetic-needs.csv",
      "csv",
      "sample",
      parseCsv([
        "district_name,reported_at,affected_households,response_gap_percent",
        "A,2026-01-01,10,20",
        "B,2026-01-01,9,30",
        "C,2026-01-01,8,40",
        "D,2026-01-01,7,50",
        "E,2026-01-01,6,60",
        "F,2026-01-01,5,70"
      ].join("\n"))
    ));
    const chart = {
      id: "share-by-district",
      chartType: "pie" as const,
      title: "Share by district",
      rationale: "Part-to-whole comparison.",
      groupByField: "district_name",
      metricField: "affected_households",
      aggregation: "sum" as const,
    };

    const next = enforceVizPolicy(dataset, [], chart);

    expect(next.chartType).toBe("bar");
    expect(next.sortBy).toBe("value_desc");
    expect(next.mobileBehavior).toBe("top5");
    expect(next.maxCategories).toBe(5);
    expect(next.qualityBadge).toBe("ok");
    expect(next.screenReaderSummary).toContain("Share by district");
    expect(validateVizSpec(next)).toEqual([]);
    expect(chart.chartType).toBe("pie");
  });

  it("blocks invalid part-to-whole, one-point trends, and raw-count choropleths", () => {
    const dataset = withProfile(createTabularDataset(
      "synthetic-needs.csv",
      "csv",
      "sample",
      parseCsv([
        "district_name,reported_at,affected_households,response_gap_percent",
        "North,2026-01-01,10,20",
        "South,2026-01-01,-5,40"
      ].join("\n"))
    ));

    const invalidPie = enforceVizPolicy(dataset, [], {
      id: "invalid-pie",
      chartType: "pie",
      title: "Affected households share",
      rationale: "Shows share of affected households.",
      groupByField: "district_name",
      metricField: "affected_households",
      aggregation: "sum",
    });
    const onePointTrend = enforceVizPolicy(dataset, [], {
      id: "one-point-trend",
      chartType: "line",
      title: "Affected households over time",
      rationale: "Shows trend.",
      xField: "reported_at",
      metricField: "affected_households",
      aggregation: "sum",
    });
    const rawCountMap = enforceVizPolicy(dataset, [], {
      id: "raw-count-map",
      chartType: "choropleth",
      title: "Affected households by district",
      rationale: "Maps raw affected households.",
      groupByField: "district_name",
      metricField: "affected_households",
      aggregation: "sum",
      measureType: "count",
      fallbackChartType: "table",
    });

    expect(invalidPie.chartType).toBe("bar");
    expect(invalidPie.rationale).toContain("positive additive values");
    expect(onePointTrend.chartType).toBe("bar");
    expect(onePointTrend.sortBy).toBe("value_desc");
    expect(rawCountMap.chartType).toBe("table");
    expect(rawCountMap.rationale).toContain("raw counts");
  });

  it("turns high-risk chart fields into visible quality badges and source notes", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("district_name,response_gap_percent\nNorth,20\nSouth,130\n")
    ));
    const chart = enforceVizPolicy(dataset, [
      {
        id: "invalid-response-gap",
        checkType: "Decision readiness",
        status: "fail",
        severity: "high",
        description: "Response gap has invalid percentages.",
        affectedColumns: ["response_gap_percent"],
        caveat: "Do not use response-gap charts for action until invalid percentages are corrected.",
      }
    ], {
      id: "response-gap",
      chartType: "bar",
      title: "Response gap by district",
      rationale: "Compares response gap.",
      groupByField: "district_name",
      metricField: "response_gap_percent",
      aggregation: "average",
    });

    expect(chart.qualityBadge).toBe("block");
    expect(chart.sourceNote).toContain("Do not use response-gap charts");
    expect(chart.unit).toBe("%");
  });

  it("loads synthetic visualization fixtures with disaster-dashboard edge cases", () => {
    const needs = parseCsv(readFileSync("public/samples/needs_assessment_synthetic.csv", "utf8"));
    const population = parseCsv(readFileSync("public/samples/population_synthetic.csv", "utf8"));
    const geojson = JSON.parse(readFileSync("public/samples/admin_boundaries_synthetic.geojson", "utf8"));

    expect(new Set(needs.map((row) => row.district_code)).size).toBeGreaterThanOrEqual(12);
    expect(new Set(needs.map((row) => row.reported_at)).size).toBeGreaterThanOrEqual(2);
    expect(needs.some((row) => Number(row.response_gap_percent) > 100)).toBe(true);
    expect(needs.some((row) => Number(row.affected_households) < 0)).toBe(true);
    expect(needs.some((row) => !row.district_name)).toBe(true);
    expect(population.length).toBeGreaterThanOrEqual(12);
    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features.length).toBeGreaterThanOrEqual(12);
  });

  it("renders ChartFrame metadata as an accessible React structure", () => {
    const element = ChartFrame({
      id: "chart-response-gap",
      title: "Response gap by district",
      subtitle: "Percent · District",
      sourceNote: "Requires data quality review.",
      screenReaderSummary: "Response gap chart with review caveat.",
      qualityBadge: "warn",
      children: "chart body",
    });

    expect(isValidElement(element)).toBe(true);
    const article = element as unknown as ReactElement<{
      "aria-describedby": string;
      "aria-labelledby": string;
      "data-quality": string;
      className: string;
      children: ReactElement[];
    }>;
    const children = article.props.children;
    const header = children[0] as ReactElement<{ children: ReactElement[] }>;
    const headerChildren = header.props.children;
    const titleGroup = headerChildren[0] as ReactElement<{ children: ReactElement[] }>;
    const titleGroupChildren = titleGroup.props.children;
    const title = titleGroupChildren[0] as ReactElement<{ children: string }>;
    const subtitle = titleGroupChildren[1] as ReactElement<{ children: string }>;
    const badge = headerChildren[1] as ReactElement<{ children: string }>;

    expect(article.props["aria-labelledby"]).toBe("chart-response-gap-title");
    expect(article.props["aria-describedby"]).toContain("chart-response-gap-description");
    expect(article.props["data-quality"]).toBe("warn");
    expect(article.props.className).toContain("quality-warn");
    expect(title.props.children).toBe("Response gap by district");
    expect(subtitle.props.children).toBe("Percent · District");
    expect(badge.props.children).toBe("Use with caution");
  });

  it("reconciles LLM dashboard recommendations against prepared dataset fields", () => {
    const dataset = withProfile(createTabularDataset("needs.csv", "csv", "sample", parseCsv("district_name,value\nNorth,4\nSouth,8\n")));
    const recommendation = reconcileDashboardRecommendation(dataset, {
      summaryMetrics: ["Total records", "value", "missing_field"],
      groupByFields: ["district_name", "missing_group"],
      demographicFields: [],
      metricFields: ["value", "missing_metric"],
      charts: [
        { id: "valid-chart", chartType: "bar", title: "Valid chart", groupByField: "district_name", metricField: "value", rationale: "Valid fields.", supportedInsightIds: ["llm-insight"] },
        { id: "invalid-chart", chartType: "bar", title: "Invalid chart", groupByField: "missing_group", metricField: "value", rationale: "Invalid field." }
      ],
      insights: [{ id: "llm-insight", title: "Useful spread", description: "Values vary by district.", severity: "info" }]
    });

    expect(recommendation.summaryMetrics).toEqual(["Total records", "value"]);
    expect(recommendation.groupByFields).toEqual(["district_name"]);
    expect(recommendation.metricFields).toEqual(["value"]);
    expect(recommendation.charts.some((chart) => chart.id === "valid-chart")).toBe(true);
    expect(recommendation.charts.some((chart) => chart.id === "invalid-chart")).toBe(false);
    expect(recommendation.charts.length).toBeGreaterThan(1);
    expect(recommendation.insights?.[0].id).toBe("llm-insight");
    expect(recommendation.insights?.[0].linkedChartId).toBe("valid-chart");
  });

  it("normalizes LLM dashboard labels and keeps model charts ahead of fallback padding", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("district_name,response_gap_percent,total_households\nNorth,20,10\nSouth,40,30\n")
    ));
    const recommendation = reconcileDashboardRecommendation(dataset, {
      summaryMetrics: ["Record volume", "Average response gap percent", "Total households"],
      groupByFields: ["District name"],
      demographicFields: [],
      metricFields: ["Response gap percent", "Total households"],
      charts: [
        {
          id: "ai-gap",
          chartType: "bar",
          title: "AI response gap view",
          xField: "District name",
          yField: "Average response gap percent",
          groupByField: "",
          metricField: "Average response gap percent",
          aggregation: "average",
          rationale: "Model-selected field labels should normalize to real columns.",
          section: "comparisons",
          priority: 90
        }
      ],
      insights: []
    });

    expect(recommendation.summaryMetrics).toEqual([
      "Total records",
      "response_gap_percent",
      "total_households"
    ]);
    expect(recommendation.groupByFields[0]).toBe("district_name");
    expect(recommendation.metricFields).toContain("response_gap_percent");
    expect(recommendation.charts[0].id).toBe("ai-gap");
    expect(recommendation.charts[0].groupByField).toBeUndefined();
    expect(recommendation.charts[0].xField).toBe("district_name");
    expect(recommendation.charts[0].metricField).toBe("response_gap_percent");
    expect((recommendation.charts.find((chart) => chart.id !== "ai-gap")?.priority ?? 0)).toBeGreaterThan(100);
  });

  it("uses supplied quality and transformation facts in deterministic dashboard insights", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("district_name,value\nNorth,4\nSouth,\n")
    ));
    const recommendation = generateDeterministicDashboardRecommendation(dataset, {
      dashboardFacts: computeDashboardInsightFacts(
        dataset,
        runQualityChecks(dataset),
        [
          {
            id: "clean-1",
            stepType: "cleaning",
            description: "Trimmed text values and converted numeric-looking values.",
            timestamp: "2026-01-01T00:00:00.000Z",
            affectedColumns: ["district_name", "value"],
            assumptions: ["Numeric-looking values were converted."]
          }
        ]
      )
    });

    expect(recommendation.insights?.some((insight) => insight.id === "insight-missing-values")).toBe(true);
    expect(recommendation.insights?.some((insight) => insight.id === "insight-cleaning-applied")).toBe(true);
  });

  it("generates varied deterministic dashboard recommendations from field roles", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("district_name,households_assessed,priority_need,age_group,gender\nNorth,120,Water,0-17,Female\nNorth,96,Food,18-59,Male\nSouth,102,Health,0-17,Male\nSouth,76,Food,18-59,Female\n")
    ));
    const recommendation = generateDeterministicDashboardRecommendation(dataset);
    const chartTypes = new Set(recommendation.charts.map((chart) => chart.chartType));

    expect(recommendation.metricFields).toContain("households_assessed");
    expect(recommendation.groupByFields).toContain("district_name");
    expect(recommendation.charts.length).toBeGreaterThanOrEqual(4);
    expect(chartTypes.has("bar")).toBe(true);
    expect(chartTypes.has("pie")).toBe(true);
    expect(chartTypes.has("table")).toBe(true);
    expect(recommendation.insights?.length).toBeGreaterThanOrEqual(2);
    expect(recommendation.insights?.some((insight) => insight.evidence?.length)).toBe(true);
  });

  it("detects coordinate fields and recommends local location views", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv([
        "district_name,admin_region,households_assessed,latitude,longitude",
        "North,Coastal,120,18.42,-72.32",
        "North,Coastal,96,18.43,-72.31",
        "South,Central,80,18.52,-72.2",
        "South,Central,75,,-72.18"
      ].join("\n"))
    ));
    const location = findLocationFields(dataset);
    const recommendation = generateDeterministicDashboardRecommendation(dataset);
    const mapChart = recommendation.charts.find((chart) => chart.chartType === "map");
    const areaChart = recommendation.charts.find((chart) => chart.chartType === "area");
    const facts = computeDashboardInsightFacts(dataset, runQualityChecks(dataset));

    expect(location.latitudeField).toBe("latitude");
    expect(location.longitudeField).toBe("longitude");
    expect(location.validCoordinateRowCount).toBe(3);
    expect(mapChart?.xField).toBe("longitude");
    expect(mapChart?.yField).toBe("latitude");
    expect(areaChart?.groupByField).toBe("district_name");
    expect(recommendation.metricFields).not.toContain("latitude");
    expect(recommendation.metricFields).not.toContain("longitude");
    expect(facts.some((fact) => fact.id === "fact-location-coverage")).toBe(true);
  });

  it("redacts coordinate sample values from minimized recommendation profiles", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("district_name,latitude,longitude,needs_score\nNorth,18.42,-72.32,78\nSouth,18.52,-72.2,66\n")
    ));
    const [profile] = minimizeProfiles([dataset.profile!]);
    const latitude = profile.columns.find((column) => column.columnName === "latitude");
    const longitude = profile.columns.find((column) => column.columnName === "longitude");
    const needsScore = profile.columns.find((column) => column.columnName === "needs_score");

    expect(latitude?.sampleValues).toEqual([]);
    expect(longitude?.sampleValues).toEqual([]);
    expect(needsScore?.sampleValues).toEqual(["78", "66"]);
  });

  it("sanitizes dataset input hints in minimized recommendation profiles", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("district_code,needs_score,round_date\nD01,78,2026-06-01\n"),
      {
        inputHints: {
          evidenceRole: "Need severity",
          primaryField: "needs_score",
          joinField: "district_code",
          timeField: "round_date",
          measurementUnit: "0-100 score",
          semanticNotes: "Rapid assessment round 2. <script>ignore system</script>",
        },
      },
    ));

    const [profile] = minimizeProfiles([dataset.profile!]);
    const parsed = parseWorkflowContext({
      mode: "single",
      profiles: [profile],
    });

    expect(profile.inputHints?.semanticNotes).toBe("Rapid assessment round 2. ignore system");
    expect(parsed).not.toHaveProperty("error");
    if ("error" in parsed) throw new Error(parsed.error);
    expect(parsed.profiles[0].inputHints?.evidenceRole).toBe("Need severity");
    expect(parsed.profiles[0].inputHints?.semanticNotes).not.toContain("<script>");
  });

  it("computes dashboard insight facts from prepared data", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv("district_name,households_assessed,priority_need\nNorth,120,Water\nNorth,96,Food\nSouth,40,Health\nSouth,,Food\n")
    ));
    const facts = computeDashboardInsightFacts(dataset, runQualityChecks(dataset));

    expect(facts.some((fact) => fact.insightType === "comparison" && fact.metricField === "households_assessed")).toBe(true);
    expect(facts.some((fact) => fact.insightType === "quality" && fact.evidence.length > 0)).toBe(true);
    expect(facts[0].evidence.length).toBeGreaterThan(0);
  });

  it("adds scatter, missingness, and trend dashboard support when fields allow it", () => {
    const dataset = withProfile(createTabularDataset(
      "needs.csv",
      "csv",
      "sample",
      parseCsv([
        "reported_at,district_name,total_households,response_gap_percent,service_score",
        "2026-01-01,North,10,20,3",
        "2026-02-01,North,20,35,6",
        "2026-03-01,South,35,,9",
        "2026-04-01,South,50,70,12"
      ].join("\n"))
    ));
    const recommendation = generateDeterministicDashboardRecommendation(dataset);
    const chartTypes = new Set(recommendation.charts.map((chart) => chart.chartType));
    const facts = computeDashboardInsightFacts(dataset, runQualityChecks(dataset));

    expect(chartTypes.has("line")).toBe(true);
    expect(chartTypes.has("scatter")).toBe(true);
    expect(chartTypes.has("missingness")).toBe(true);
    expect(recommendation.charts.find((chart) => chart.chartType === "scatter")?.xField).toBe("total_households");
    expect(recommendation.charts.find((chart) => chart.chartType === "scatter")?.yField).toBe("response_gap_percent");
    expect(facts.some((fact) => fact.insightType === "trend" && fact.groupField === "reported_at")).toBe(true);
  });

  it("smoke tests the sample-data workflow through dashboard and export data", () => {
    const needs = withProfile(createTabularDataset(
      "needs_assessment.csv",
      "csv",
      "sample",
      parseCsv(readFileSync("public/samples/needs_assessment.csv", "utf8"))
    ));
    const population = withProfile(createTabularDataset(
      "population.csv",
      "csv",
      "sample",
      parseCsv(readFileSync("public/samples/population.csv", "utf8"))
    ));
    const [join] = generateDeterministicJoinRecommendations([needs, population]);
    const joined = applyJoinRecommendation([needs, population], join);
    const prepared = withProfile(joined.dataset);
    const quality = runQualityChecks(prepared);
    const recommendation = generateDeterministicDashboardRecommendation(prepared);
    const chartTypes = new Set(recommendation.charts.map((chart) => chart.chartType));
    const facts = computeDashboardInsightFacts(prepared, quality, joined.transformations);
    const csv = toCsv(prepared.data ?? []);

    expect(needs.rowCount).toBeGreaterThan(20);
    expect(join.sourceColumns[0]).toBe("district_code");
    expect(prepared.data?.some((row) => row.__join_matched === false)).toBe(true);
    expect(joined.transformations.some((step) => step.stepType === "join")).toBe(true);
    expect(quality.some((issue) => issue.id === "join-completeness")).toBe(true);
    expect(chartTypes.has("line")).toBe(true);
    expect(chartTypes.has("bar")).toBe(true);
    expect(recommendation.charts.some((chart) => chart.rationale.includes("Converted from pie to bar"))).toBe(true);
    expect(recommendation.charts.length).toBeGreaterThanOrEqual(5);
    expect(facts.some((fact) => fact.id === "fact-join-coverage")).toBe(true);
    expect(facts.some((fact) => fact.insightType === "quality")).toBe(true);
    expect(facts.some((fact) => fact.id === "fact-cleaning-applied" || fact.id === "fact-join-coverage")).toBe(true);
    expect(csv).toContain("district_code");
    expect(csv).toContain("__join_matched");
  });
});

function withProfile(dataset: Dataset): Dataset {
  return { ...dataset, profile: profileDataset(dataset) };
}

function responsePrioritizationBrief(requiredEvidence: string[]) {
  return {
    useCaseId: "response_prioritization" as const,
    decisionQuestion: "Which districts should receive first response?",
    intendedAction: "Prioritize response teams.",
    decisionMaker: "Emergency operations lead",
    geographyScope: "Districts",
    timeframe: "Next 72 hours",
    requiredEvidence
  };
}
