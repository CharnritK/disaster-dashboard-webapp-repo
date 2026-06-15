import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const API_URL = "https://api.openai.com/v1/audio/speech";
const OUTPUT_DIR = path.resolve("public", "voiceover");
const MAX_INPUT_CHARS = 4096;

const voiceInstruction =
  "Narrate with calm urgency and warmth. Sound practical, field-aware, and respectful. Do not sound promotional. Leave emotional space around uncertainty and handoff.";

const scripts = [
  {
    file: "fragmented-data-painpoint.mp3",
    title: "FragmentedDataPainpoint",
    input:
      "One assessment file. One population sheet. One capacity update. And a meeting that cannot wait. The problem is not only building a chart. The problem is knowing whether the chart can be trusted. Dashboard Copilot starts with synthetic fragmented data, profiles evidence, makes gaps visible, and keeps joins reviewable before anything becomes a dashboard. The handoff is clearer evidence, attached caveats, and human-owned action.",
  },
  {
    file: "public-demo-user-flow.mp3",
    title: "PublicDemoUserFlow",
    input:
      "In the public demo, the user starts with the decision, not the visualization. They choose the response-prioritization template, then load bundled fragmented sample data instead of uploading sensitive files. The app profiles fields, missingness, and evidence coverage. It recommends a join, but the user reviews the key and cleaning actions before accepting. Readiness becomes a checkpoint, not approval. The dashboard keeps source notes and caveats visible, and the final handoff package preserves context for the response team.",
  },
  {
    file: "trust-risk-user-flow.mp3",
    title: "TrustRiskUserFlow",
    input:
      "Trustworthy review means showing the uncomfortable path too. The risky sample renders because bad inputs should be visible, not hidden. Readiness blockers separate warnings from stops, and evidence comes before advice, whether the recommendation is deterministic or AI assisted. The handoff keeps assumptions and caveats attached. Uploaded rows stay in the browser session; controlled beta storage is limited to approved metadata.",
  },
];

await loadLocalEnv(["../.env.local", ".env.local", "../.env", ".env"]);

const apiKey = process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY;
const model = process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts";
const voice = process.env.OPENAI_TTS_VOICE ?? "coral";

if (!apiKey) {
  throw new Error(
    "Missing OPENAI_API_KEY or LLM_API_KEY. Add it to the environment or local .env file before running npm run speech.",
  );
}

await mkdir(OUTPUT_DIR, { recursive: true });

const generated = [];

for (const item of scripts) {
  if (item.input.length > MAX_INPUT_CHARS) {
    throw new Error(`${item.title} narration exceeds ${MAX_INPUT_CHARS} characters.`);
  }

  const request = {
    input: item.input,
    model,
    voice,
  };

  if (!model.startsWith("tts-1")) {
    request.instructions = voiceInstruction;
  }

  const response = await fetch(API_URL, {
    body: JSON.stringify(request),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Speech generation failed for ${item.title}: ${response.status} ${response.statusText} ${redact(errorText)}`,
    );
  }

  const outputPath = path.join(OUTPUT_DIR, item.file);
  const audio = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, audio);
  generated.push({
    bytes: audio.length,
    file: path.relative(process.cwd(), outputPath).replaceAll("\\", "/"),
    model,
    title: item.title,
    voice,
  });
}

await writeFile(
  path.join(OUTPUT_DIR, "manifest.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: "OpenAI /v1/audio/speech",
      tracks: generated,
    },
    null,
    2,
  )}\n`,
);

console.log(
  generated.map((item) => `${item.title}: ${item.file} (${item.bytes} bytes)`).join("\n"),
);

async function loadLocalEnv(files) {
  for (const file of files) {
    const fullPath = path.resolve(file);
    if (!existsSync(fullPath)) {
      continue;
    }

    const text = await readFile(fullPath, "utf8");
    for (const line of text.split(/\r?\n/u)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);
      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;
      if (process.env[key]) {
        continue;
      }

      process.env[key] = stripEnvQuotes(rawValue);
    }
  }
}

function stripEnvQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function redact(text) {
  return text.replace(/sk-[A-Za-z0-9_-]+/gu, "sk-***");
}
