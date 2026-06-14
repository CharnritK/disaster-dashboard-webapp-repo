"use client";

import type { CoachHint } from "@/lib/coach";

type AiCoachPanelProps = {
  hints: CoachHint[];
};

export function AiCoachPanel({ hints }: AiCoachPanelProps) {
  return (
    <aside className="coach-panel" aria-labelledby="coach-title">
      <p className="eyebrow">Coach</p>
      <h2 id="coach-title">Next best checks</h2>
      <div className="coach-hints">
        {hints.map((hint) => (
          <article className={`coach-hint coach-hint-${hint.tone}`} key={hint.title}>
            <h3>{hint.title}</h3>
            <p>{hint.body}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}
