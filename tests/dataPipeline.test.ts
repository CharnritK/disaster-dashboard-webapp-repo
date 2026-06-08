import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { Dataset } from "@/types/dataset";
import { parseCsv, parseFile, createTabularDataset } from "@/lib/fileParsers";
import { profileDataset } from "@/lib/profiling";
import { generateDeterministicJoinRecommendations } from "@/lib/deterministicJoinRecommendations";
import { applyJoinRecommendation, prepareSingleDataset } from "@/lib/harmonization";
import { runQualityChecks } from "@/lib/validation";
import { parseWorkflowContext, sanitizeAIRecommendationResponse } from "@/lib/recommendationSchema";
import { generateDeterministicDashboardRecommendation, reconcileDashboardRecommendation } from "@/lib/dashboardRecommendations";
import { computeDashboardInsightFacts } from "@/lib/dashboardInsights";
import { checkRateLimit } from "@/lib/apiSecurity";
import { toCsv } from "@/lib/exportCsv";
import { buildRecommendationRequestBody, requestStructuredRecommendations } from "@/lib/llmClient";
import { aggregateField, aggregateRows, fieldDisplayLabel, inferMetricAggregation, metricDisplayLabel } from "@/lib/chartMetrics";
import { generateFallbackRecommendations, requestAIRecommendations } from "@/lib/recommendations";

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
    expect(chartProperties.chartType.enum).toEqual(["bar", "line", "pie", "scatter", "missingness", "table", "summary"]);
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
        alsoRisky: "  +SUM(1,2)"
      }
    ]);

    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("\"'  +SUM(1,2)\"");
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
    expect(chartTypes.has("pie")).toBe(true);
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
