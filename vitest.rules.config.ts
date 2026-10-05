import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Rules tests share emulator instances; run files sequentially for stability.
    fileParallelism: false,
  },
});
