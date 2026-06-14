import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
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
});
