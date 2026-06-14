import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ViteUserConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

const config = {
  resolve: {
    alias: {
      "@": path.resolve(repoRoot)
    }
  },
  test: {
    environment: "node",
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    pool: "threads"
  }
} satisfies ViteUserConfig;

export default config;
