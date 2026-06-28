"use client";

import { useState } from "react";

import { FEEDBACK_TAGS, type FeedbackTag } from "@/lib/feedback/constants";

type FeedbackFormProps = {
  enabled: boolean;
};

export function FeedbackForm({ enabled }: FeedbackFormProps) {
  const [thumb, setThumb] = useState<"down" | "up">("up");
  const [tags, setTags] = useState<FeedbackTag[]>([]);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function submitFeedback() {
    if (!enabled || status === "saving") return;
    setStatus("saving");
    try {
      const response = await fetch("/api/feedback", {
        body: JSON.stringify({
          comment: comment.trim() || undefined,
          tags,
          thumb,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      setStatus(response.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  function toggleTag(tag: FeedbackTag) {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  return (
    <section className="feedback-panel" aria-labelledby="feedback-title">
      <div>
        <p className="eyebrow">Feedback</p>
        <h3 id="feedback-title">Was this workflow output useful?</h3>
      </div>

      <div className="feedback-thumbs" role="group" aria-label="Feedback rating">
        <button
          aria-pressed={thumb === "up"}
          className={thumb === "up" ? "selected" : undefined}
          disabled={!enabled}
          onClick={() => setThumb("up")}
          type="button"
        >
          Up
        </button>
        <button
          aria-pressed={thumb === "down"}
          className={thumb === "down" ? "selected" : undefined}
          disabled={!enabled}
          onClick={() => setThumb("down")}
          type="button"
        >
          Down
        </button>
      </div>

      <div className="feedback-tags" aria-label="Feedback tags">
        {FEEDBACK_TAGS.map((tag) => (
          <label key={tag}>
            <input
              checked={tags.includes(tag)}
              disabled={!enabled}
              onChange={() => toggleTag(tag)}
              type="checkbox"
            />
            <span>{tag}</span>
          </label>
        ))}
      </div>

      <textarea
        disabled={!enabled}
        maxLength={2000}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Optional note. Do not paste sensitive data, rows, screenshots, or reports."
        value={comment}
      />

      <div className="feedback-actions">
        <button disabled={!enabled || status === "saving"} onClick={submitFeedback} type="button">
          Submit feedback
        </button>
        <span aria-live="polite">
          {!enabled
            ? "Sign in to submit."
            : status === "saved"
              ? "Saved."
              : status === "error"
                ? "Could not save."
                : ""}
        </span>
      </div>
    </section>
  );
}
