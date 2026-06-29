import React, { useState } from "react";

/**
 * Sticky translucent app header with text brand, nav links, and a right-side actions slot.
 * Tints blue while `loading`.
 */
export function AppHeader({ title = "Dashboard Copilot", links = [], loading = false, children, sticky = true }) {
  return (
    <header
      style={{
        background: loading ? "rgba(238,243,255,0.96)" : "var(--header-bg)",
        borderBottom: `1px solid ${loading ? "#ccd8ff" : "var(--line)"}`,
        boxShadow: loading ? "0 8px 24px rgba(45,91,227,0.08)" : "none",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        position: sticky ? "sticky" : "relative",
        top: 0,
        zIndex: 10,
        transition:
          "background-color 180ms var(--ease), border-color 180ms var(--ease), box-shadow 180ms var(--ease)",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: "16px",
          justifyContent: "space-between",
          margin: "0 auto",
          maxWidth: "1240px",
          padding: "17px 28px",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: "12px", minWidth: 0 }}>
          <h1 style={{ fontSize: "1.08rem", fontWeight: 720, lineHeight: 1.1, margin: 0, whiteSpace: "nowrap" }}>{title}</h1>
          {links.map((link) => (
            <HeaderNavLink key={link.label} {...link} />
          ))}
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            marginLeft: "auto",
            minHeight: "32px",
          }}
        >
          {children}
        </div>
      </div>
    </header>
  );
}

function HeaderNavLink({ label, href = "#", active = false, onClick }) {
  const [hover, setHover] = useState(false);
  const lit = hover || active;
  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-current={active ? "page" : undefined}
      style={{
        alignItems: "center",
        background: lit ? "rgba(255,255,255,0.72)" : "transparent",
        border: `1px solid ${lit ? "var(--line)" : "transparent"}`,
        borderRadius: "999px",
        color: lit ? "var(--ink)" : "var(--muted)",
        display: "inline-flex",
        fontSize: "0.82rem",
        fontWeight: 740,
        minHeight: "32px",
        padding: "5px 10px",
        textDecoration: "none",
        transition:
          "background-color 160ms var(--ease), border-color 160ms var(--ease), color 160ms var(--ease)",
      }}
    >
      {label}
    </a>
  );
}
