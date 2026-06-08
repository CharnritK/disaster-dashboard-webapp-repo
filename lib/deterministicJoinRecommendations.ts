import type { Dataset } from "@/types/dataset";
import type { JoinRecommendation } from "@/types/recommendations";

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function generateDeterministicJoinRecommendations(datasets: Dataset[]): JoinRecommendation[] {
  const tabular = datasets.filter((dataset) => dataset.data?.length);
  const recommendations: JoinRecommendation[] = [];

  for (let i = 0; i < tabular.length; i += 1) {
    for (let j = i + 1; j < tabular.length; j += 1) {
      const source = tabular[i];
      const target = tabular[j];
      for (const sourceColumn of source.profile?.potentialJoinFields ?? source.columns ?? []) {
        for (const targetColumn of target.profile?.potentialJoinFields ?? target.columns ?? []) {
          const score = scoreJoin(source, target, sourceColumn, targetColumn);
          if (score.overlap > 0.25 || sourceColumn.toLowerCase() === targetColumn.toLowerCase()) {
            recommendations.push({
              id: `join-${source.id}-${target.id}-${sourceColumn}-${targetColumn}`,
              sourceDatasetId: source.id,
              targetDatasetId: target.id,
              sourceColumns: [sourceColumn],
              targetColumns: [targetColumn],
              joinType: "left",
              confidenceScore: Math.min(0.98, score.confidence),
              rationale: `${sourceColumn} and ${targetColumn} have compatible names and ${Math.round(score.overlap * 100)}% value overlap.`,
              risks: score.overlap < 0.75 ? ["Some records may not match. Keep unmatched records visible in the quality panel."] : [],
              valueOverlapPercentage: Math.round(score.overlap * 1000) / 10,
              estimatedMatchRate: Math.round(score.sourceMatched * 1000) / 10
            });
          }
        }
      }
    }
  }

  return recommendations.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

function scoreJoin(source: Dataset, target: Dataset, sourceColumn: string, targetColumn: string) {
  const sourceValues = (source.data ?? []).map((row) => normalize(row[sourceColumn])).filter(Boolean);
  const targetValues = (target.data ?? []).map((row) => normalize(row[targetColumn])).filter(Boolean);
  const targetSet = new Set(targetValues);
  const sourceSet = new Set(sourceValues);
  const intersection = Array.from(sourceSet).filter((value) => targetSet.has(value));
  const overlap = intersection.length / Math.max(Math.min(sourceSet.size, targetSet.size), 1);
  const sourceMatched = sourceValues.filter((value) => targetSet.has(value)).length / Math.max(sourceValues.length, 1);
  const nameScore = sourceColumn.toLowerCase() === targetColumn.toLowerCase() ? 0.35 : 0.12;
  return { overlap, sourceMatched, confidence: nameScore + overlap * 0.5 + sourceMatched * 0.2 };
}
