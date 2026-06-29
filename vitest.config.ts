import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ViteUserConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const repoAlias = path.resolve(repoRoot);
const reactJsxTransform = {
  jsx: {
    importSource: "react",
    runtime: "automatic",
  },
} as const;

const config = {
  oxc: reactJsxTransform,
  resolve: {
    alias: {
      "@": repoAlias
    }
  },
  test: {
    projects: [
      {
        oxc: reactJsxTransform,
        resolve: {
          alias: {
            "@": repoAlias
          }
        },
        test: {
          environment: "node",
          exclude: ["tests/dom/**/*.test.ts", "tests/dom/**/*.test.tsx"],
          fileParallelism: false,
          include: ["tests/**/*.test.ts"],
          name: "node",
          pool: "threads",
        },
      },
      {
        oxc: reactJsxTransform,
        resolve: {
          alias: {
            "@": repoAlias
          }
        },
        test: {
          environment: "jsdom",
          fileParallelism: false,
          include: ["tests/dom/**/*.test.ts", "tests/dom/**/*.test.tsx"],
          name: "dom",
          pool: "threads",
          setupFiles: ["tests/dom/setup.ts"],
        },
      },
    ],
  }
} satisfies ViteUserConfig;

export default config;
