import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const APP_URL = process.env.CAPTURE_APP_URL ?? "http://localhost:3002/demo";
const CAPTURE_DIR = path.resolve("public", "captures");
const WIDTH = Number(process.env.CAPTURE_WIDTH ?? 1818);
const HEIGHT = Number(process.env.CAPTURE_HEIGHT ?? 1272);
const DEBUG_PORT = Number(process.env.CAPTURE_DEBUG_PORT ?? 9337);
const USER_DATA_DIR = path.resolve("out", ".capture-browser-profile");
const captureManifest = {};

async function main() {
  const browserPath = findBrowser();

  await mkdir(CAPTURE_DIR, { recursive: true });
  await rm(USER_DATA_DIR, { force: true, recursive: true });

  const browser = spawn(browserPath, [
    "--headless=new",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    "--force-device-scale-factor=1",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], {
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  });

  let stderr = "";
  browser.stderr.on("data", chunk => {
    stderr += chunk.toString();
  });

  try {
    const wsUrl = await waitForBrowserWs();
    const cdp = await CdpClient.connect(wsUrl);
    const { sessionId, targetId } = await openPage(cdp);

    await configurePage(cdp, sessionId);
    await capturePublicDemoPath(cdp, sessionId);
    await captureRiskPath(cdp, sessionId);
    await writeFile(
      path.join(CAPTURE_DIR, "capture-manifest.json"),
      `${JSON.stringify(captureManifest, null, 2)}\n`,
    );

    await cdp.send("Target.closeTarget", { targetId });
    cdp.close();
    console.log("Captured tutorial screens to public/captures");
  } finally {
    browser.kill();
    if (stderr.trim()) {
      console.error(stderr.trim().split(/\r?\n/u).slice(-5).join("\n"));
    }
  }
}

async function capturePublicDemoPath(cdp, sessionId) {
  await gotoDemo(cdp, sessionId);
  await waitForText(cdp, sessionId, "Use template and continue");
  await screenshot(cdp, sessionId, "01-template.png");

  await clickButton(cdp, sessionId, "Use template and continue");
  await waitForText(cdp, sessionId, "Use fragmented demo data");
  await screenshot(cdp, sessionId, "02-upload.png");

  await clickButton(cdp, sessionId, "Use fragmented demo data");
  await waitForText(cdp, sessionId, "Profile data");
  await screenshot(cdp, sessionId, "03-fragmented-data.png");

  await clickButton(cdp, sessionId, "Profile data");
  await waitForText(cdp, sessionId, "Evidence coverage");
  await screenshot(cdp, sessionId, "04-profile-evidence.png");

  await clickButton(cdp, sessionId, "Harmonize data");
  await waitForText(cdp, sessionId, "Review the Leading Join Recommendation");
  await screenshot(cdp, sessionId, "05-harmonize-review.png");

  await clickButton(cdp, sessionId, "Accept recommendation");
  await waitForText(cdp, sessionId, "Ready for review");
  await screenshot(cdp, sessionId, "06-validation-readiness.png");

  await clickButton(cdp, sessionId, "Generate dashboard");
  await waitForText(cdp, sessionId, "Dashboard signals");
  await screenshot(cdp, sessionId, "07-dashboard.png");

  await clickButton(cdp, sessionId, "Export dashboard");
  await waitForText(cdp, sessionId, "Export Dashboard Assets");
  await screenshot(cdp, sessionId, "08-export-handoff.png");

  await clickButton(cdp, sessionId, "Generate handoff summary");
  await waitForText(cdp, sessionId, "No raw uploaded rows were sent");
  await screenshot(cdp, sessionId, "09-handoff-summary.png");
}

async function captureRiskPath(cdp, sessionId) {
  await gotoDemo(cdp, sessionId);
  await waitForText(cdp, sessionId, "Use template and continue");
  await clickButton(cdp, sessionId, "Use template and continue");
  await waitForText(cdp, sessionId, "Use risky quality sample");

  await clickButton(cdp, sessionId, "Use risky quality sample");
  await waitForText(cdp, sessionId, "Profile data");
  await clickButton(cdp, sessionId, "Profile data");
  await waitForText(cdp, sessionId, "demo_quality_risk");
  await screenshot(cdp, sessionId, "10-risk-quality.png");

  await clickButton(cdp, sessionId, "Harmonize data");
  await waitForText(cdp, sessionId, "Proceed With a Prepared Single-dataset Dashboard");
  await screenshot(cdp, sessionId, "10-risk-prepare.png");
  await clickButton(cdp, sessionId, "Prepare dataset");
  await waitForText(cdp, sessionId, "Not safe for action yet");
  await screenshot(cdp, sessionId, "11-risk-readiness.png");
}

async function gotoDemo(cdp, sessionId) {
  await cdp.send("Page.navigate", { url: APP_URL }, sessionId);
  await waitForReady(cdp, sessionId);
  await waitForQuietFrame(cdp, sessionId);
}

async function configurePage(cdp, sessionId) {
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  }, sessionId);
}

async function openPage(cdp) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    flatten: true,
    targetId,
  });
  return { sessionId, targetId };
}

