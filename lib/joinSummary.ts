export type JoinMatchSummary = {
  leftCount: number;
  rightCount: number;
  matchedCount: number;
  unmatchedLeftCount: number;
  unmatchedRightCount: number;
  unmatchedLeftKeys: string[];
  unmatchedRightKeys: string[];
  blankLeftKeyCount: number;
  blankRightKeyCount: number;
  duplicateLeftKeyCount: number;
  duplicateRightKeyCount: number;
  duplicateLeftKeys: string[];
  duplicateRightKeys: string[];
};

const MAX_KEY_SAMPLE_LENGTH = 48;

export function summarizeJoinMatch(
  leftRows: Record<string, unknown>[],
  rightRows: Record<string, unknown>[],
  leftKey: string,
  rightKey: string,
  sampleLimit = 5,
): JoinMatchSummary {
  const leftKeyStats = keyStats(leftRows, leftKey, sampleLimit);
  const rightKeyStats = keyStats(rightRows, rightKey, sampleLimit);
  const normalizedRightKeys = new Set(rightKeyStats.counts.keys());
  const normalizedLeftKeys = new Set(leftKeyStats.counts.keys());
  const unmatchedLeftKeys = new Map<string, string>();
  const unmatchedRightKeys = new Map<string, string>();
  let matchedCount = 0;
  let unmatchedLeftCount = 0;
  let unmatchedRightCount = 0;

  for (const row of leftRows) {
    const normalized = normalizeJoinKey(row[leftKey]);
    if (normalizedRightKeys.has(normalized)) {
      matchedCount += 1;
      continue;
    }
    unmatchedLeftCount += 1;
    addSampleKey(unmatchedLeftKeys, normalized, row[leftKey], sampleLimit);
  }

  for (const row of rightRows) {
    const normalized = normalizeJoinKey(row[rightKey]);
    if (normalizedLeftKeys.has(normalized)) continue;
    unmatchedRightCount += 1;
    addSampleKey(unmatchedRightKeys, normalized, row[rightKey], sampleLimit);
  }

  return {
    leftCount: leftRows.length,
    rightCount: rightRows.length,
    matchedCount,
    unmatchedLeftCount,
    unmatchedRightCount,
    unmatchedLeftKeys: Array.from(unmatchedLeftKeys.values()),
    unmatchedRightKeys: Array.from(unmatchedRightKeys.values()),
    blankLeftKeyCount: leftKeyStats.blankCount,
    blankRightKeyCount: rightKeyStats.blankCount,
    duplicateLeftKeyCount: leftKeyStats.duplicateCount,
    duplicateRightKeyCount: rightKeyStats.duplicateCount,
    duplicateLeftKeys: leftKeyStats.duplicateKeys,
    duplicateRightKeys: rightKeyStats.duplicateKeys,
  };
}

function normalizeJoinKey(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function displayJoinKey(value: unknown) {
  const label = String(value ?? "").trim();
  return truncateSample(label || "(blank)");
}

function keyStats(
  rows: Record<string, unknown>[],
  keyField: string,
  sampleLimit: number,
) {
  const counts = new Map<string, number>();
  const displayValues = new Map<string, string>();
  for (const row of rows) {
    const normalized = normalizeJoinKey(row[keyField]);
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    if (!displayValues.has(normalized)) {
      displayValues.set(normalized, displayJoinKey(row[keyField]));
    }
  }

  const duplicateKeys = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .slice(0, sampleLimit)
    .map(([key]) => displayValues.get(key) ?? "(blank)");
  const duplicateCount = Array.from(counts.values()).reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  );

  return {
    counts,
    blankCount: counts.get("") ?? 0,
    duplicateCount,
    duplicateKeys,
  };
}

function addSampleKey(
  samples: Map<string, string>,
  normalized: string,
  value: unknown,
  sampleLimit: number,
) {
  if (samples.size >= sampleLimit) return;
  if (!samples.has(normalized)) samples.set(normalized, displayJoinKey(value));
}

function truncateSample(value: string) {
  if (value.length <= MAX_KEY_SAMPLE_LENGTH) return value;
  return `${value.slice(0, MAX_KEY_SAMPLE_LENGTH - 3)}...`;
}
