// Dashboard Copilot DS — fallback namespace loader.
// Prefers the compiled _ds_bundle.js namespace; if absent, fetches the source
// .jsx modules and compiles them in the browser with Babel standalone.
// Usage: const NS = await window.__dsLoadNamespace({ detect: ["Button"], extraFiles: [...] });
(function () {
  const ROOT = document.currentScript ? new URL(".", document.currentScript.src) : new URL(".", window.location.href);

  const COMPONENT_FILES = [
    "components/actions/Button.jsx",
    "components/actions/ToggleSwitch.jsx",
    "components/forms/Field.jsx",
    "components/forms/TextAreaField.jsx",
    "components/forms/SelectField.jsx",
    "components/forms/CheckboxRow.jsx",
    "components/navigation/AppHeader.jsx",
    "components/navigation/Stepper.jsx",
    "components/feedback/Notice.jsx",
    "components/feedback/LoadingBanner.jsx",
    "components/feedback/Pill.jsx",
    "components/feedback/SeverityCallout.jsx",
    "components/feedback/EmptyState.jsx",
    "components/feedback/Tooltip.jsx",
    "components/surfaces/Card.jsx",
    "components/surfaces/SectionHeading.jsx",
    "components/surfaces/RecommendationCard.jsx",
    "components/surfaces/Accordion.jsx",
    "components/surfaces/Modal.jsx",
    "components/data/Metric.jsx",
    "components/data/BarChart.jsx",
    "components/data/DataTable.jsx",
    "components/data/InlineCode.jsx",
  ];

  // In hidden documents (capture iframes, background tabs) CSS transitions and
  // animations never advance, freezing styles at stale values. Disable
  // transitions while hidden so captures reflect final state.
  const frozen = document.createElement("style");
  frozen.textContent = "*, *::before, *::after { transition: none !important; animation: none !important; }";
  function syncFrozen() {
    if (document.visibilityState === "hidden") {
      if (!frozen.parentNode) document.head.appendChild(frozen);
    } else if (frozen.parentNode) {
      frozen.parentNode.removeChild(frozen);
    }
  }
  syncFrozen();
  document.addEventListener("visibilitychange", syncFrozen);

  window.__dsLoadNamespace = async function (options) {
    const { detect = [], extraFiles = [] } = options || {};
    if (document.readyState !== "complete") {
      await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
    }
    // 1) Prefer the compiled bundle's namespace
    for (const key of Object.keys(window)) {
      try {
        const value = window[key];
        if (value && typeof value === "object" && detect.length && detect.every((name) => value[name])) {
          return value;
        }
      } catch (error) {
        /* cross-origin frame — skip */
      }
    }
    // 2) Fallback: fetch + transform the source modules with Babel
    const files = COMPONENT_FILES.concat(extraFiles);
    const sources = await Promise.all(
      files.map(async (rel) => {
        const url = new URL(rel, ROOT).href;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load " + rel);
        return { url, text: await response.text() };
      })
    );
    const byUrl = {};
    sources.forEach((source) => { byUrl[source.url] = source; });
    const registry = {};
    function evaluate(url) {
      if (registry[url]) return registry[url].exports;
      const source = byUrl[url];
      if (!source) throw new Error("Module not found: " + url);
      const module = { exports: {} };
      registry[url] = module;
      const compiled = Babel.transform(source.text, { presets: ["react", "env"], filename: url }).code;
      const requireShim = (spec) => {
        if (spec === "react") return window.React;
        if (spec === "react-dom") return window.ReactDOM;
        return evaluate(new URL(spec, url).href);
      };
      new Function("require", "module", "exports", compiled)(requireShim, module, module.exports);
      return module.exports;
    }
    const namespace = {};
    sources.forEach((source) => { Object.assign(namespace, evaluate(source.url)); });
    return namespace;
  };
})();
