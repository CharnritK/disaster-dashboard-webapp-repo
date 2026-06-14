import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DEFAULT_NEXT_BUILD_TIMEOUT_MS = 10 * 60 * 1000;
export const DEFAULT_POSTPROCESS_TIMEOUT_MS = 2 * 60 * 1000;
export const DEFAULT_KILL_GRACE_MS = 15 * 1000;
export const TIMEOUT_EXIT_CODE = 124;

export function readPositiveIntegerMs(env, name, fallback) {
  const raw = env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function getBuildTimeouts(env = process.env) {
  return {
    nextBuildMs: readPositiveIntegerMs(
      env,
      "NEXT_BUILD_TIMEOUT_MS",
      DEFAULT_NEXT_BUILD_TIMEOUT_MS,
    ),
    postprocessMs: readPositiveIntegerMs(
      env,
      "BUILD_POSTPROCESS_TIMEOUT_MS",
      DEFAULT_POSTPROCESS_TIMEOUT_MS,
    ),
    killGraceMs: readPositiveIntegerMs(
      env,
      "BUILD_KILL_GRACE_MS",
      DEFAULT_KILL_GRACE_MS,
    ),
  };
}

export function formatDuration(ms) {
  if (ms % 60000 === 0) return `${ms / 60000}m`;
  if (ms % 1000 === 0) return `${ms / 1000}s`;
  return `${ms}ms`;
}

export function createBuildSteps(repoRoot, env = process.env) {
  const timeouts = getBuildTimeouts(env);
  return [
    {
      label: "Next production build",
      command: process.execPath,
      args: [path.join(repoRoot, "node_modules", "next", "dist", "bin", "next"), "build"],
      cwd: repoRoot,
      timeoutMs: timeouts.nextBuildMs,
    },
    {
      label: "Codex Sites dist post-processing",
      command: process.execPath,
      args: [path.join(repoRoot, "scripts", "prepare-sites-dist.mjs")],
      cwd: repoRoot,
      timeoutMs: timeouts.postprocessMs,
    },
  ];
}

export async function runCommandWithTimeout(step, options = {}) {
  const platform = options.platform ?? process.platform;
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const killGraceMs = options.killGraceMs ?? DEFAULT_KILL_GRACE_MS;

  return await new Promise((resolve) => {
    let child;
    let timeout = null;
    let forceExit = null;
    let timedOut = false;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      if (forceExit) clearTimeout(forceExit);
      resolve(result);
    };

    try {
      child = spawn(step.command, step.args, {
        cwd: step.cwd,
        detached: platform !== "win32",
        env: process.env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      finish({
        exitCode: 1,
        error,
        signal: null,
        timedOut: false,
      });
      return;
    }

    child.stdout?.on("data", (chunk) => stdout.write(chunk));
    child.stderr?.on("data", (chunk) => stderr.write(chunk));

    child.on("error", (error) => {
      finish({
        exitCode: 1,
        error,
        signal: null,
        timedOut,
      });
    });

    child.on("exit", (code, signal) => {
      finish({
        exitCode: timedOut ? TIMEOUT_EXIT_CODE : (code ?? 1),
        error: null,
        signal,
        timedOut,
      });
    });

    timeout = setTimeout(() => {
      timedOut = true;
      stderr.write(
        `[guarded-build] ${step.label} exceeded ${formatDuration(step.timeoutMs)}; ` +
          `terminating process tree for PID ${child.pid}.\n`,
      );

      terminateProcessTree(child.pid, { platform, stderr }).catch((error) => {
        stderr.write(`[guarded-build] Process-tree termination failed: ${error.message}\n`);
        try {
          child.kill("SIGKILL");
        } catch {
          // The force-exit timer below is the final backstop.
        }
      });

      forceExit = setTimeout(() => {
        child.stdout?.destroy();
        child.stderr?.destroy();
        child.unref();
        finish({
          exitCode: TIMEOUT_EXIT_CODE,
          error: new Error("Timed out while waiting for process tree termination."),
          signal: "TIMEOUT",
          timedOut: true,
        });
      }, killGraceMs);
    }, step.timeoutMs);
  });
}

export async function terminateProcessTree(pid, options = {}) {
  if (!pid) return;

  const platform = options.platform ?? process.platform;
  const stderr = options.stderr ?? process.stderr;

  if (platform === "win32") {
    const result = await runTaskkill(pid);
    if (result.exitCode !== 0) {
      stderr.write(result.stderr);
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // Process may already be gone, or the OS may deny the fallback kill.
      }
    }
    return;
  }

  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      return;
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // Process exited during the grace window.
    }
  }
}

function runTaskkill(pid) {
  return new Promise((resolve) => {
    const child = spawn("taskkill.exe", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderr = "";
    const timeout = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // The caller has a final timeout as well.
      }
    }, DEFAULT_KILL_GRACE_MS);

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      resolve({ exitCode: 1, stderr: error.message });
    });

    child.on("exit", (code) => {
      clearTimeout(timeout);
      resolve({ exitCode: code ?? 1, stderr });
    });
  });
}

async function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const timeouts = getBuildTimeouts(process.env);
  const steps = createBuildSteps(repoRoot, process.env);

  console.log(
    `[guarded-build] Running build with hard timeouts: ` +
      `Next=${formatDuration(timeouts.nextBuildMs)}, ` +
      `postprocess=${formatDuration(timeouts.postprocessMs)}.`,
  );

  for (const step of steps) {
    console.log(`[guarded-build] Starting ${step.label}.`);
    const result = await runCommandWithTimeout(step, {
      killGraceMs: timeouts.killGraceMs,
    });

    if (result.timedOut) {
      console.error(
        `[guarded-build] ${step.label} timed out. ` +
          "Stopped the child process tree instead of waiting forever.",
      );
      process.exit(TIMEOUT_EXIT_CODE);
    }

    if (result.error) {
      console.error(`[guarded-build] ${step.label} failed: ${result.error.message}`);
      process.exit(result.exitCode || 1);
    }

    if (result.exitCode !== 0) {
      console.error(`[guarded-build] ${step.label} exited with code ${result.exitCode}.`);
      process.exit(result.exitCode || 1);
    }

    console.log(`[guarded-build] Finished ${step.label}.`);
  }
}

const invokedScriptUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;

if (import.meta.url === invokedScriptUrl) {
  main().catch((error) => {
    console.error(`[guarded-build] Unexpected failure: ${error.message}`);
    process.exit(1);
  });
}