async function clickButton(cdp, sessionId, label) {
  const expression = `
    (() => {
      const buttons = [...document.querySelectorAll("button")];
      const button = buttons.find(candidate =>
        candidate.innerText.replace(/\\s+/g, " ").trim().includes(${JSON.stringify(label)}) &&
        !candidate.disabled
      );
      if (!button) {
        return {
          ok: false,
          buttons: buttons.map(candidate => candidate.innerText.replace(/\\s+/g, " ").trim())
        };
      }
      button.scrollIntoView({ block: "center", inline: "center" });
      button.click();
      return { ok: true };
    })()
  `;
  const result = await evaluate(cdp, sessionId, expression);
  if (!result.ok) {
    throw new Error(`Button not found or disabled: ${label}\nVisible buttons: ${result.buttons.join(" | ")}`);
  }
  await waitForQuietFrame(cdp, sessionId);
}

async function screenshot(cdp, sessionId, file) {
  await evaluate(cdp, sessionId, "window.scrollTo(0, 0); true");
  await waitForQuietFrame(cdp, sessionId);
  const metrics = await cdp.send("Page.getLayoutMetrics", {}, sessionId);
  const contentSize = metrics.contentSize ?? {
    height: HEIGHT,
    width: WIDTH,
    x: 0,
    y: 0,
  };
  const clip = {
    height: Math.ceil(contentSize.height),
    scale: 1,
    width: Math.ceil(contentSize.width),
    x: 0,
    y: 0,
  };
  const elements = await collectInteractiveElements(cdp, sessionId, clip);
  const { data } = await cdp.send("Page.captureScreenshot", {
    captureBeyondViewport: true,
    clip,
    format: "png",
    fromSurface: true,
  }, sessionId);
  await writeFile(path.join(CAPTURE_DIR, file), Buffer.from(data, "base64"));
  captureManifest[file] = {
    capturedAt: new Date().toISOString(),
    height: clip.height,
    interactiveElements: elements,
    width: clip.width,
  };
  console.log(`Captured ${file}`);
}

async function collectInteractiveElements(cdp, sessionId, clip) {
  return evaluate(cdp, sessionId, `
    (() => {
      const selectors = [
        "button",
        "[role='button']",
        "summary",
        "a[href]"
      ].join(",");
      return [...document.querySelectorAll(selectors)]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const text = (element.innerText || element.textContent || "")
            .replace(/\\s+/g, " ")
            .trim();
          if (!text || rect.width <= 0 || rect.height <= 0) return null;
          const x = rect.left + window.scrollX;
          const y = rect.top + window.scrollY;
          return {
            centerPercent: [
              Number((((x + rect.width / 2) / ${clip.width}) * 100).toFixed(2)),
              Number((((y + rect.height / 2) / ${clip.height}) * 100).toFixed(2))
            ],
            rectPercent: {
              height: Number(((rect.height / ${clip.height}) * 100).toFixed(2)),
              width: Number(((rect.width / ${clip.width}) * 100).toFixed(2)),
              x: Number(((x / ${clip.width}) * 100).toFixed(2)),
              y: Number(((y / ${clip.height}) * 100).toFixed(2))
            },
            text
          };
        })
        .filter(Boolean);
    })()
  `);
}

async function waitForText(cdp, sessionId, text, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = await evaluate(
      cdp,
      sessionId,
      `document.body?.innerText.includes(${JSON.stringify(text)}) ?? false`,
    );
    if (found) {
      await waitForQuietFrame(cdp, sessionId);
      return;
    }
    await sleep(250);
  }
  const body = await evaluate(
    cdp,
    sessionId,
    "document.body?.innerText.slice(0, 2000) ?? ''",
  );
  throw new Error(`Timed out waiting for text: ${text}\nBody excerpt:\n${body}`);
}

async function waitForReady(cdp, sessionId, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await evaluate(cdp, sessionId, "document.readyState === 'complete'");
    if (ready) return;
    await sleep(200);
  }
  throw new Error("Timed out waiting for document.readyState=complete");
}

async function waitForQuietFrame(cdp, sessionId) {
  await cdp.send("Runtime.evaluate", {
    awaitPromise: true,
    expression: "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
  }, sessionId);
  await sleep(250);
}

async function evaluate(cdp, sessionId, expression) {
  const response = await cdp.send("Runtime.evaluate", {
    awaitPromise: true,
    expression,
    returnByValue: true,
  }, sessionId);
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text ?? "Runtime.evaluate failed");
  }
  return response.result.value;
}

async function waitForBrowserWs(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (response.ok) {
        const json = await response.json();
        if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
      }
    } catch {
      // Browser is still starting.
    }
    await sleep(200);
  }
  throw new Error("Timed out waiting for browser debugging endpoint");
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  const found = candidates.find(candidate => existsSync(candidate));
  if (!found) {
    throw new Error("No Edge or Chrome executable found. Set CHROME_PATH.");
  }
  return found;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CdpClient {
  static connect(url) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const client = new CdpClient(ws);
      ws.addEventListener("open", () => resolve(client), { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
  }

  constructor(ws) {
    this.id = 0;
    this.pending = new Map();
    this.ws = ws;
    this.ws.addEventListener("message", event => this.onMessage(event));
  }

  close() {
    this.ws.close();
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { reject, resolve });
    });
  }

  onMessage(event) {
    const message = JSON.parse(event.data);
    if (!message.id || !this.pending.has(message.id)) return;
    const { reject, resolve } = this.pending.get(message.id);
    this.pending.delete(message.id);
    if (message.error) {
      reject(new Error(`${message.error.message}: ${message.error.data ?? ""}`));
    } else {
      resolve(message.result ?? {});
    }
  }
}

await main();
