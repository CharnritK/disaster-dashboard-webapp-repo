import React, { useEffect } from "react";
import { Button } from "../actions/Button.jsx";

/**
 * Modal dialog over a dimmed ink backdrop. Bordered header with title,
 * muted description, and a plain "Close" button — no × glyph (text-first,
 * no icons). Closes on Escape and backdrop click.
 * Source: `.decision-map-backdrop` / `.decision-map-dialog` in app/styles.css.
 */
export function Modal({
  open = true,
  onClose,
  title,
  description,
  children,
  maxWidth = "980px",
  closeLabel = "Close",
  style,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget && onClose) onClose();
      }}
      style={{
        alignItems: "center",
        background: "rgba(23, 23, 23, 0.34)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        padding: "24px",
        position: "fixed",
        zIndex: 40,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          animation: "dcPanelIn 180ms var(--ease)",
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          boxShadow: "var(--shadow-modal)",
          display: "grid",
          gap: "18px",
          maxHeight: "min(760px, calc(100vh - 48px))",
          maxWidth,
          overflow: "auto",
          padding: "22px",
          width: "100%",
          ...style,
        }}
      >
        <header
          style={{
            alignItems: "flex-start",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            gap: "16px",
            justifyContent: "space-between",
            paddingBottom: "16px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.34rem", fontWeight: 720, lineHeight: 1.2, margin: 0 }}>{title}</h3>
            {description && <p style={{ color: "var(--muted)", margin: "8px 0 0" }}>{description}</p>}
          </div>
          <Button onClick={onClose} style={{ flex: "0 0 auto" }}>
            {closeLabel}
          </Button>
        </header>
        {children}
      </div>
    </div>
  );
}
