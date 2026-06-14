"use client";

import { usageCopy, useAiUsage } from "@/lib/useAiUsage";

export function UsageMeter({ enabled }: { enabled: boolean }) {
  const usage = useAiUsage(enabled);
  const copy = usageCopy(usage);

  if (usage.status === "disabled") return null;

  return (
    <div className={`usage-meter usage-${usage.status}`} aria-live="polite">
      <span>{copy.label}</span>
      <strong>{copy.value}</strong>
    </div>
  );
}
