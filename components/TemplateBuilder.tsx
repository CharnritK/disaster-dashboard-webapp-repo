"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

import { DECISION_TEMPLATES } from "@/lib/decisionContext";

type TemplateRecord = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  visibility: string;
};

type TemplateBuilderState = {
  caveats: string;
  decisionMaker: string;
  decisionQuestion: string;
  description: string;
  exampleDataSchema: string;
  geographyTimeframe: string;
  intendedAction: string;
  requiredEvidence: string;
  suggestedFields: string;
  title: string;
};

const initialBuilderState: TemplateBuilderState = {
  caveats: "",
  decisionMaker: "",
  decisionQuestion: "",
  description: "",
  exampleDataSchema: "",
  geographyTimeframe: "",
  intendedAction: "",
  requiredEvidence: "",
  suggestedFields: "",
  title: "",
};

export function TemplateBuilder() {
  const [form, setForm] = useState(initialBuilderState);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submitTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/templates", {
        body: JSON.stringify(toTemplatePayload(form)),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus("error");
        setMessage(typeof body.error === "string" ? body.error : "Template could not be saved.");
        return;
      }
      setStatus("saved");
      setMessage("Draft saved.");
      setForm(initialBuilderState);
    } catch {
      setStatus("error");
      setMessage("Template could not be saved.");
    }
  }

  function updateField(field: keyof TemplateBuilderState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <form className="template-builder-form" onSubmit={submitTemplate}>
      <div className="template-builder-grid">
        <label>
          <span>Title</span>
          <input
            required
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </label>
        <label>
          <span>Description</span>
          <input
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>
        <label>
          <span>Decision question</span>
          <input
            required
            value={form.decisionQuestion}
            onChange={(event) => updateField("decisionQuestion", event.target.value)}
          />
        </label>
        <label>
          <span>Intended action</span>
          <input
            required
            value={form.intendedAction}
            onChange={(event) => updateField("intendedAction", event.target.value)}
          />
        </label>
        <label>
          <span>Decision maker</span>
          <input
            required
            value={form.decisionMaker}
            onChange={(event) => updateField("decisionMaker", event.target.value)}
          />
        </label>
        <label>
          <span>Geography and timeframe</span>
          <input
            required
            value={form.geographyTimeframe}
            onChange={(event) => updateField("geographyTimeframe", event.target.value)}
          />
        </label>
      </div>

      <label>
        <span>Required evidence</span>
        <textarea
          placeholder="One evidence item per line"
          value={form.requiredEvidence}
          onChange={(event) => updateField("requiredEvidence", event.target.value)}
        />
      </label>

      <label>
        <span>Suggested fields</span>
        <textarea
          placeholder="One field name per line, for example district_code"
          value={form.suggestedFields}
          onChange={(event) => updateField("suggestedFields", event.target.value)}
        />
      </label>

      <label>
        <span>Caveats</span>
        <textarea
          value={form.caveats}
          onChange={(event) => updateField("caveats", event.target.value)}
        />
      </label>

      <label>
        <span>Example schema</span>
        <textarea
          placeholder='{"district_code":"string","need_score":"number"}'
          value={form.exampleDataSchema}
          onChange={(event) => updateField("exampleDataSchema", event.target.value)}
        />
      </label>

      <p className="auth-lede">
        Store schema metadata only. Do not paste rows, files, screenshots,
        incident details, prompts, reports, or example values.
      </p>

      <div className="auth-action-row">
        <button className="primary-button" disabled={status === "saving"} type="submit">
          {status === "saving" ? "Saving..." : "Save draft"}
        </button>
        <Link href="/app/templates">Cancel</Link>
        <span aria-live="polite" className={`template-builder-status status-${status}`}>
          {message}
        </span>
      </div>
    </form>
  );
}

export function TemplateList() {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let ignore = false;
    async function loadTemplates() {
      try {
        const response = await fetch("/api/templates", {
          headers: {
            accept: "application/json",
          },
        });
        const body = await response.json().catch(() => ({}));
        if (!ignore) {
          setTemplates(Array.isArray(body.templates) ? body.templates : []);
          setStatus(response.ok ? "ready" : "error");
        }
      } catch {
        if (!ignore) setStatus("error");
      }
    }
    loadTemplates();
    return () => {
      ignore = true;
    };
  }, []);

  const drafts = templates.filter((template) => template.visibility !== "reviewed");

  return (
    <div className="template-list-grid">
      <section className="template-list-section" aria-labelledby="draft-templates-title">
        <h2 id="draft-templates-title">Your drafts</h2>
        {status === "loading" && <p className="auth-lede">Loading templates...</p>}
        {status === "error" && <p className="auth-lede">Templates could not be loaded.</p>}
        {status === "ready" && drafts.length === 0 && (
          <p className="auth-lede">No private drafts yet.</p>
        )}
        {drafts.map((template) => (
          <article className="template-list-item" key={template.id}>
            <h3>{template.title}</h3>
            {template.description && <p>{template.description}</p>}
            <span>{template.status}</span>
          </article>
        ))}
      </section>

      <section className="template-list-section" aria-labelledby="reviewed-templates-title">
        <h2 id="reviewed-templates-title">Reviewed templates</h2>
        {DECISION_TEMPLATES.map((template) => (
          <article className="template-list-item" key={template.id}>
            <h3>{template.title}</h3>
            <p>{template.description}</p>
            <span>read-only</span>
          </article>
        ))}
      </section>
    </div>
  );
}

function toTemplatePayload(form: TemplateBuilderState) {
  return {
    caveats: form.caveats,
    decisionMaker: form.decisionMaker,
    decisionQuestion: form.decisionQuestion,
    description: form.description || undefined,
    exampleDataSchema: parseSchema(form.exampleDataSchema),
    geographyTimeframe: form.geographyTimeframe,
    intendedAction: form.intendedAction,
    requiredEvidence: lines(form.requiredEvidence),
    suggestedFields: lines(form.suggestedFields).map((fieldName) => ({
      field_name: fieldName,
      role: "evidence",
    })),
    title: form.title,
  };
}

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseSchema(value: string) {
  if (!value.trim()) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {
      schema_note: value.slice(0, 120),
    };
  }
}
