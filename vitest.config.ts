import { defineConfig } from "vitest/config";

// Standalone from electron.vite.config.ts — Vitest doesn't read electron-vite's
// multi-target config shape. Tests cover pure logic only (model serialization,
// text layout math, reference formatting…), never components, so plain Node
// is enough: no jsdom, no SCSS transform.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/renderer/src/**/*.test.ts"]
  }
});
