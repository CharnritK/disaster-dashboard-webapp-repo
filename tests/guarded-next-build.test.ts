import { describe, expect, it } from "vitest";
import path from "node:path";
import { EventEmitter } from "node:events";

import {
  DEFAULT_NEXT_BUILD_TIMEOUT_MS,
  DEFAULT_POSTPROCESS_TIMEOUT_MS,
  TIMEOUT_EXIT_CODE,
  createBuildSteps,
  formatDuration,
  formatStepError,
  getBuildTimeouts,
  isSpawnPermissionError,
  runCommandWithTimeout,
} from "../scripts/guarded-next-build.mjs";

const silentStream = {
  write() {
    return true;
  },
};

function createFakeChildProcess() {
  const child = new EventEmitter() as EventEmitter & {
    killed: boolean;
    pid: number;
    stderr: EventEmitter & { destroy: () => void };
    stdout: EventEmitter & { destroy: () => void };
    kill: () => void;
    unref: () => void;
  };
  child.killed = false;
  child.pid = 12345;
  child.stderr = Object.assign(new EventEmitter(), { destroy() {} });
  child.stdout = Object.assign(new EventEmitter(), { destroy() {} });
  child.kill = () => {
    child.killed = true;
  };
  child.unref = () => {};
  return child;
}

describe("guarded Next build script", () => {
  it("uses bounded defaults and accepts explicit timeout overrides", () => {
    expect(getBuildTimeouts({})).toMatchObject({
      nextBuildMs: DEFAULT_NEXT_BUILD_TIMEOUT_MS,
      postprocessMs: DEFAULT_POSTPROCESS_TIMEOUT_MS,
    });

    expect(
      getBuildTimeouts({
        BUILD_KILL_GRACE_MS: "1200",
        BUILD_POSTPROCESS_TIMEOUT_MS: "2000",
        NEXT_BUILD_TIMEOUT_MS: "3000",
      }),
    ).toMatchObject({
      killGraceMs: 1200,
      nextBuildMs: 3000,
      postprocessMs: 2000,
    });

    expect(
      getBuildTimeouts({
        BUILD_POSTPROCESS_TIMEOUT_MS: "-1",
        NEXT_BUILD_TIMEOUT_MS: "not-a-number",
      }),
    ).toMatchObject({
      nextBuildMs: DEFAULT_NEXT_BUILD_TIMEOUT_MS,
      postprocessMs: DEFAULT_POSTPROCESS_TIMEOUT_MS,
    });
  });

  it("constructs the existing build pipeline behind the guard", () => {
    const repoRoot = path.resolve("C:/repo/example");
    const steps = createBuildSteps(repoRoot, {
      BUILD_POSTPROCESS_TIMEOUT_MS: "2000",
      NEXT_BUILD_TIMEOUT_MS: "3000",
    });

    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({
      args: [path.join(repoRoot, "node_modules", "next", "dist", "bin", "next"), "build"],
      command: process.execPath,
      cwd: repoRoot,
      label: "Next production build",
      timeoutMs: 3000,
    });
    expect(steps[1]).toMatchObject({
      args: [path.join(repoRoot, "scripts", "prepare-sites-dist.mjs")],
      command: process.execPath,
      cwd: repoRoot,
      label: "Codex Sites dist post-processing",
      timeoutMs: 2000,
    });
  });

  it("terminates a child process instead of waiting forever", async () => {
    const result = await runCommandWithTimeout(
      {
        args: ["-e", "setInterval(() => {}, 1000)"],
        command: process.execPath,
        cwd: process.cwd(),
        label: "intentional hang",
        timeoutMs: 10,
      },
      {
        killGraceMs: 10,
        stderr: silentStream,
        stdout: silentStream,
        spawnImpl: () => createFakeChildProcess(),
        terminateProcessTreeImpl: async () => {},
      },
    );

    expect(result).toMatchObject({
      exitCode: TIMEOUT_EXIT_CODE,
      timedOut: true,
    });
  });

  it("returns a clean result when the child process exits before the timeout", async () => {
    const result = await runCommandWithTimeout(
      {
        args: ["-e", "process.exit(0)"],
        command: process.execPath,
        cwd: process.cwd(),
        label: "quick success",
        timeoutMs: 5000,
      },
      {
        stderr: silentStream,
        spawnImpl: () => {
          const child = createFakeChildProcess();
          setTimeout(() => child.emit("exit", 0, null), 0);
          return child;
        },
        stdout: silentStream,
      },
    );

    expect(result).toMatchObject({
      exitCode: 0,
      timedOut: false,
    });
  });

  it("formats durations for readable failure output", () => {
    expect(formatDuration(60000)).toBe("1m");
    expect(formatDuration(5000)).toBe("5s");
    expect(formatDuration(250)).toBe("250ms");
  });

  it("returns a failed result when the child process cannot spawn", async () => {
    const result = await runCommandWithTimeout(
      {
        args: ["-e", "process.exit(0)"],
        command: process.execPath,
        cwd: process.cwd(),
        label: "spawn denied",
        timeoutMs: 5000,
      },
      {
        stderr: silentStream,
        spawnImpl: () => {
          const error = new Error("spawn EPERM") as Error & { code: string };
          error.code = "EPERM";
          throw error;
        },
        stdout: silentStream,
      },
    );

    expect(result).toMatchObject({
      exitCode: 1,
      timedOut: false,
    });
    expect(result.error).toMatchObject({
      code: "EPERM",
    });
  });

  it("formats child-process permission failures as runner issues", () => {
    const error = new Error("spawn C:\\Program Files\\nodejs\\node.exe EPERM") as Error & {
      code: string;
      syscall: string;
    };
    error.code = "EPERM";
    error.syscall = "spawn C:\\Program Files\\nodejs\\node.exe";

    expect(isSpawnPermissionError(error)).toBe(true);
    expect(formatStepError({ label: "Next production build" }, error)).toContain(
      "runner/permission problem",
    );
    expect(formatStepError({ label: "Next production build" }, error)).toContain(
      "not evidence of a Next.js, TypeScript, or app-code build failure",
    );
  });
});
